import type { ErrorRequestHandler } from "express";
import {
  ContractValidationError,
  type ApiErrorDetail,
  type ErrorEnvelope,
} from "./contracts.js";
import {
  getResponseRequestId,
  type RuntimeLogSink,
} from "../runtime/observability.js";

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

export function createApiErrorHandler(
  runtimeLogSink?: RuntimeLogSink,
): ErrorRequestHandler {
  return (error, _request, response, _next) => {
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

    const record = {
      level: "error" as const,
      event: "http.request.unhandled_error",
      requestId: getResponseRequestId(response),
      errorName: error instanceof Error ? error.name : "UnknownError",
    };

    if (runtimeLogSink) {
      runtimeLogSink(record);
    } else {
      console.error("Unhandled request error", { name: record.errorName });
    }

    response
      .status(500)
      .json(errorEnvelope("INTERNAL_ERROR", "Internal server error"));
  };
}

export const apiErrorHandler = createApiErrorHandler();
