import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AuthService } from "../src/domain/auth.js";
import {
  createPrivateFileService,
  safeDisplayName,
  type PrivateBlobStorage,
  type PrivateFileRecord,
  type PrivateFileRepository,
  type ReservePrivateFile,
} from "../src/domain/private-files.js";
import type { UserDto } from "../src/api/contracts.js";
import { ApiError } from "../src/api/errors.js";

const owner: UserDto = {
  id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  name: "Owner",
  lastName: "User",
  email: "owner@example.test",
  role: "user",
  avatarUrl: null,
};
const other: UserDto = {
  ...owner,
  id: "bbbbbbbbbbbbbbbbbbbbbbbb",
  name: "Other",
  email: "other@example.test",
};
const admin: UserDto = {
  ...owner,
  id: "cccccccccccccccccccccccc",
  name: "Admin",
  email: "admin@example.test",
  role: "admin",
};

class MemoryFiles implements PrivateFileRepository {
  private readonly records = new Map<string, PrivateFileRecord>();
  private next = 1;

  async reserve(input: ReservePrivateFile): Promise<PrivateFileRecord> {
    for (const record of this.records.values()) {
      if (
        record.ownerId === input.ownerId &&
        record.purpose === input.purpose &&
        record.slotKey === "current"
      ) {
        throw ApiError.conflict(
          "FILE_PURPOSE_ALREADY_EXISTS",
          "An active file already exists for this purpose; delete it before replacing it",
        );
      }
    }
    const id = this.next.toString(16).padStart(24, "0");
    this.next += 1;
    const record: PrivateFileRecord = {
      ...input,
      id,
      status: "staging",
      slotKey: "current",
      activatedAt: null,
      deletedAt: null,
    };
    this.records.set(id, record);
    return structuredClone(record);
  }

  async activate(id: string): Promise<PrivateFileRecord> {
    const record = this.records.get(id);
    if (!record || record.status !== "staging") {
      throw new Error("missing staging file");
    }
    record.status = "active";
    record.activatedAt = Date.now();
    return structuredClone(record);
  }

  async releaseReservation(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = "deleted";
    record.slotKey = null;
    record.deletedAt = Date.now();
  }

  async listActive(ownerId: string): Promise<readonly PrivateFileRecord[]> {
    return [...this.records.values()]
      .filter(
        (record) => record.ownerId === ownerId && record.status === "active",
      )
      .map((record) => structuredClone(record));
  }

  async findById(id: string): Promise<PrivateFileRecord | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  async beginDelete(id: string): Promise<PrivateFileRecord | null> {
    const record = this.records.get(id);
    if (!record || record.status !== "active") return null;
    record.status = "deleting";
    return structuredClone(record);
  }

  async markDeleted(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = "deleted";
    record.slotKey = null;
    record.deletedAt = Date.now();
  }

  async findRecoverable(
    _now: number,
    staleStagingBefore: number,
  ): Promise<readonly PrivateFileRecord[]> {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.status === "deleting" ||
          (record.status === "staging" &&
            record.createdAt <= staleStagingBefore),
      )
      .map((record) => structuredClone(record));
  }
}

class MemoryStorage implements PrivateBlobStorage {
  readonly blobs = new Map<string, Buffer>();

  async put(key: string, content: Buffer): Promise<void> {
    this.blobs.set(key, Buffer.from(content));
  }
  async read(key: string): Promise<Buffer | null> {
    const value = this.blobs.get(key);
    return value ? Buffer.from(value) : null;
  }
  async delete(key: string): Promise<void> {
    this.blobs.delete(key);
  }
}

function authService(): AuthService {
  return {
    async currentUser(token) {
      if (token === "owner-token") return owner;
      if (token === "other-token") return other;
      if (token === "admin-token") return admin;
      throw new ApiError(401, "SESSION_INVALID", "Authentication required");
    },
    async register() {
      throw new Error("not used");
    },
    async login() {
      throw new Error("not used");
    },
    async logout() {},
    async requestPasswordReset() {},
    async confirmPasswordReset() {},
  };
}

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03,
]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x01, 0x02, 0x03]);

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
  );
});

async function harness() {
  const repository = new MemoryFiles();
  const storage = new MemoryStorage();
  const files = createPrivateFileService({ repository, storage });
  const app = createApp({
    authService: authService(),
    privateFileService: files,
    allowedOrigins: ["http://frontend.test"],
    readinessProbe: async () => ({
      ready: true,
      checks: {
        database: "ok",
        privateStorage: "ok",
        outboxWorker: "ok",
        fileCleanupWorker: "ok",
      },
    }),
  });
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return {
    repository,
    storage,
    files,
    base: `http://127.0.0.1:${address.port}`,
  };
}

function session(token: string, mutate = false): HeadersInit {
  return {
    Cookie: `meow_session=${token}`,
    ...(mutate ? { Origin: "http://frontend.test" } : {}),
  };
}

async function upload(
  base: string,
  purpose: string,
  bytes: Buffer,
  mediaType: string,
  name: string,
  token = "owner-token",
  origin = "http://frontend.test",
) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([Uint8Array.from(bytes)], { type: mediaType }),
    name,
  );
  return fetch(`${base}/api/v1/files/purposes/${purpose}`, {
    method: "POST",
    headers: {
      Cookie: `meow_session=${token}`,
      Origin: origin,
    },
    body: form,
  });
}

