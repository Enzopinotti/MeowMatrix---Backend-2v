const allowedNodeEnvs = ["development", "test", "production"] as const;
const allowedSameSite = ["lax", "strict", "none"] as const;

type NodeEnv = (typeof allowedNodeEnvs)[number];
type SameSite = (typeof allowedSameSite)[number];

export type AppConfig = {
  port: number;
  nodeEnv: NodeEnv;
  trustProxyHops: number;
  frontendOrigins: readonly string[];
  sessionCookieSecure: boolean;
  sessionCookieSameSite: SameSite;
  sessionTtlSeconds: number;
  resetTtlSeconds: number;
  mongoUrl: string | null;
  mongoDbName: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  passwordResetUrl: string | null;
  privateStorageRoot: string | null;
  outboxPollMs: number;
  outboxLeaseMs: number;
  outboxMaxAttempts: number;
  fileCleanupPollMs: number;
  fileStagingRecoveryMs: number;
};

function parsePort(value: string | undefined): number {
  if (!value) return 8080;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const candidate = value ?? "development";
  if (!allowedNodeEnvs.includes(candidate as NodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  return candidate as NodeEnv;
}

function parseBoolean(
  value: string | undefined,
  fallback: boolean,
  field: string,
): boolean {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${field} must be true or false`);
}

function parseSameSite(value: string | undefined): SameSite {
  const candidate = value ?? "lax";
  if (!allowedSameSite.includes(candidate as SameSite)) {
    throw new Error("SESSION_COOKIE_SAME_SITE must be lax, strict, or none");
  }
  return candidate as SameSite;
}

function parseDurationSeconds(
  value: string | undefined,
  fallback: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${field} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return parsed;
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${field} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return parsed;
}

function parseOrigins(value: string | undefined): readonly string[] {
  if (!value?.trim()) return [];
  const unique = new Set<string>();
  for (const raw of value.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new Error("FRONTEND_ORIGINS must contain valid absolute URLs");
    }
    if (
      !(["http:", "https:"] as const).includes(
        url.protocol as "http:" | "https:",
      )
    ) {
      throw new Error("FRONTEND_ORIGINS only supports http and https origins");
    }
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        "FRONTEND_ORIGINS entries must be origins without paths or credentials",
      );
    }
    unique.add(url.origin);
  }
  return [...unique];
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalUrl(
  value: string | undefined,
  field: string,
  nodeEnv: NodeEnv,
): string | null {
  const candidate = nonEmpty(value);
  if (candidate === null) return null;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${field} must be a valid absolute URL`);
  }
  if (
    !(["http:", "https:"] as const).includes(url.protocol as "http:" | "https:")
  ) {
    throw new Error(`${field} must use http or https`);
  }
  if (nodeEnv === "production" && url.protocol !== "https:") {
    throw new Error(`${field} must use https in production`);
  }
  return url.toString();
}

function requireAuthRuntime(config: {
  mongoUrl: string | null;
  smtpHost: string | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  passwordResetUrl: string | null;
}) {
  if (config.mongoUrl === null) return;
  if (
    config.smtpHost === null ||
    config.smtpFrom === null ||
    config.passwordResetUrl === null
  ) {
    throw new Error(
      "MONGO_URL auth runtime requires SMTP_HOST, SMTP_FROM and PASSWORD_RESET_URL",
    );
  }
  if ((config.smtpUser === null) !== (config.smtpPassword === null)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  }
}

