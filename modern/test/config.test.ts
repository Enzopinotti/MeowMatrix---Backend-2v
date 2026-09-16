import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";

describe("loadConfig", () => {
  it("uses safe local defaults without requiring secrets", () => {
    expect(loadConfig({})).toEqual({
      port: 8080,
      nodeEnv: "development",
      frontendOrigins: [],
      sessionCookieSecure: false,
      sessionCookieSameSite: "lax",
      sessionTtlSeconds: 28_800,
      resetTtlSeconds: 1_800,
      mongoUrl: null,
      mongoDbName: null,
      smtpHost: null,
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: null,
      smtpPassword: null,
      smtpFrom: null,
      passwordResetUrl: null,
      privateStorageRoot: null,
      outboxPollMs: 5_000,
      outboxLeaseMs: 30_000,
      outboxMaxAttempts: 6,
      fileCleanupPollMs: 60_000,
      fileStagingRecoveryMs: 600_000,
    });
  });

  it("uses Secure cookies by default in production", () => {
    expect(loadConfig({ NODE_ENV: "production" })).toMatchObject({
      sessionCookieSecure: true,
      sessionCookieSameSite: "lax",
    });
  });

  it("normalizes and deduplicates exact frontend origins", () => {
    expect(
      loadConfig({
        FRONTEND_ORIGINS:
          "https://app.example.com, http://localhost:5173,https://app.example.com",
      }).frontendOrigins,
    ).toEqual(["https://app.example.com", "http://localhost:5173"]);
  });

  it("rejects origin entries containing paths", () => {
    expect(() =>
      loadConfig({ FRONTEND_ORIGINS: "https://app.example.com/path" }),
    ).toThrow(
      "FRONTEND_ORIGINS entries must be origins without paths or credentials",
    );
  });

  it("requires Secure when SameSite=None is explicitly selected", () => {
    expect(() =>
      loadConfig({
        SESSION_COOKIE_SAME_SITE: "none",
        SESSION_COOKIE_SECURE: "false",
      }),
    ).toThrow(
      "SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true",
    );
  });

  it("requires the complete reset-mail boundary when Mongo auth is enabled", () => {
    expect(() =>
      loadConfig({ MONGO_URL: "mongodb://localhost:27017/meow" }),
    ).toThrow(
      "MONGO_URL auth runtime requires SMTP_HOST, SMTP_FROM and PASSWORD_RESET_URL",
    );

    expect(
      loadConfig({
        MONGO_URL: "mongodb://localhost:27017/meow",
        SMTP_HOST: "smtp.example.com",
        SMTP_FROM: "Meow <no-reply@example.com>",
        PASSWORD_RESET_URL: "http://localhost:5173/reset-password",
      }),
    ).toMatchObject({
      mongoUrl: "mongodb://localhost:27017/meow",
      smtpHost: "smtp.example.com",
      passwordResetUrl: "http://localhost:5173/reset-password",
    });
  });

  it("parses private storage and bounded worker settings", () => {
    expect(
      loadConfig({
        PRIVATE_STORAGE_ROOT: " /srv/meow/private ",
        OUTBOX_POLL_MS: "2500",
        OUTBOX_LEASE_MS: "45000",
        OUTBOX_MAX_ATTEMPTS: "8",
        FILE_CLEANUP_POLL_MS: "120000",
        FILE_STAGING_RECOVERY_MS: "900000",
      }),
    ).toMatchObject({
      privateStorageRoot: "/srv/meow/private",
      outboxPollMs: 2500,
      outboxLeaseMs: 45000,
      outboxMaxAttempts: 8,
      fileCleanupPollMs: 120000,
      fileStagingRecoveryMs: 900000,
    });
    expect(() => loadConfig({ OUTBOX_MAX_ATTEMPTS: "0" })).toThrow(
      "OUTBOX_MAX_ATTEMPTS must be an integer between 1 and 50",
    );
  });

  it("requires HTTPS reset links in production", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        MONGO_URL: "mongodb://localhost:27017/meow",
        SMTP_HOST: "smtp.example.com",
        SMTP_FROM: "Meow <no-reply@example.com>",
        PASSWORD_RESET_URL: "http://app.example.com/reset-password",
      }),
    ).toThrow("PASSWORD_RESET_URL must use https in production");
  });

  it("validates the listener port", () => {
    expect(() => loadConfig({ PORT: "0" })).toThrow(
      "PORT must be an integer between 1 and 65535",
    );
  });

  it("validates NODE_ENV", () => {
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(
      "NODE_ENV must be development, test, or production",
    );
  });
});
