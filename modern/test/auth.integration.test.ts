import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ApiError } from "../src/api/errors.js";
import {
  createAuthService,
  type AuthService,
  type AuthUserRecord,
  type AuthUserRepository,
  type CreateAuthUser,
  type PasswordResetNotifier,
  type PasswordResetRecord,
  type PasswordResetStore,
  type SessionRecord,
  type SessionStore,
} from "../src/domain/auth.js";

class MemoryUsers implements AuthUserRepository {
  private readonly byId = new Map<string, AuthUserRecord>();
  private nextId = 1;

  async findByEmail(email: string) {
    return (
      [...this.byId.values()].find((user) => user.email === email) ?? null
    );
  }

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }

  async create(input: CreateAuthUser) {
    const user: AuthUserRecord = {
      ...input,
      id: `user-${this.nextId++}`,
      role: "user",
      avatarUrl: null,
    };
    this.byId.set(user.id, user);
    return user;
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    const user = this.byId.get(userId);
    if (!user) throw new Error("missing test user");
    this.byId.set(userId, { ...user, passwordHash });
  }
}

class MemorySessions implements SessionStore {
  readonly records = new Map<string, SessionRecord>();
  lastTokenHash: string | null = null;

  async put(session: SessionRecord) {
    this.records.set(session.tokenHash, session);
    this.lastTokenHash = session.tokenHash;
  }

  async get(tokenHash: string) {
    return this.records.get(tokenHash) ?? null;
  }

  async delete(tokenHash: string) {
    this.records.delete(tokenHash);
  }

  async deleteForUser(userId: string) {
    for (const [tokenHash, session] of this.records) {
      if (session.userId === userId) this.records.delete(tokenHash);
    }
  }
}

class MemoryResets implements PasswordResetStore {
  readonly records = new Map<string, PasswordResetRecord>();
  lastTokenHash: string | null = null;

  async replaceForUser(record: PasswordResetRecord) {
    for (const [tokenHash, existing] of this.records) {
      if (existing.userId === record.userId) this.records.delete(tokenHash);
    }
    this.records.set(record.tokenHash, record);
    this.lastTokenHash = record.tokenHash;
  }

  async consume(tokenHash: string, now: number) {
    const record = this.records.get(tokenHash) ?? null;
    if (record === null) return null;
    this.records.delete(tokenHash);
    return record.expiresAt > now ? record : null;
  }
}

class MemoryNotifier implements PasswordResetNotifier {
  last: { email: string; token: string; expiresAt: number } | null = null;

  async send(input: { email: string; token: string; expiresAt: number }) {
    this.last = input;
  }
}

function buildAuth() {
  const users = new MemoryUsers();
  const sessions = new MemorySessions();
  const passwordResets = new MemoryResets();
  const notifier = new MemoryNotifier();
  const service = createAuthService({
    users,
    sessions,
    passwordResets,
    notifier,
  });
  return { service, users, sessions, passwordResets, notifier };
}

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      server = undefined;
      if (error) reject(error);
      else resolve();
    });
  });
});

async function startApp(authService?: AuthService) {
  server = createApp({
    ...(authService ? { authService } : {}),
    allowedOrigins: ["https://app.example.com"],
  }).listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function jsonRequest(body: unknown, origin = "https://app.example.com") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  } satisfies RequestInit;
}

const registration = {
  name: "Ada",
  lastName: "Lovelace",
  email: "ADA@EXAMPLE.COM",
  password: "correct horse battery staple",
};