function requireProductionRuntime(config: AppConfig) {
  if (config.nodeEnv !== "production") return;

  if (!config.sessionCookieSecure) {
    throw new Error("Production requires SESSION_COOKIE_SECURE=true");
  }
  if (config.frontendOrigins.length === 0) {
    throw new Error("Production requires at least one FRONTEND_ORIGINS entry");
  }
  if (
    config.frontendOrigins.some(
      (origin) => new URL(origin).protocol !== "https:",
    )
  ) {
    throw new Error("Production FRONTEND_ORIGINS must use https");
  }
  if (config.trustProxyHops < 1) {
    throw new Error(
      "Production requires TRUST_PROXY_HOPS to match the trusted ingress path",
    );
  }
  if (config.mongoUrl === null) {
    throw new Error("Production requires MONGO_URL");
  }
  if (config.privateStorageRoot === null) {
    throw new Error("Production requires PRIVATE_STORAGE_ROOT");
  }
  if (config.passwordResetUrl !== null) {
    const resetOrigin = new URL(config.passwordResetUrl).origin;
    if (!config.frontendOrigins.includes(resetOrigin)) {
      throw new Error(
        "PASSWORD_RESET_URL origin must be listed in FRONTEND_ORIGINS in production",
      );
    }
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const sessionCookieSecure = parseBoolean(
    env.SESSION_COOKIE_SECURE,
    nodeEnv === "production",
    "SESSION_COOKIE_SECURE",
  );
  const sessionCookieSameSite = parseSameSite(env.SESSION_COOKIE_SAME_SITE);
  if (sessionCookieSameSite === "none" && !sessionCookieSecure) {
    throw new Error(
      "SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true",
    );
  }

  const config: AppConfig = {
    port: parsePort(env.PORT),
    nodeEnv,
    trustProxyHops: parseInteger(
      env.TRUST_PROXY_HOPS,
      0,
      "TRUST_PROXY_HOPS",
      0,
      10,
    ),
    frontendOrigins: parseOrigins(env.FRONTEND_ORIGINS),
    sessionCookieSecure,
    sessionCookieSameSite,
    sessionTtlSeconds: parseDurationSeconds(
      env.SESSION_TTL_SECONDS,
      8 * 60 * 60,
      "SESSION_TTL_SECONDS",
      5 * 60,
      7 * 24 * 60 * 60,
    ),
    resetTtlSeconds: parseDurationSeconds(
      env.RESET_TTL_SECONDS,
      30 * 60,
      "RESET_TTL_SECONDS",
      5 * 60,
      24 * 60 * 60,
    ),
    mongoUrl: nonEmpty(env.MONGO_URL),
    mongoDbName: nonEmpty(env.MONGO_DB_NAME),
    smtpHost: nonEmpty(env.SMTP_HOST),
    smtpPort: parseDurationSeconds(env.SMTP_PORT, 587, "SMTP_PORT", 1, 65_535),
    smtpSecure: parseBoolean(env.SMTP_SECURE, false, "SMTP_SECURE"),
    smtpUser: nonEmpty(env.SMTP_USER),
    smtpPassword: nonEmpty(env.SMTP_PASSWORD),
    smtpFrom: nonEmpty(env.SMTP_FROM),
    passwordResetUrl: parseOptionalUrl(
      env.PASSWORD_RESET_URL,
      "PASSWORD_RESET_URL",
      nodeEnv,
    ),
    privateStorageRoot: nonEmpty(env.PRIVATE_STORAGE_ROOT),
    outboxPollMs: parseInteger(
      env.OUTBOX_POLL_MS,
      5_000,
      "OUTBOX_POLL_MS",
      100,
      300_000,
    ),
    outboxLeaseMs: parseInteger(
      env.OUTBOX_LEASE_MS,
      30_000,
      "OUTBOX_LEASE_MS",
      1_000,
      15 * 60_000,
    ),
    outboxMaxAttempts: parseInteger(
      env.OUTBOX_MAX_ATTEMPTS,
      6,
      "OUTBOX_MAX_ATTEMPTS",
      1,
      50,
    ),
    fileCleanupPollMs: parseInteger(
      env.FILE_CLEANUP_POLL_MS,
      60_000,
      "FILE_CLEANUP_POLL_MS",
      1_000,
      60 * 60_000,
    ),
    fileStagingRecoveryMs: parseInteger(
      env.FILE_STAGING_RECOVERY_MS,
      10 * 60_000,
      "FILE_STAGING_RECOVERY_MS",
      10_000,
      24 * 60 * 60_000,
    ),
  };

  requireAuthRuntime(config);
  requireProductionRuntime(config);
  return config;
}
