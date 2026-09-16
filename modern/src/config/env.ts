const allowedNodeEnvs = ["development", "test", "production"] as const;
const allowedSameSite = ["lax", "strict", "none"] as const;

type NodeEnv = (typeof allowedNodeEnvs)[number];
type SameSite = (typeof allowedSameSite)[number];

export type AppConfig = {
  port: number;
  nodeEnv: NodeEnv;
  frontendOrigins: readonly string[];
  sessionCookieSecure: boolean;
  sessionCookieSameSite: SameSite;
  sessionTtlSeconds: number;
  resetTtlSeconds: number;
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

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("SESSION_COOKIE_SECURE must be true or false");
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const sessionCookieSecure = parseBoolean(
    env.SESSION_COOKIE_SECURE,
    nodeEnv === "production",
  );
  const sessionCookieSameSite = parseSameSite(env.SESSION_COOKIE_SAME_SITE);
  if (sessionCookieSameSite === "none" && !sessionCookieSecure) {
    throw new Error(
      "SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true",
    );
  }

  return {
    port: parsePort(env.PORT),
    nodeEnv,
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
  };
}
