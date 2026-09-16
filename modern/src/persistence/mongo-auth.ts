import {
  MongoClient,
  ObjectId,
  type Collection,
  type Db,
  type Document,
} from "mongodb";
import {
  DuplicateAuthEmailError,
  type AuthUserRecord,
  type AuthUserRepository,
  type CreateAuthUser,
  type PasswordResetRecord,
  type PasswordResetStore,
  type SessionRecord,
  type SessionStore,
} from "../domain/auth.js";

const CASE_INSENSITIVE_EMAIL = Object.freeze({ locale: "en", strength: 2 });

type SessionDocument = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

type ResetDocument = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

function readRequiredString(document: Document, key: string): string {
  const value = document[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Mongo auth user is missing ${key}`);
  }
  return value;
}

function mapUser(document: Document): AuthUserRecord {
  const passwordHash =
    typeof document.password === "string"
      ? document.password
      : readRequiredString(document, "passwordHash");
  const avatarCandidate = document.avatarUrl ?? document.avatar;
  return {
    id: String(document._id),
    name: readRequiredString(document, "name"),
    lastName: typeof document.lastName === "string" ? document.lastName : "",
    email: readRequiredString(document, "email").trim().toLowerCase(),
    role:
      document.role === "admin" || document.rol === "admin" ? "admin" : "user",
    avatarUrl:
      typeof avatarCandidate === "string" && avatarCandidate.length > 0
        ? avatarCandidate
        : null,
    passwordHash,
  };
}

function objectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

class MongoAuthUsers implements AuthUserRepository {
  constructor(private readonly users: Collection<Document>) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const document = await this.users.findOne(
      { email },
      { collation: CASE_INSENSITIVE_EMAIL },
    );
    return document === null ? null : mapUser(document);
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const _id = objectId(id);
    if (_id === null) return null;
    const document = await this.users.findOne({ _id });
    return document === null ? null : mapUser(document);
  }

  async create(input: CreateAuthUser): Promise<AuthUserRecord> {
    const document = {
      name: input.name,
      lastName: input.lastName,
      email: input.email,
      password: input.passwordHash,
      rol: "usuario",
      avatar: "",
      documents: [],
      likes: [],
      wantPremium: false,
      last_connection: new Date(),
    };

    try {
      const result = await this.users.insertOne(document);
      return mapUser({ ...document, _id: result.insertedId });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === 11000
      ) {
        throw new DuplicateAuthEmailError();
      }
      throw error;
    }
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    const _id = objectId(userId);
    if (_id === null) throw new Error("Auth user id is not a valid ObjectId");
    const result = await this.users.updateOne(
      { _id },
      { $set: { password: passwordHash } },
    );
    if (result.matchedCount !== 1)
      throw new Error("Auth user no longer exists");
  }
}

class MongoSessions implements SessionStore {
  constructor(private readonly sessions: Collection<SessionDocument>) {}

  async put(session: SessionRecord): Promise<void> {
    await this.sessions.insertOne({
      tokenHash: session.tokenHash,
      userId: session.userId,
      expiresAt: new Date(session.expiresAt),
    });
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    const session = await this.sessions.findOne({ tokenHash });
    return session === null
      ? null
      : {
          tokenHash: session.tokenHash,
          userId: session.userId,
          expiresAt: session.expiresAt.getTime(),
        };
  }

  async delete(tokenHash: string): Promise<void> {
    await this.sessions.deleteOne({ tokenHash });
  }

  async deleteForUser(userId: string): Promise<void> {
    await this.sessions.deleteMany({ userId });
  }
}

class MongoPasswordResets implements PasswordResetStore {
  constructor(private readonly resets: Collection<ResetDocument>) {}

  async replaceForUser(record: PasswordResetRecord): Promise<void> {
    await this.resets.updateOne(
      { userId: record.userId },
      {
        $set: {
          tokenHash: record.tokenHash,
          userId: record.userId,
          expiresAt: new Date(record.expiresAt),
        },
      },
      { upsert: true },
    );
  }

  async consume(
    tokenHash: string,
    now: number,
  ): Promise<PasswordResetRecord | null> {
    const record = await this.resets.findOneAndDelete({
      tokenHash,
      expiresAt: { $gt: new Date(now) },
    });
    return record === null
      ? null
      : {
          tokenHash: record.tokenHash,
          userId: record.userId,
          expiresAt: record.expiresAt.getTime(),
        };
  }
}

async function ensureIndexes(db: Db): Promise<void> {
  await db.collection("users").createIndex(
    { email: 1 },
    {
      unique: true,
      name: "auth_email_unique_ci",
      collation: CASE_INSENSITIVE_EMAIL,
    },
  );
  await db.collection<SessionDocument>("auth_sessions").createIndexes([
    { key: { tokenHash: 1 }, unique: true, name: "token_hash_unique" },
    { key: { userId: 1 }, name: "session_user" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "session_ttl" },
  ]);
  await db.collection<ResetDocument>("auth_password_resets").createIndexes([
    { key: { tokenHash: 1 }, unique: true, name: "reset_token_hash_unique" },
    { key: { userId: 1 }, unique: true, name: "reset_user_unique" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "reset_ttl" },
  ]);
}

export async function connectMongoAuthPersistence(input: {
  url: string;
  dbName?: string;
}) {
  const client = new MongoClient(input.url, {
    appName: "meow-matrix-api-2026",
  });
  await client.connect();
  const db = input.dbName ? client.db(input.dbName) : client.db();

  try {
    await ensureIndexes(db);
  } catch (error) {
    await client.close();
    throw error;
  }

  return {
    client,
    db,
    users: new MongoAuthUsers(db.collection("users")),
    sessions: new MongoSessions(
      db.collection<SessionDocument>("auth_sessions"),
    ),
    passwordResets: new MongoPasswordResets(
      db.collection<ResetDocument>("auth_password_resets"),
    ),
  };
}
