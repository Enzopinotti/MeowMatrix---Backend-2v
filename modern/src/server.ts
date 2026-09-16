import type { MongoClient } from "mongodb";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createAuthService, type AuthService } from "./domain/auth.js";
import type { CatalogService } from "./domain/catalog.js";
import type { CommerceService } from "./domain/commerce.js";
import { createPasswordResetMailNotifier } from "./infrastructure/password-reset-mail.js";
import { connectMongoAuthPersistence } from "./persistence/mongo-auth.js";
import { MongoCatalogService } from "./persistence/mongo-catalog.js";
import {
  ensureCommerceIndexes,
  MongoCommerceService,
} from "./persistence/mongo-commerce.js";

const config = loadConfig();
let mongoClient: MongoClient | null = null;
let authService: AuthService | undefined;
let catalogService: CatalogService | undefined;
let commerceService: CommerceService | undefined;

if (config.mongoUrl !== null) {
  if (
    config.smtpHost === null ||
    config.smtpFrom === null ||
    config.passwordResetUrl === null
  ) {
    throw new Error("Validated auth runtime mail configuration is missing");
  }

  const persistence = await connectMongoAuthPersistence({
    url: config.mongoUrl,
    ...(config.mongoDbName ? { dbName: config.mongoDbName } : {}),
  });
  mongoClient = persistence.client;
  await ensureCommerceIndexes(persistence.db);

  const notifier = createPasswordResetMailNotifier({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    user: config.smtpUser,
    password: config.smtpPassword,
    from: config.smtpFrom,
    resetUrl: config.passwordResetUrl,
  });

  authService = createAuthService({
    users: persistence.users,
    sessions: persistence.sessions,
    passwordResets: persistence.passwordResets,
    notifier,
    sessionTtlMs: config.sessionTtlSeconds * 1000,
    resetTtlMs: config.resetTtlSeconds * 1000,
  });
  catalogService = new MongoCatalogService(persistence.db);
  commerceService = new MongoCommerceService(persistence.client, persistence.db);
}

const app = createApp({
  ...(authService ? { authService } : {}),
  ...(catalogService ? { catalogService } : {}),
  ...(commerceService ? { commerceService } : {}),
  allowedOrigins: config.frontendOrigins,
  sessionCookieOptions: {
    secure: config.sessionCookieSecure,
    sameSite: config.sessionCookieSameSite,
    maxAgeSeconds: config.sessionTtlSeconds,
  },
});

const server = app.listen(config.port, () => {
  console.log("Meow API listening", {
    port: config.port,
    nodeEnv: config.nodeEnv,
    authPersistence: authService ? "mongo" : "unavailable",
    catalogPersistence: catalogService ? "mongo" : "unavailable",
    commercePersistence: commerceService ? "mongo" : "unavailable",
  });
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Meow API shutting down", { signal });

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoClient?.close();
    process.exitCode = 0;
  } catch (error) {
    console.error("Meow API shutdown failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
