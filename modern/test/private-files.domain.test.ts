import { describe, expect, it, vi } from "vitest";
import type { UserDto } from "../src/api/contracts.js";
import type { ApiError } from "../src/api/errors.js";
import {
  createPrivateFileService,
  type PrivateBlobStorage,
  type PrivateFileRecord,
  type PrivateFileRepository,
  type ReservePrivateFile,
} from "../src/domain/private-files.js";

const user: UserDto = {
  id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  name: "Owner",
  lastName: "User",
  email: "owner@example.test",
  role: "user",
  avatarUrl: null,
};

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03,
]);

function record(overrides: Partial<PrivateFileRecord> = {}): PrivateFileRecord {
  return {
    id: "bbbbbbbbbbbbbbbbbbbbbbbb",
    ownerId: user.id,
    purpose: "avatar",
    originalName: "avatar.png",
    mediaType: "image/png",
    bytes: png.length,
    sha256: "0".repeat(64),
    storageKey: "1".repeat(64),
    status: "staging",
    slotKey: "current",
    createdAt: 1_000,
    activatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function repositoryHarness(initial = record()) {
  const reserve = vi.fn(
    async (_input: ReservePrivateFile): Promise<PrivateFileRecord> => initial,
  );
  const activate = vi.fn(
    async (_id: string): Promise<PrivateFileRecord> => ({
      ...initial,
      status: "active",
      activatedAt: 2_000,
    }),
  );
  const releaseReservation = vi.fn(async (_id: string): Promise<void> => undefined);
  const listActive = vi.fn(async (_ownerId: string) => [] as PrivateFileRecord[]);
  const findById = vi.fn(async (_id: string): Promise<PrivateFileRecord | null> => initial);
  const beginDelete = vi.fn(async (_id: string): Promise<PrivateFileRecord | null> => initial);
  const markDeleted = vi.fn(async (_id: string): Promise<void> => undefined);
  const findRecoverable = vi.fn(
    async (
      _now: number,
      _staleBefore: number,
    ): Promise<readonly PrivateFileRecord[]> => [initial],
  );
  const repository: PrivateFileRepository = {
    reserve,
    activate,
    releaseReservation,
    listActive,
    findById,
    beginDelete,
    markDeleted,
    findRecoverable,
  };
  return {
    repository,
    reserve,
    activate,
    releaseReservation,
    findById,
    markDeleted,
    findRecoverable,
  };
}

function storageHarness() {
  const put = vi.fn(async (_key: string, _content: Buffer): Promise<void> => undefined);
  const read = vi.fn(async (_key: string): Promise<Buffer | null> => Buffer.from(png));
  const remove = vi.fn(async (_key: string): Promise<void> => undefined);
  const storage: PrivateBlobStorage = { put, read, delete: remove };
  return { storage, put, read, remove };
}

describe("B5 private file domain invariants", () => {
  it("keeps staging metadata recoverable when compensating blob deletion fails", async () => {
    const repo = repositoryHarness();
    const blobs = storageHarness();
    repo.activate.mockRejectedValueOnce(new Error("metadata activation failed"));
    blobs.remove.mockRejectedValueOnce(new Error("filesystem unavailable"));
    const service = createPrivateFileService({
      repository: repo.repository,
      storage: blobs.storage,
    });

    await expect(
      service.upload(user, "avatar", {
        originalName: "avatar.png",
        declaredMediaType: "image/png",
        buffer: png,
      }),
    ).rejects.toThrow("metadata activation failed");

    expect(blobs.remove).toHaveBeenCalledTimes(1);
    expect(repo.releaseReservation).not.toHaveBeenCalled();
  });

  it("releases staging metadata after successful compensation", async () => {
    const repo = repositoryHarness();
    const blobs = storageHarness();
    repo.activate.mockRejectedValueOnce(new Error("metadata activation failed"));
    const service = createPrivateFileService({
      repository: repo.repository,
      storage: blobs.storage,
    });

    await expect(
      service.upload(user, "avatar", {
        originalName: "avatar.png",
        declaredMediaType: "image/png",
        buffer: png,
      }),
    ).rejects.toThrow("metadata activation failed");

    expect(blobs.remove).toHaveBeenCalledTimes(1);
    expect(repo.releaseReservation).toHaveBeenCalledWith(
      "bbbbbbbbbbbbbbbbbbbbbbbb",
    );
  });

  it("never returns bytes whose checksum no longer matches metadata", async () => {
    const active = record({
      status: "active",
      sha256: "f".repeat(64),
      activatedAt: 2_000,
    });
    const repo = repositoryHarness(active);
    const blobs = storageHarness();
    const service = createPrivateFileService({
      repository: repo.repository,
      storage: blobs.storage,
    });

    await expect(service.download(user, active.id)).rejects.toMatchObject({
      status: 503,
      code: "PRIVATE_STORAGE_INTEGRITY_ERROR",
    } satisfies Partial<ApiError>);
  });

  it("recovers stale staging metadata only after physical cleanup succeeds", async () => {
    const stale = record({ createdAt: 1_000, status: "staging" });
    const repo = repositoryHarness(stale);
    const blobs = storageHarness();
    const service = createPrivateFileService({
      repository: repo.repository,
      storage: blobs.storage,
      stagingRecoveryMs: 10_000,
    });

    await expect(service.recoverPendingDeletes(20_000)).resolves.toBe(1);
    expect(repo.findRecoverable).toHaveBeenCalledWith(20_000, 10_000);
    expect(blobs.remove).toHaveBeenCalledWith(stale.storageKey);
    expect(repo.markDeleted).toHaveBeenCalledWith(stale.id);
  });
});
