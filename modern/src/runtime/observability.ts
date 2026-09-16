import { randomUUID } from "node:crypto";
import type { RequestHandler, Response } from "express";

export type RuntimeLogLevel = "info" | "warn" | "error";

export type RuntimeLogRecord = {
  level: RuntimeLogLevel;
  event: string;
  [key: string]: unknown;
};

export type RuntimeLogSink = (record: RuntimeLogRecord) => void;

const REQUEST_ID_LOCAL = "requestId";

export function getResponseRequestId(response: Response): string | null {
  const value = response.locals[REQUEST_ID_LOCAL] as unknown;
  return typeof value === "string" ? value : null;
}

export function createRequestObservabilityMiddleware(
  sink?: RuntimeLogSink,
): RequestHandler {
  return (request, response, next) => {
    const requestId = randomUUID();
    const startedAt = process.hrtime.bigint();

    response.locals[REQUEST_ID_LOCAL] = requestId;
    response.setHeader("X-Request-Id", requestId);

    response.once("finish", () => {
      if (!sink) return;
      const elapsedNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(elapsedNs) / 1_000_000;
      sink({
        level: response.statusCode >= 500 ? "error" : "info",
        event: "http.request.completed",
        requestId,
        method: request.method,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      });
    });

    next();
  };
}

export const structuredConsoleLog: RuntimeLogSink = (record) => {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...record,
  });

  if (record.level === "error") {
    console.error(line);
    return;
  }
  if (record.level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
};
