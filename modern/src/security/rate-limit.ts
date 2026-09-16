import type { RequestHandler } from "express";
import { errorEnvelope } from "../api/errors.js";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(
  policy: RateLimitPolicy,
  now: () => number = Date.now,
): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (request, response, next) => {
    const currentTime = now();
    const key = request.ip || request.socket.remoteAddress || "unknown";
    const current = buckets.get(key);
    const bucket =
      current === undefined || current.resetAt <= currentTime
        ? { count: 0, resetAt: currentTime + policy.windowMs }
        : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    response.setHeader(
      "RateLimit-Policy",
      `${policy.limit};w=${Math.ceil(policy.windowMs / 1000)}`,
    );
    response.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, policy.limit - bucket.count)),
    );

    if (bucket.count > policy.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - currentTime) / 1000),
      );
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response
        .status(429)
        .json(
          errorEnvelope("RATE_LIMITED", "Too many authentication attempts"),
        );
      return;
    }

    next();
  };
}

export const authRateLimitPolicies = Object.freeze({
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 60 * 60 * 1000 },
});
