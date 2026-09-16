import { randomUUID } from "node:crypto";
import type { RequestHandler, Response } from "express";

export type StructuredLogRecord = Readonly<{
  timestamp: string;
  level: "info" | "error";
  event: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  errorName?: string;
}>;

export type StructuredLogSink = (record: StructuredLogRecord) => void;

export const consoleStructuredLogSink: StructuredLogSink = (record) => {
  const serialized = JSON.stringify(record);
  if (record.level === "error") {
    console.error(serialized);
    return;
  }
  console.log(serialized);
};

export function requestIdFromResponse(response: Response): string | null {
  const value = response.locals.requestId as unknown;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function createRequestObservabilityMiddleware(input: {
  sink?: StructuredLogSink;
  now?: () => number;
  requestId?: () => string;
} = {}): RequestHandler {
  const sink = input.sink ?? consoleStructuredLogSink;
  const now = input.now ?? Date.now;
  const requestId = input.requestId ?? randomUUID;

  return (request, response, next) => {
    const id = requestId();
    const startedAt = now();
    response.locals.requestId = id;
    response.setHeader("X-Request-ID", id);

    response.once("finish", () => {
      if (request.path === "/healthz" || request.path === "/readyz") return;
      sink({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "http_request_completed",
        requestId: id,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.max(0, now() - startedAt),
      });
    });

    next();
  };
}
