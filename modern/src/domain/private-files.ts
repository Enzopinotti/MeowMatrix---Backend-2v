import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import type {
  PrivateFileDto,
  PrivateFilePurpose,
  PrivateFileStatus,
} from "../api/file-contracts.js";
import type { UserDto } from "../api/contracts.js";
import { ApiError } from "../api/errors.js";

export type VerifiedMediaType = PrivateFileDto["mediaType"];

export type PrivateFileRecord = {
  id: string;
  ownerId: string;
  purpose: PrivateFilePurpose;
  originalName: string;
  mediaType: VerifiedMediaType;
  bytes: number;
  sha256: string;
  storageKey: string;
  status: PrivateFileStatus;
  slotKey: "current" | null;
  createdAt: number;
  activatedAt: number | null;
  deletedAt: number | null;
};

export type ReservePrivateFile = Omit<
  PrivateFileRecord,
  "id" | "status" | "slotKey" | "activatedAt" | "deletedAt"
>;

export interface PrivateFileRepository {
  reserve(input: ReservePrivateFile): Promise<PrivateFileRecord>;
  activate(id: string): Promise<PrivateFileRecord>;
  releaseReservation(id: string): Promise<void>;
  listActive(ownerId: string): Promise<readonly PrivateFileRecord[]>;
  findById(id: string): Promise<PrivateFileRecord | null>;
  beginDelete(id: string): Promise<PrivateFileRecord | null>;
  markDeleted(id: string): Promise<void>;
  findRecoverable(now: number, staleStagingBefore: number): Promise<readonly PrivateFileRecord[]>;
}

export interface PrivateBlobStorage {
  put(storageKey: string, content: Buffer): Promise<void>;
  read(storageKey: string): Promise<Buffer | null>;
  delete(storageKey: string): Promise<void>;
}

export type PrivateFileUpload = {
  originalName: string;
  declaredMediaType: string;
  buffer: Buffer;
};

export type PrivateFileDownload = {
  metadata: PrivateFileDto;
  content: Buffer;
};

export interface PrivateFileService {
  upload(
    user: UserDto,
    purpose: PrivateFilePurpose,
    upload: PrivateFileUpload,
  ): Promise<PrivateFileDto>;
  list(user: UserDto, ownerId: string | null): Promise<readonly PrivateFileDto[]>;
  getMetadata(user: UserDto, fileId: string): Promise<PrivateFileDto | null>;
  download(user: UserDto, fileId: string): Promise<PrivateFileDownload | null>;
  delete(user: UserDto, fileId: string): Promise<boolean>;
  recoverPendingDeletes(now?: number): Promise<number>;
}

const MiB = 1024 * 1024;

export const purposePolicies: Readonly<
  Record<
    PrivateFilePurpose,
    { maxBytes: number; mediaTypes: readonly VerifiedMediaType[] }
  >
