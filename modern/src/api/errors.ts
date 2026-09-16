import type { ErrorRequestHandler } from "express";
import {
  consoleStructuredLogSink,
  requestIdFromResponse,
} from "../observability/request-observability.js";
import {
  ContractValidationError,
  type ApiErrorDetail,
  type ErrorEnvelope,
} from "./contracts.js";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: readonly ApiErrorDetail[] | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: readonly ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(code: string, message: string) {
    return new ApiError(404, code, message);
  }

  static conflict(code: string, message: string) {
    return new ApiError(409, code, message);
  }

  static unavailable(code: string, message: string) {
    return new ApiError(503, code, message);
  }
}

export function errorEnvelope(
  code: string,
  message: string,
  details?: readonly ApiErrorDetail[],
): ErrorEnvelope {
  return details === undefined
    ? { error: { code, message } }
    : { error: { code, message, details } };
}

export const apiErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ContractValidationError) {
    response
      .status(400)
      .json(errorEnvelope("VALIDATION_ERROR", error.message, error.details));
    return;
  }

  if (error instanceof ApiError) {
    response
      .status(error.status)
      .json(errorEnvelope(error.code, error.message, error.details));
    return;
  }

  consoleStructuredLogSink({
    timestamp: new Date().toISOString(),
    level: "error",
    event: "http_request_unhandled_error",
    ...(requestIdFromResponse(response)
      ? { requestId: requestIdFromResponse(response) ?? undefined }
      : {}),
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  response
    .status(500)
    .json(errorEnvelope("INTERNAL_ERROR", "Internal server error"));
};
