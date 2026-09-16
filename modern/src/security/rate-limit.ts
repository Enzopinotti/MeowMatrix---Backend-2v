import type { RequestHandler } from "express";
import { ApiError } from "../api/errors.js";

export type RateLimitPolicy = {
  windowMs: number;
  maxAttempts: number;
};

type Bucket = { count: number; resetAt: number };

const DEFAULT_MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL = 256;

export function createRateLimiter(
  policy: RateLimitPolicy,
  options: { maxBuckets?: number; now?: () => number } = {},
): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const maxBuckets = options.maxBuckets ?? DEFAULT_MAX_BUCKETS;
  const now = options.now ?? Date.now;
  let requestsSinceSweep = 0;

  function sweepExpired(currentTime: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= currentTime) buckets.delete(key);
    }
  }

  function enforceBound(currentTime: number, incomingKey: string) {
    requestsSinceSweep += 1;
    if (
      requestsSinceSweep >= SWEEP_INTERVAL ||
      (!buckets.has(incomingKey) && buckets.size >= maxBuckets)
    ) {
      sweepExpired(currentTime);
      requestsSinceSweep = 0;
    }

    if (!buckets.has(incomingKey) && buckets.size >= maxBuckets) {
      const oldestKey = buckets.keys().next().value as string | undefined;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
  }

  return (request, response, next) => {
    const currentTime = now();
    const key = request.ip ?? request.socket.remoteAddress ?? "unknown";
    enforceBound(currentTime, key);

    const existing = buckets.get(key);
    const bucket =
      existing === undefined || existing.resetAt <= currentTime
        ? { count: 0, resetAt: currentTime + policy.windowMs }
        : existing;

    bucket.count += 1;
    buckets.set(key, bucket);
    response.setHeader("X-RateLimit-Limit", String(policy.maxAttempts));
    response.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, policy.maxAttempts - bucket.count)),
    );

    if (bucket.count > policy.maxAttempts) {
      response.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))),
      );
      next(
        new ApiError(
          429,
          "RATE_LIMITED",
          "Too many authentication attempts; try again later",
        ),
      );
      return;
    }

    next();
  };
}

export const authRateLimitPolicies = Object.freeze({
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 10 },
  register: { windowMs: 60 * 60 * 1000, maxAttempts: 8 },
  passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },
});
