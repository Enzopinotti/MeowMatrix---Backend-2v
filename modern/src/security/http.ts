import type { RequestHandler } from "express";
import { ApiError } from "../api/errors.js";

export const SESSION_COOKIE_NAME = "meow_session";

export type SessionCookieOptions = {
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAgeSeconds: number;
};

export type BrowserSecurityOptions = {
  allowedOrigins: readonly string[];
};

function appendVaryOrigin(existing: string | undefined): string {
  if (!existing) return "Origin";
  const values = existing.split(",").map((value) => value.trim());
  return values.includes("Origin") ? existing : `${existing}, Origin`;
}

export function createCorsMiddleware(
  options: BrowserSecurityOptions,
): RequestHandler {
  const allowed = new Set(options.allowedOrigins);
  return (request, response, next) => {
    const origin = request.get("origin");
    if (!origin) {
      next();
      return;
    }

    response.setHeader(
      "Vary",
      appendVaryOrigin(response.getHeader("Vary")?.toString()),
    );
    if (!allowed.has(origin)) {
      if (request.method === "OPTIONS") {
        response.status(403).json({
          error: {
            code: "ORIGIN_FORBIDDEN",
            message: "Request origin is not allowed",
          },
        });
        return;
      }
      next();
      return;
    }

    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.status(204).end();
      return;
    }
    next();
  };
}

export function createOriginGuard(
  options: BrowserSecurityOptions,
): RequestHandler {
  const allowed = new Set(options.allowedOrigins);
  return (request, _response, next) => {
    const origin = request.get("origin");
    if (origin && !allowed.has(origin)) {
      next(
        new ApiError(403, "ORIGIN_FORBIDDEN", "Request origin is not allowed"),
      );
      return;
    }
    next();
  };
}

function cookieAttributes(options: SessionCookieOptions): string[] {
  if (options.sameSite === "none" && !options.secure) {
    throw new Error("SameSite=None session cookies require Secure=true");
  }
  const attributes = [
    "Path=/",
    "HttpOnly",
    `SameSite=${options.sameSite[0]?.toUpperCase()}${options.sameSite.slice(1)}`,
  ];
  if (options.secure) attributes.push("Secure");
  return attributes;
}

export function sessionCookie(
  token: string,
  options: SessionCookieOptions,
): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${options.maxAgeSeconds}`,
    ...cookieAttributes(options),
  ].join("; ");
}

export function expiredSessionCookie(options: SessionCookieOptions): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ...cookieAttributes(options),
  ].join("; ");
}

export function readSessionCookie(
  cookieHeader: string | undefined,
): string | null {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    const name = entry.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const value = entry.slice(separator + 1).trim();
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  return null;
}
