import express, { type RequestHandler } from "express";
import { createApiErrorHandler, errorEnvelope } from "./api/errors.js";
import { createApiV1Router } from "./api/routes.js";
import { unavailableAuthService, type AuthService } from "./domain/auth.js";
import {
  unavailableCatalogService,
  type CatalogService,
} from "./domain/catalog.js";
import {
  unavailableCommerceService,
  type CommerceService,
} from "./domain/commerce.js";
import {
  unavailablePrivateFileService,
  type PrivateFileService,
} from "./domain/private-files.js";
import {
  createRequestObservabilityMiddleware,
  type RuntimeLogSink,
} from "./runtime/observability.js";
import type { SessionCookieOptions } from "./security/http.js";
import type { RateLimitStore } from "./security/rate-limit.js";

export type ReadinessState = "ok" | "degraded" | "unavailable";

export type ReadinessSnapshot = {
  ready: boolean;
  checks: {
    database: ReadinessState;
    privateStorage: ReadinessState;
    outboxWorker: ReadinessState;
    fileCleanupWorker: ReadinessState;
  };
};

export type AppOptions = {
  serviceName?: string;
  catalogService?: CatalogService;
  authService?: AuthService;
  commerceService?: CommerceService;
  privateFileService?: PrivateFileService;
  readinessProbe?: () => Promise<ReadinessSnapshot>;
  allowedOrigins?: readonly string[];
  sessionCookieOptions?: SessionCookieOptions;
  rateLimitStore?: RateLimitStore;
  trustProxyHops?: number;
  runtimeLogSink?: RuntimeLogSink;
};

const defaultSessionCookieOptions: SessionCookieOptions = {
  secure: false,
  sameSite: "lax",
  maxAgeSeconds: 8 * 60 * 60,
};

const unavailableReadiness = async (): Promise<ReadinessSnapshot> => ({
  ready: false,
  checks: {
    database: "unavailable",
    privateStorage: "unavailable",
    outboxWorker: "unavailable",
    fileCleanupWorker: "unavailable",
  },
});

export function createApp(options: AppOptions = {}) {
  const app = express();
  const serviceName = options.serviceName ?? "meow-api";
  const catalogService = options.catalogService ?? unavailableCatalogService;
  const authService = options.authService ?? unavailableAuthService;
  const commerceService = options.commerceService ?? unavailableCommerceService;
  const privateFileService =
    options.privateFileService ?? unavailablePrivateFileService;
  const readinessProbe = options.readinessProbe ?? unavailableReadiness;
  const trustProxyHops = options.trustProxyHops ?? 0;

  app.disable("x-powered-by");
  app.set("trust proxy", trustProxyHops > 0 ? trustProxyHops : false);
  app.use(createRequestObservabilityMiddleware(options.runtimeLogSink));
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: serviceName,
      version: "2026-b7",
    });
  });

  app.get("/readyz", async (_request, response, next) => {
    try {
      const snapshot = await readinessProbe();
      response
        .status(snapshot.ready ? 200 : 503)
        .setHeader("Cache-Control", "no-store")
        .json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.use(
    "/api/v1",
    createApiV1Router({
      catalogService,
      authService,
      commerceService,
      privateFileService,
      allowedOrigins: options.allowedOrigins ?? [],
      sessionCookieOptions:
        options.sessionCookieOptions ?? defaultSessionCookieOptions,
      ...(options.rateLimitStore
        ? { rateLimitStore: options.rateLimitStore }
        : {}),
    }),
  );

  const notFound: RequestHandler = (_request, response) => {
    response.status(404).json(errorEnvelope("NOT_FOUND", "Route not found"));
  };

  app.use(notFound);
  app.use(createApiErrorHandler(options.runtimeLogSink));

  return app;
}