> = {
  avatar: {
    maxBytes: 2 * MiB,
    mediaTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "premium-identification": {
    maxBytes: 5 * MiB,
    mediaTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
  "premium-address": {
    maxBytes: 5 * MiB,
    mediaTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
  "premium-bank-statement": {
    maxBytes: 5 * MiB,
    mediaTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
};

const extensionsByMediaType: Readonly<Record<VerifiedMediaType, readonly string[]>> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

function startsWithBytes(buffer: Buffer, bytes: readonly number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function detectVerifiedMediaType(buffer: Buffer): VerifiedMediaType | null {
  if (buffer.length >= 3 && startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  return null;
}

export function safeDisplayName(originalName: string): string {
  const normalized = path
    .basename(originalName.replaceAll("\\", "/"))
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  const candidate = normalized || "archivo";
  return [...candidate].slice(0, 120).join("");
}

function normalizeDeclaredMediaType(value: string): string {
  return value.trim().toLowerCase().split(";", 1)[0] ?? "";
}

export function verifyUpload(
  purpose: PrivateFilePurpose,
  upload: PrivateFileUpload,
): {
  originalName: string;
  mediaType: VerifiedMediaType;
  bytes: number;
  sha256: string;
} {
  const policy = purposePolicies[purpose];
  if (upload.buffer.length < 1) {
    throw new ApiError(400, "FILE_EMPTY", "Uploaded file is empty");
  }
  if (upload.buffer.length > policy.maxBytes) {
    throw new ApiError(
      413,
      "FILE_TOO_LARGE",
      `File exceeds the ${policy.maxBytes} byte limit for this purpose`,
    );
  }

  const mediaType = detectVerifiedMediaType(upload.buffer);
  if (mediaType === null || !policy.mediaTypes.includes(mediaType)) {
    throw new ApiError(
      415,
      "FILE_TYPE_NOT_ALLOWED",
      "File content is not an allowed type for this purpose",
    );
  }
  if (normalizeDeclaredMediaType(upload.declaredMediaType) !== mediaType) {
    throw new ApiError(
      415,
      "FILE_TYPE_MISMATCH",
      "Declared Content-Type does not match verified file content",
    );
  }

  const originalName = safeDisplayName(upload.originalName);
  const extension = path.extname(originalName).toLowerCase();
  if (!extensionsByMediaType[mediaType].includes(extension)) {
    throw new ApiError(
      415,
      "FILE_EXTENSION_MISMATCH",
      "Filename extension does not match verified file content",
    );
  }

  return {
    originalName,
    mediaType,
    bytes: upload.buffer.length,
    sha256: createHash("sha256").update(upload.buffer).digest("hex"),
  };
}

export function privateFileDto(record: PrivateFileRecord): PrivateFileDto {
  return {
    id: record.id,
    ownerId: record.ownerId,
    purpose: record.purpose,
    originalName: record.originalName,
    mediaType: record.mediaType,
    bytes: record.bytes,
    sha256: record.sha256,
    createdAt: new Date(record.createdAt).toISOString(),
  };
}

function canRead(user: UserDto, record: PrivateFileRecord): boolean {
  return user.role === "admin" || record.ownerId === user.id;
}

export function createPrivateFileService(options: {
  repository: PrivateFileRepository;
  storage: PrivateBlobStorage;
  stagingRecoveryMs?: number;
}): PrivateFileService {
  const stagingRecoveryMs = options.stagingRecoveryMs ?? 10 * 60 * 1000;

  return {
    async upload(user, purpose, upload) {
      const verified = verifyUpload(purpose, upload);
      const storageKey = randomBytes(32).toString("hex");
      const record = await options.repository.reserve({
        ownerId: user.id,
        purpose,
        ...verified,
        storageKey,
        createdAt: Date.now(),
      });

      try {
        await options.storage.put(storageKey, upload.buffer);
        return privateFileDto(await options.repository.activate(record.id));
      } catch (error) {
        try {
          await options.storage.delete(storageKey);
          await options.repository.releaseReservation(record.id);
        } catch {
          // Keep the reservation in staging so the recovery sweep retains a
          // durable pointer to any blob that could not be cleaned up now.
        }
        throw error;
      }
    },

    async list(user, ownerId) {
      const targetOwnerId = ownerId ?? user.id;
      if (targetOwnerId !== user.id && user.role !== "admin") {
        throw new ApiError(403, "FILE_SCOPE_FORBIDDEN", "File scope is forbidden");
      }
      return (await options.repository.listActive(targetOwnerId)).map(privateFileDto);
    },

    async getMetadata(user, fileId) {
      const record = await options.repository.findById(fileId);
      if (record === null || record.status !== "active" || !canRead(user, record)) {
        return null;
      }
      return privateFileDto(record);
    },

    async download(user, fileId) {
      const record = await options.repository.findById(fileId);
      if (record === null || record.status !== "active" || !canRead(user, record)) {
        return null;
      }
      const content = await options.storage.read(record.storageKey);
      if (content === null) {
        throw ApiError.unavailable(
          "PRIVATE_STORAGE_INCONSISTENT",
          "Private file content is temporarily unavailable",
        );
      }
      const actualHash = createHash("sha256").update(content).digest("hex");
      if (actualHash !== record.sha256 || content.length !== record.bytes) {
        throw ApiError.unavailable(
          "PRIVATE_STORAGE_INTEGRITY_ERROR",
          "Private file integrity verification failed",
        );
      }
      return { metadata: privateFileDto(record), content };
    },

    async delete(user, fileId) {
      const record = await options.repository.findById(fileId);
      if (record === null || record.status !== "active" || !canRead(user, record)) {
        return false;
      }
      const deleting = await options.repository.beginDelete(fileId);
      if (deleting === null) return false;
      await options.storage.delete(deleting.storageKey);
      await options.repository.markDeleted(fileId);
      return true;
    },

    async recoverPendingDeletes(now = Date.now()) {
      const records = await options.repository.findRecoverable(
        now,
        now - stagingRecoveryMs,
      );
      let recovered = 0;
      for (const record of records) {
        try {
          await options.storage.delete(record.storageKey);
          await options.repository.markDeleted(record.id);
          recovered += 1;
        } catch {
          // Recovery is best-effort per item; a later sweep retries it.
        }
      }
      return recovered;
    },
  };
}

export const unavailablePrivateFileService: PrivateFileService = {
  async upload() {
    throw ApiError.unavailable(
      "PRIVATE_FILES_UNAVAILABLE",
      "Private file storage is not configured",
    );
  },
  async list() {
    throw ApiError.unavailable(
      "PRIVATE_FILES_UNAVAILABLE",
      "Private file storage is not configured",
    );
  },
  async getMetadata() {
    throw ApiError.unavailable(
      "PRIVATE_FILES_UNAVAILABLE",
      "Private file storage is not configured",
    );
  },
  async download() {
    throw ApiError.unavailable(
      "PRIVATE_FILES_UNAVAILABLE",
      "Private file storage is not configured",
    );
  },
  async delete() {
    throw ApiError.unavailable(
      "PRIVATE_FILES_UNAVAILABLE",
      "Private file storage is not configured",
    );
  },
  async recoverPendingDeletes() {
    return 0;
  },
};
