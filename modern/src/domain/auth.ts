import { createHash, randomBytes } from "node:crypto";
import type {
  LoginRequest,
  PasswordResetConfirmRequest,
  RegisterRequest,
} from "../api/auth-contracts.js";
import { normalizeEmail } from "../api/auth-contracts.js";
import { ApiError } from "../api/errors.js";
import type { UserDto } from "../api/contracts.js";
import { hashPassword, verifyPassword } from "../security/password.js";

export type AuthUserRecord = UserDto & {
  passwordHash: string;
};

export type CreateAuthUser = Omit<AuthUserRecord, "id" | "role" | "avatarUrl">;

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserRecord | null>;
  create(user: CreateAuthUser): Promise<AuthUserRecord>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
};

export interface SessionStore {
  put(session: SessionRecord): Promise<void>;
  get(tokenHash: string): Promise<SessionRecord | null>;
  delete(tokenHash: string): Promise<void>;
  deleteForUser(userId: string): Promise<void>;
}

export type PasswordResetRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
};

export interface PasswordResetStore {
  replaceForUser(record: PasswordResetRecord): Promise<void>;
  consume(tokenHash: string, now: number): Promise<PasswordResetRecord | null>;
}

export interface PasswordResetNotifier {
  send(input: {
    email: string;
    token: string;
    expiresAt: number;
  }): Promise<void>;
}

export type AuthSession = {
  user: UserDto;
  sessionToken: string;
  expiresAt: number;
};

export interface AuthService {
  register(input: RegisterRequest): Promise<UserDto>;
  login(input: LoginRequest): Promise<AuthSession>;
  currentUser(sessionToken: string): Promise<UserDto>;
  logout(sessionToken: string | null): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(input: PasswordResetConfirmRequest): Promise<void>;
}

export type AuthServiceOptions = {
  users: AuthUserRepository;
  sessions: SessionStore;
  passwordResets: PasswordResetStore;
  notifier: PasswordResetNotifier;
  sessionTtlMs?: number;
  resetTtlMs?: number;
  now?: () => number;
};

function publicUser(user: AuthUserRecord): UserDto {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function tokenDigest(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createAuthService(options: AuthServiceOptions): AuthService {
  const sessionTtlMs = options.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  const resetTtlMs = options.resetTtlMs ?? 30 * 60 * 1000;
  const now = options.now ?? Date.now;

  async function resolveSession(sessionToken: string): Promise<{
    session: SessionRecord;
    user: AuthUserRecord;
  }> {
    const tokenHash = tokenDigest(sessionToken);
    const session = await options.sessions.get(tokenHash);
    const currentTime = now();
    if (session === null || session.expiresAt <= currentTime) {
      if (session !== null) {
        await options.sessions.delete(tokenHash);
      }
      throw new ApiError(401, "SESSION_INVALID", "Authentication required");
    }

    const user = await options.users.findById(session.userId);
    if (user === null) {
      await options.sessions.delete(tokenHash);
      throw new ApiError(401, "SESSION_INVALID", "Authentication required");
    }
    return { session, user };
  }

  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      if ((await options.users.findByEmail(email)) !== null) {
        throw ApiError.conflict(
          "EMAIL_ALREADY_REGISTERED",
          "An account already exists for this email",
        );
      }

      const created = await options.users.create({
        name: input.name.trim(),
        lastName: input.lastName.trim(),
        email,
        passwordHash: await hashPassword(input.password),
      });
      return publicUser(created);
    },

    async login(input) {
      const email = normalizeEmail(input.email);
      const user = await options.users.findByEmail(email);
      if (user === null) {
        // Spend the same expensive password primitive on unknown accounts so the
        // obvious "no hash work" timing oracle is not present.
        await hashPassword(input.password);
        throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");
      }

      if (!(await verifyPassword(input.password, user.passwordHash))) {
        throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");
      }

      const sessionToken = newToken();
      const expiresAt = now() + sessionTtlMs;
      await options.sessions.put({
        tokenHash: tokenDigest(sessionToken),
        userId: user.id,
        expiresAt,
      });
      return { user: publicUser(user), sessionToken, expiresAt };
    },

    async currentUser(sessionToken) {
      const { user } = await resolveSession(sessionToken);
      return publicUser(user);
    },

    async logout(sessionToken) {
      if (sessionToken === null) {
        return;
      }
      await options.sessions.delete(tokenDigest(sessionToken));
    },

    async requestPasswordReset(emailInput) {
      const email = normalizeEmail(emailInput);
      const user = await options.users.findByEmail(email);
      if (user === null) {
        return;
      }

      const token = newToken();
      const expiresAt = now() + resetTtlMs;
      await options.passwordResets.replaceForUser({
        tokenHash: tokenDigest(token),
        userId: user.id,
        expiresAt,
      });
      await options.notifier.send({ email: user.email, token, expiresAt });
    },

    async confirmPasswordReset(input) {
      const consumed = await options.passwordResets.consume(
        tokenDigest(input.token),
        now(),
      );
      if (consumed === null) {
        throw new ApiError(
          400,
          "RESET_TOKEN_INVALID",
          "Reset token is invalid or expired",
        );
      }

      const user = await options.users.findById(consumed.userId);
      if (user === null) {
        throw new ApiError(
          400,
          "RESET_TOKEN_INVALID",
          "Reset token is invalid or expired",
        );
      }
      if (await verifyPassword(input.password, user.passwordHash)) {
        throw new ApiError(
          400,
          "PASSWORD_REUSE",
          "New password must differ from the current password",
        );
      }

      await options.users.updatePasswordHash(
        user.id,
        await hashPassword(input.password),
      );
      await options.sessions.deleteForUser(user.id);
    },
  };
}

class UnavailableAuthService implements AuthService {
  private unavailable(): never {
    throw ApiError.unavailable(
      "AUTH_UNAVAILABLE",
      "Authentication persistence is not connected to the 2026 API authority yet",
    );
  }

  async register(_input: RegisterRequest): Promise<UserDto> {
    return this.unavailable();
  }

  async login(_input: LoginRequest): Promise<AuthSession> {
    return this.unavailable();
  }

  async currentUser(_sessionToken: string): Promise<UserDto> {
    return this.unavailable();
  }

  async logout(_sessionToken: string | null): Promise<void> {
    return this.unavailable();
  }

  async requestPasswordReset(_email: string): Promise<void> {
    return this.unavailable();
  }

  async confirmPasswordReset(
    _input: PasswordResetConfirmRequest,
  ): Promise<void> {
    return this.unavailable();
  }
}

export const unavailableAuthService: AuthService = new UnavailableAuthService();
