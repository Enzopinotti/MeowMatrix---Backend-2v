import type { MongoClient } from "mongodb";
import { createApp, type ReadinessSnapshot } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createAuthService, type AuthService } from "./domain/auth.js";
import type { CatalogService } from "./domain/catalog.js";
import type { CommerceService } from "./domain/commerce.js";
import { createOutboxDeliveryService } from "./domain/outbox-delivery.js";
import {
  createPrivateFileService,
  type PrivateFileService,
} from "./domain/private-files.js";
import { createOrderConfirmationMailNotifier } from "./infrastructure/order-confirmation-mail.js";
import { createPasswordResetMailNotifier } from "./infrastructure/password-reset-mail.js";
import { FileSystemPrivateBlobStorage } from "./infrastructure/private-file-storage.js";
import { connectMongoAuthPersistence } from "./persistence/mongo-auth.js";
import { MongoCatalogService } from "./persistence/mongo-catalog.js";
import {
  ensureCommerceIndexes,
  MongoCommerceService,
} from "./persistence/mongo-commerce.js";
import {
  ensureOutboxDeliveryIndexes,
  MongoOrderConfirmationSource,
  MongoOutboxDeliveryRepository,
} from "./persistence/mongo-outbox-delivery.js";
import {
  ensurePrivateFileIndexes,
  MongoPrivateFileRepository,
} from "./persistence/mongo-private-files.js";
import {
  createOutboxWorker,
  type OutboxWorker,
} from "./runtime/outbox-worker.js";
import {
  createPrivateFileCleanupWorker,
  type PrivateFileCleanupWorker,
} from "./runtime/private-file-cleanup-worker.js";

const config = loadConfig();
let mongoClient: MongoClient | null = null;
let authService: AuthService | undefined;
let catalogService: CatalogService | undefined;
let commerceService: CommerceService | undefined;
let privateFileService: PrivateFileService | undefined;
let privateStorage: FileSystemPrivateBlobStorage | undefined;
let outboxWorker: OutboxWorker | undefined;
let fileCleanupWorker: PrivateFileCleanupWorker | undefined;

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
  await Promise.all([
    ensureCommerceIndexes(persistence.db),
    ensureOutboxDeliveryIndexes(persistence.db),
    ...(config.privateStorageRoot !== null
      ? [ensurePrivateFileIndexes(persistence.db)]
      : []),
  ]);

  const resetNotifier = createPasswordResetMailNotifier({
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
    notifier: resetNotifier,
    sessionTtlMs: config.sessionTtlSeconds * 1000,
    resetTtlMs: config.resetTtlSeconds * 1000,
  });
  catalogService = new MongoCatalogService(persistence.db);
  commerceService = new MongoCommerceService(
    persistence.client,
    persistence.db,
  );

  const delivery = createOutboxDeliveryService({
    repository: new MongoOutboxDeliveryRepository(persistence.db),
    orderSource: new MongoOrderConfirmationSource(persistence.db),
    notifier: createOrderConfirmationMailNotifier({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      user: config.smtpUser,
      password: config.smtpPassword,
      from: config.smtpFrom,
    }),
    leaseMs: config.outboxLeaseMs,
    maxAttempts: config.outboxMaxAttempts,
  });
  outboxWorker = createOutboxWorker({
    delivery,
    pollMs: config.outboxPollMs,
    onError(error) {
      console.error("Meow outbox worker cycle failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    },
  });

  if (config.privateStorageRoot !== null) {
    privateStorage = new FileSystemPrivateBlobStorage(config.privateStorageRoot);
    await privateStorage.initialize();
    privateFileService = createPrivateFileService({
      repository: new MongoPrivateFileRepository(persistence.db),
      storage: privateStorage,
      stagingRecoveryMs: config.fileStagingRecoveryMs,
    });
    fileCleanupWorker = createPrivateFileCleanupWorker({
      files: privateFileService,
      pollMs: config.fileCleanupPollMs,
      onError(error) {
        console.error("Meow private file cleanup cycle failed", {
          name: error instanceof Error ? error.name : "UnknownError",
        });
      },
    });
  }
}

const readinessProbe = async (): Promise<ReadinessSnapshot> => {
  let database: ReadinessSnapshot["checks"]["database"] = "unavailable";
  let privateStorageState: ReadinessSnapshot["checks"]["privateStorage"] =
    "unavailable";

  if (mongoClient !== null) {
    try {
      await mongoClient.db(config.mongoDbName ?? undefined).command({ ping: 1 });
      database = "ok";
    } catch {
      database = "degraded";
    }
  }

  if (privateStorage !== undefined) {
    try {
      await privateStorage.probe();
      privateStorageState = "ok";
    } catch {
      privateStorageState = "degraded";
    }
  }

  const outboxState =
    outboxWorker === undefined
      ? "unavailable"
      : outboxWorker.isHealthy()
        ? "ok"
        : "degraded";
  const fileCleanupState =
    fileCleanupWorker === undefined
      ? "unavailable"
      : fileCleanupWorker.isHealthy()
        ? "ok"
        : "degraded";

  const ready =
    database === "ok" &&
    privateStorageState === "ok" &&
    outboxState === "ok" &&
    fileCleanupState === "ok";

  return {
    ready,
    checks: {
      database,
      privateStorage: privateStorageState,
      outboxWorker: outboxState,
      fileCleanupWorker: fileCleanupState,
    },
  };
};

const app = createApp({
  ...(authService ? { authService } : {}),
  ...(catalogService ? { catalogService } : {}),
  ...(commerceService ? { commerceService } : {}),
  ...(privateFileService ? { privateFileService } : {}),
  readinessProbe,
  allowedOrigins: config.frontendOrigins,
  sessionCookieOptions: {
    secure: config.sessionCookieSecure,
    sameSite: config.sessionCookieSameSite,
    maxAgeSeconds: config.sessionTtlSeconds,
  },
});

outboxWorker?.start();
fileCleanupWorker?.start();

const server = app.listen(config.port, () => {
  console.log("Meow API listening", {
    port: config.port,
    nodeEnv: config.nodeEnv,
    authPersistence: authService ? "mongo" : "unavailable",
    catalogPersistence: catalogService ? "mongo" : "unavailable",
    commercePersistence: commerceService ? "mongo" : "unavailable",
    privateFilePersistence: privateFileService ? "mongo+filesystem" : "unavailable",
    outboxDelivery: outboxWorker ? "worker" : "unavailable",
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
    await Promise.all([outboxWorker?.stop(), fileCleanupWorker?.stop()]);
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
