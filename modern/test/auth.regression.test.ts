import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { parseLoginRequest } from "../src/api/auth-contracts.js";
import { ApiError } from "../src/api/errors.js";
import {
  createAuthService,
  DuplicateAuthEmailError,
  type AuthUserRecord,
  type AuthUserRepository,
  type CreateAuthUser,
  type PasswordResetStore,
  type SessionRecord,
  type SessionStore,
} from "../src/domain/auth.js";

class AtomicMemoryUsers implements AuthUserRepository {
  private readonly users = new Map<string, AuthUserRecord>();
  private sequence = 0;

  async findByEmail(email: string) {
    return this.users.get(email) ?? null;
  }

  async findById(id: string) {
    return [...this.users.values()].find((user) => user.id === id) ?? null;
  }

  async create(input: CreateAuthUser) {
    if (this.users.has(input.email)) throw new DuplicateAuthEmailError();
    const user: AuthUserRecord = {
      ...input,
      id: `user-${++this.sequence}`,
      role: "user",
      avatarUrl: null,
    };
    this.users.set(user.email, user);
    return user;
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    const user = await this.findById(userId);
    if (!user) throw new Error("missing test user");
    user.passwordHash = passwordHash;
  }

  seed(user: AuthUserRecord) {
    this.users.set(user.email, user);
  }
}

class MemorySessions implements SessionStore {
  records: SessionRecord[] = [];

  async put(session: SessionRecord) {
    this.records.push(session);
  }

  async get(tokenHash: string) {
    return this.records.find((record) => record.tokenHash === tokenHash) ?? null;
  }

  async delete(tokenHash: string) {
    this.records = this.records.filter((record) => record.tokenHash !== tokenHash);
  }

  async deleteForUser(userId: string) {
    this.records = this.records.filter((record) => record.userId !== userId);
  }
}

const resets: PasswordResetStore = {
  async replaceForUser() {},
  async consume() {
    return null;
  },
};

function serviceWith(users: AtomicMemoryUsers) {
  return createAuthService({
    users,
    sessions: new MemorySessions(),
    passwordResets: resets,
    notifier: { async send() {} },
  });
}

const registration = {
  name: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  password: "A sufficiently long passphrase 2026",
};

describe("B3 auth regressions", () => {
  it("translates an atomic duplicate identity rejection to 409", async () => {
    const users = new AtomicMemoryUsers();
    const auth = serviceWith(users);

    const results = await Promise.allSettled([
      auth.register(registration),
      auth.register(registration),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status).toBe("rejected");
    if (rejected?.status !== "rejected") return;
    expect(rejected.reason).toBeInstanceOf(ApiError);
    expect(rejected.reason).toMatchObject({
      status: 409,
      code: "EMAIL_ALREADY_REGISTERED",
    });
  });

  it("accepts a short historical bcrypt credential and upgrades it after login", async () => {
    const users = new AtomicMemoryUsers();
    const legacyPassword = "OldP4ss";
    users.seed({
      id: "legacy-user",
      name: "Legacy",
      lastName: "User",
      email: "legacy@example.com",
      role: "user",
      avatarUrl: null,
      passwordHash: await bcrypt.hash(legacyPassword, 10),
    });
    const auth = serviceWith(users);

    const parsed = parseLoginRequest({
      email: "LEGACY@example.com",
      password: legacyPassword,
    });
    expect(parsed.password).toBe(legacyPassword);

    await expect(auth.login(parsed)).resolves.toMatchObject({
      user: { id: "legacy-user", email: "legacy@example.com" },
    });

    const migrated = await users.findByEmail("legacy@example.com");
    expect(migrated?.passwordHash.startsWith("scrypt$v1$")).toBe(true);
  });

  it("keeps unknown-account login failures inside the auth error contract", async () => {
    const auth = serviceWith(new AtomicMemoryUsers());
    await expect(
      auth.login(parseLoginRequest({ email: "none@example.com", password: "x" })),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });
});