describe("B3 auth lifecycle", () => {
  it("registers, creates an opaque cookie session, reads it, and revokes it", async () => {
    const auth = buildAuth();
    const origin = await startApp(auth.service);

    const registerResponse = await fetch(
      `${origin}/api/v1/auth/register`,
      jsonRequest(registration),
    );
    expect(registerResponse.status).toBe(201);
    const registered = (await registerResponse.json()) as {
      data: Record<string, unknown>;
    };
    expect(registered.data).toMatchObject({
      email: "ada@example.com",
      role: "user",
    });
    expect(JSON.stringify(registered)).not.toContain("passwordHash");

    const loginResponse = await fetch(
      `${origin}/api/v1/auth/login`,
      jsonRequest({ email: registration.email, password: registration.password }),
    );
    expect(loginResponse.status).toBe(200);
    const setCookie = loginResponse.headers.get("set-cookie");
    expect(setCookie).toContain("meow_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Max-Age=28800");

    const cookie = setCookie?.split(";")[0] ?? "";
    const rawToken = decodeURIComponent(cookie.split("=")[1] ?? "");
    expect(rawToken.length).toBeGreaterThan(40);
    expect(auth.sessions.lastTokenHash).not.toBe(rawToken);
    expect(auth.sessions.records.has(rawToken)).toBe(false);

    const meResponse = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(meResponse.status).toBe(200);
    expect(await meResponse.json()).toMatchObject({
      data: { email: "ada@example.com" },
    });

    const logoutResponse = await fetch(`${origin}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://app.example.com" },
    });
    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");

    const revoked = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(revoked.status).toBe(401);
    expect(await revoked.json()).toMatchObject({
      error: { code: "SESSION_INVALID" },
    });
  });

  it("keeps password reset responses generic, stores only a digest, and consumes once", async () => {
    const auth = buildAuth();
    const origin = await startApp(auth.service);
    await fetch(`${origin}/api/v1/auth/register`, jsonRequest(registration));

    const loginResponse = await fetch(
      `${origin}/api/v1/auth/login`,
      jsonRequest({ email: registration.email, password: registration.password }),
    );
    const oldCookie = loginResponse.headers.get("set-cookie")?.split(";")[0] ?? "";

    const knownResponse = await fetch(
      `${origin}/api/v1/auth/password-reset/request`,
      jsonRequest({ email: "ada@example.com" }),
    );
    const unknownResponse = await fetch(
      `${origin}/api/v1/auth/password-reset/request`,
      jsonRequest({ email: "nobody@example.com" }),
    );
    expect(knownResponse.status).toBe(202);
    expect(unknownResponse.status).toBe(202);
    expect(await knownResponse.json()).toEqual(await unknownResponse.json());

    const reset = auth.notifier.last;
    expect(reset).not.toBeNull();
    if (!reset) throw new Error("reset notification missing");
    expect(auth.passwordResets.lastTokenHash).not.toBe(reset.token);
    expect(auth.passwordResets.records.has(reset.token)).toBe(false);

    const confirmResponse = await fetch(
      `${origin}/api/v1/auth/password-reset/confirm`,
      jsonRequest({
        token: reset.token,
        password: "an entirely different secure passphrase",
      }),
    );
    expect(confirmResponse.status).toBe(204);

    const reused = await fetch(
      `${origin}/api/v1/auth/password-reset/confirm`,
      jsonRequest({
        token: reset.token,
        password: "yet another completely safe passphrase",
      }),
    );
    expect(reused.status).toBe(400);
    expect(await reused.json()).toMatchObject({
      error: { code: "RESET_TOKEN_INVALID" },
    });

    const invalidatedSession = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { Cookie: oldCookie },
    });
    expect(invalidatedSession.status).toBe(401);

    const relogin = await fetch(
      `${origin}/api/v1/auth/login`,
      jsonRequest({
        email: registration.email,
        password: "an entirely different secure passphrase",
      }),
    );
    expect(relogin.status).toBe(200);
  });

  it("rejects browser mutations from unapproved origins", async () => {
    const origin = await startApp(buildAuth().service);
    const response = await fetch(
      `${origin}/api/v1/auth/register`,
      jsonRequest(registration, "https://evil.example"),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "ORIGIN_FORBIDDEN",
        message: "Request origin is not allowed",
      },
    });
  });

  it("returns 503 instead of pretending auth persistence exists", async () => {
    const origin = await startApp();
    const response = await fetch(
      `${origin}/api/v1/auth/register`,
      jsonRequest(registration),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "AUTH_UNAVAILABLE",
        message:
          "Authentication persistence is not connected to the 2026 API authority yet",
      },
    });
  });

  it("rate-limits repeated login attempts before unlimited abuse", async () => {
    let attempts = 0;
    const fastRejectingAuth: AuthService = {
      async register() {
        throw new Error("unused");
      },
      async login() {
        attempts += 1;
        throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");
      },
      async currentUser() {
        throw new Error("unused");
      },
      async logout() {},
      async requestPasswordReset() {},
      async confirmPasswordReset() {},
    };
    const origin = await startApp(fastRejectingAuth);

    for (let index = 0; index < 10; index += 1) {
      const response = await fetch(
        `${origin}/api/v1/auth/login`,
        jsonRequest({
          email: "ada@example.com",
          password: "wrong password but long enough",
        }),
      );
      expect(response.status).toBe(401);
    }

    const blocked = await fetch(
      `${origin}/api/v1/auth/login`,
      jsonRequest({
        email: "ada@example.com",
        password: "wrong password but long enough",
      }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(attempts).toBe(10);
  });
});
