import { ObjectId, type Collection, type Db } from "mongodb";
import type {
  PrivateFileRecord,
  PrivateFileRepository,
  ReservePrivateFile,
} from "../domain/private-files.js";
import { ApiError } from "../api/errors.js";
import type {
  PrivateFilePurpose,
  PrivateFileStatus,
} from "../api/file-contracts.js";

type PrivateFileDocument = {
  _id: ObjectId;
  ownerId: string;
  purpose: PrivateFilePurpose;
  originalName: string;
  mediaType: PrivateFileRecord["mediaType"];
  bytes: number;
  sha256: string;
  storageKey: string;
  status: PrivateFileStatus;
  slotKey?: "current";
  createdAt: Date;
  activatedAt: Date | null;
  deletedAt: Date | null;
};

function duplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function mapRecord(document: PrivateFileDocument): PrivateFileRecord {
  return {
    id: document._id.toHexString(),
    ownerId: document.ownerId,
    purpose: document.purpose,
    originalName: document.originalName,
    mediaType: document.mediaType,
    bytes: document.bytes,
    sha256: document.sha256,
    storageKey: document.storageKey,
    status: document.status,
    slotKey: document.slotKey ?? null,
    createdAt: document.createdAt.getTime(),
    activatedAt: document.activatedAt?.getTime() ?? null,
    deletedAt: document.deletedAt?.getTime() ?? null,
  };
}

export async function ensurePrivateFileIndexes(db: Db): Promise<void> {
  const files = db.collection<PrivateFileDocument>("private_files");
  await files.createIndexes([
    {
      key: { ownerId: 1, purpose: 1, slotKey: 1 },
      unique: true,
      partialFilterExpression: { slotKey: { $exists: true } },
      name: "private_file_current_slot_unique",
    },
    {
      key: { ownerId: 1, status: 1, createdAt: -1 },
      name: "private_file_owner_status",
    },
    {
      key: { status: 1, createdAt: 1 },
      name: "private_file_recovery",
    },
  ]);
}

export class MongoPrivateFileRepository implements PrivateFileRepository {
  private readonly files: Collection<PrivateFileDocument>;

  constructor(db: Db) {
    this.files = db.collection<PrivateFileDocument>("private_files");
  }

  async reserve(input: ReservePrivateFile): Promise<PrivateFileRecord> {
    const document: PrivateFileDocument = {
      _id: new ObjectId(),
      ownerId: input.ownerId,
      purpose: input.purpose,
      originalName: input.originalName,
      mediaType: input.mediaType,
      bytes: input.bytes,
      sha256: input.sha256,
      storageKey: input.storageKey,
      status: "staging",
      slotKey: "current",
      createdAt: new Date(input.createdAt),
      activatedAt: null,
      deletedAt: null,
    };
    try {
      await this.files.insertOne(document);
      return mapRecord(document);
    } catch (error) {
      if (duplicateKey(error)) {
        throw ApiError.conflict(
          "FILE_PURPOSE_ALREADY_EXISTS",
          "An active file already exists for this purpose; delete it before replacing it",
        );
      }
      throw error;
    }
  }

  async activate(id: string): Promise<PrivateFileRecord> {
    const _id = new ObjectId(id);
    const now = new Date();
    const document = await this.files.findOneAndUpdate(
      { _id, status: "staging", slotKey: "current" },
      { $set: { status: "active", activatedAt: now } },
      { returnDocument: "after" },
    );
    if (document === null) {
      throw new Error("Private file reservation could not be activated");
    }
    return mapRecord(document);
  }

  async releaseReservation(id: string): Promise<void> {
    await this.files.updateOne(
      { _id: new ObjectId(id), status: "staging" },
      {
        $set: { status: "deleted", deletedAt: new Date() },
        $unset: { slotKey: "" },
      },
    );
  }

  async listActive(ownerId: string): Promise<readonly PrivateFileRecord[]> {
    const documents = await this.files
      .find({ ownerId, status: "active" })
      .sort({ createdAt: -1 })
      .toArray();
    return documents.map(mapRecord);
  }

  async findById(id: string): Promise<PrivateFileRecord | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.files.findOne({ _id: new ObjectId(id) });
    return document === null ? null : mapRecord(document);
  }

  async beginDelete(id: string): Promise<PrivateFileRecord | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.files.findOneAndUpdate(
      { _id: new ObjectId(id), status: "active", slotKey: "current" },
      { $set: { status: "deleting" } },
      { returnDocument: "after" },
    );
    return document === null ? null : mapRecord(document);
  }

  async markDeleted(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;
    await this.files.updateOne(
      { _id: new ObjectId(id), status: { $in: ["staging", "deleting"] } },
      {
        $set: { status: "deleted", deletedAt: new Date() },
        $unset: { slotKey: "" },
      },
    );
  }

  async findRecoverable(
    _now: number,
    staleStagingBefore: number,
  ): Promise<readonly PrivateFileRecord[]> {
    const documents = await this.files
      .find({
        $or: [
          { status: "deleting" },
          {
            status: "staging",
            createdAt: { $lte: new Date(staleStagingBefore) },
          },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();
    return documents.map(mapRecord);
  }
}
