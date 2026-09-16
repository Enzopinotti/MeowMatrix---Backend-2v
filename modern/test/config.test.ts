import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";

function productionEnv(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    FRONTEND_ORIGINS: "https://app.example.com",
    TRUST_PROXY_HOPS: "1",
    MONGO_URL: "mongodb://mongo:27017/meow?replicaSet=rs0",
    MONGO_DB_NAME: "meow",
    SMTP_HOST: "smtp.example.com",
    SMTP_FROM: "Meow <no-reply@example.com>",
    PASSWORD_RESET_URL: "https://app.example.com/reset-password",
    PRIVATE_STORAGE_ROOT: "/var/lib/meow/private",
    ...overrides,
  };
}

describe("loadConfig", () => {
  it("uses safe local defaults without requiring secrets", () => {
    expect(loadConfig({})).toEqual({
      port: 8080,
      nodeEnv: "development",
      trustProxyHops: 0,
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

  it("accepts a complete fail-closed production topology", () => {
    expect(loadConfig(productionEnv())).toMatchObject({
      nodeEnv: "production",
      trustProxyHops: 1,
      frontendOrigins: ["https://app.example.com"],
      sessionCookieSecure: true,
      sessionCookieSameSite: "lax",
      mongoUrl: "mongodb://mongo:27017/meow?replicaSet=rs0",
      privateStorageRoot: "/var/lib/meow/private",
      passwordResetUrl: "https://app.example.com/reset-password",
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

  it("parses private storage, trusted proxy hops and bounded worker settings", () => {
    expect(
      loadConfig({
        TRUST_PROXY_HOPS: "2",
        PRIVATE_STORAGE_ROOT: " /srv/meow/private ",
        OUTBOX_POLL_MS: "2500",
        OUTBOX_LEASE_MS: "45000",
        OUTBOX_MAX_ATTEMPTS: "8",
        FILE_CLEANUP_POLL_MS: "120000",
        FILE_STAGING_RECOVERY_MS: "900000",
      }),
    ).toMatchObject({
      trustProxyHops: 2,
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
    expect(() => loadConfig({ TRUST_PROXY_HOPS: "11" })).toThrow(
      "TRUST_PROXY_HOPS must be an integer between 0 and 10",
    );
  });

  it("requires HTTPS reset links in production", () => {
    expect(() =>
      loadConfig(
        productionEnv({
          PASSWORD_RESET_URL: "http://app.example.com/reset-password",
        }),
      ),
    ).toThrow("PASSWORD_RESET_URL must use https in production");
  });

  it("rejects insecure production session cookies", () => {
    expect(() =>
      loadConfig(productionEnv({ SESSION_COOKIE_SECURE: "false" })),
    ).toThrow("Production requires SESSION_COOKIE_SECURE=true");
  });

  it("rejects non-HTTPS production frontend origins", () => {
    expect(() =>
      loadConfig(productionEnv({ FRONTEND_ORIGINS: "http://app.example.com" })),
    ).toThrow("Production FRONTEND_ORIGINS must use https");
  });

  it("requires an explicit trusted ingress hop count in production", () => {
    expect(() => loadConfig(productionEnv({ TRUST_PROXY_HOPS: "0" }))).toThrow(
      "Production requires TRUST_PROXY_HOPS to match the trusted ingress path",
    );
  });

  it("requires Mongo and private storage in production", () => {
    expect(() =>
      loadConfig(
        productionEnv({
          MONGO_URL: undefined,
          SMTP_HOST: undefined,
          SMTP_FROM: undefined,
          PASSWORD_RESET_URL: undefined,
        }),
      ),
    ).toThrow("Production requires MONGO_URL");

    expect(() =>
      loadConfig(productionEnv({ PRIVATE_STORAGE_ROOT: undefined })),
    ).toThrow("Production requires PRIVATE_STORAGE_ROOT");
  });

  it("requires the production reset URL origin to be allow-listed", () => {
    expect(() =>
      loadConfig(
        productionEnv({
          PASSWORD_RESET_URL: "https://accounts.example.com/reset-password",
        }),
      ),
    ).toThrow(
      "PASSWORD_RESET_URL origin must be listed in FRONTEND_ORIGINS in production",
    );
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
