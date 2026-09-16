import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

export type AppOptions = {
  serviceName?: string;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const serviceName = options.serviceName ?? "meow-api";

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: serviceName,
      version: "2026-b1",
    });
  });

  const notFound: RequestHandler = (_request, response) => {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  };

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    console.error("Unhandled request error", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    response.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    });
  };

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
