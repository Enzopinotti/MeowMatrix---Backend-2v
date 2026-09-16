import express, { type RequestHandler } from "express";
import { apiErrorHandler, errorEnvelope } from "./api/errors.js";
import { createApiV1Router } from "./api/routes.js";
import {
  unavailableCatalogService,
  type CatalogService,
} from "./domain/catalog.js";

export type AppOptions = {
  serviceName?: string;
  catalogService?: CatalogService;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const serviceName = options.serviceName ?? "meow-api";
  const catalogService = options.catalogService ?? unavailableCatalogService;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: serviceName,
      version: "2026-b2",
    });
  });

  app.use("/api/v1", createApiV1Router({ catalogService }));

  const notFound: RequestHandler = (_request, response) => {
    response.status(404).json(errorEnvelope("NOT_FOUND", "Route not found"));
  };

  app.use(notFound);
  app.use(apiErrorHandler);

  return app;
}