describe("B5 private files", () => {
  it("sanitizes traversal-shaped display names independently from storage keys", () => {
    expect(safeDisplayName("../../secret/../avatar.png")).toBe("avatar.png");
    expect(safeDisplayName("..\\..\\bank.pdf")).toBe("bank.pdf");
  });

  it("uploads verified media and never exposes the storage key", async () => {
    const { base } = await harness();
    const response = await upload(
      base,
      "avatar",
      png,
      "image/png",
      "avatar.png",
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data.ownerId).toBe(owner.id);
    expect(body.data.mediaType).toBe("image/png");
    expect(body.data).not.toHaveProperty("storageKey");
    expect(body.data).not.toHaveProperty("status");
  });

  it("rejects spoofed MIME/content, bad extensions, and oversized avatar bodies", async () => {
    const { base } = await harness();
    const spoofed = await upload(
      base,
      "avatar",
      jpeg,
      "image/png",
      "avatar.png",
    );
    expect(spoofed.status).toBe(415);
    expect(
      ((await spoofed.json()) as { error: { code: string } }).error.code,
    ).toBe("FILE_TYPE_MISMATCH");

    const wrongExtension = await upload(
      base,
      "avatar",
      png,
      "image/png",
      "avatar.jpg",
    );
    expect(wrongExtension.status).toBe(415);
    expect(
      ((await wrongExtension.json()) as { error: { code: string } }).error.code,
    ).toBe("FILE_EXTENSION_MISMATCH");

    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);
    png.copy(oversized, 0);
    const tooLarge = await upload(
      base,
      "avatar",
      oversized,
      "image/png",
      "large.png",
    );
    expect(tooLarge.status).toBe(413);
    expect(
      ((await tooLarge.json()) as { error: { code: string } }).error.code,
    ).toBe("FILE_TOO_LARGE");
  });

  it("enforces authenticated exact-origin mutation boundaries", async () => {
    const { base } = await harness();
    const evilOrigin = await upload(
      base,
      "avatar",
      png,
      "image/png",
      "avatar.png",
      "owner-token",
      "https://evil.example",
    );
    expect(evilOrigin.status).toBe(403);

    const form = new FormData();
    form.append(
      "file",
      new Blob([Uint8Array.from(png)], { type: "image/png" }),
      "avatar.png",
    );
    const anonymous = await fetch(`${base}/api/v1/files/purposes/avatar`, {
      method: "POST",
      headers: { Origin: "http://frontend.test" },
      body: form,
    });
    expect(anonymous.status).toBe(401);
  });

  it("returns 409 rather than overwriting an existing current-purpose file", async () => {
    const { base } = await harness();
    expect(
      (await upload(base, "avatar", png, "image/png", "one.png")).status,
    ).toBe(201);
    const duplicate = await upload(base, "avatar", png, "image/png", "two.png");
    expect(duplicate.status).toBe(409);
    expect(
      ((await duplicate.json()) as { error: { code: string } }).error.code,
    ).toBe("FILE_PURPOSE_ALREADY_EXISTS");
  });

  it("returns 404 rather than leaking another user's private file", async () => {
    const { base } = await harness();
    const created = await upload(
      base,
      "avatar",
      png,
      "image/png",
      "avatar.png",
    );
    const createdBody = (await created.json()) as { data: { id: string } };
    const foreign = await fetch(`${base}/api/v1/files/${createdBody.data.id}`, {
      headers: session("other-token"),
    });
    expect(foreign.status).toBe(404);
  });

  it("serves private downloads with safe headers and supports owner deletion", async () => {
    const { base } = await harness();
    const created = await upload(
      base,
      "premium-identification",
      png,
      "image/png",
      "identidad.png",
    );
    const { data } = (await created.json()) as { data: { id: string } };

    const download = await fetch(`${base}/api/v1/files/${data.id}/content`, {
      headers: session("owner-token"),
    });
    expect(download.status).toBe(200);
    expect(download.headers.get("cache-control")).toBe("private, no-store");
    expect(download.headers.get("x-content-type-options")).toBe("nosniff");
    expect(download.headers.get("content-disposition")).toContain("attachment");
    expect(download.headers.get("content-disposition")).toContain(
      "identidad.png",
    );
    expect(Buffer.from(await download.arrayBuffer())).toEqual(png);

    const deleted = await fetch(`${base}/api/v1/files/${data.id}`, {
      method: "DELETE",
      headers: session("owner-token", true),
    });
    expect(deleted.status).toBe(204);

    const gone = await fetch(`${base}/api/v1/files/${data.id}`, {
      headers: session("owner-token"),
    });
    expect(gone.status).toBe(404);
  });

  it("restricts owner-scoped listings while allowing explicit admin scope", async () => {
    const { base } = await harness();
    await upload(base, "avatar", png, "image/png", "avatar.png");

    const forbidden = await fetch(`${base}/api/v1/files?ownerId=${owner.id}`, {
      headers: session("other-token"),
    });
    expect(forbidden.status).toBe(403);

    const adminList = await fetch(`${base}/api/v1/files?ownerId=${owner.id}`, {
      headers: session("admin-token"),
    });
    expect(adminList.status).toBe(200);
    const body = (await adminList.json()) as { data: { items: unknown[] } };
    expect(body.data.items).toHaveLength(1);
  });
});
