import type { AddressInfo } from "node:net";
import express, { type RequestHandler } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ApiError, apiErrorHandler } from "../src/api/errors.js";
import {
  createRateLimiter,
  type RateLimitStore,
  type RateLimitStoreIncrement,
} from "../src/security/rate-limit.js";

const servers: Array<{ close(callback: (error?: Error) => void): void }> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

async function listen(app: ReturnType<typeof express>): Promise<string> {
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function recordingStore(options: { blockedAfter?: number } = {}) {
  const calls: RateLimitStoreIncrement[] = [];
  const store: RateLimitStore = {
    async increment(input) {
      calls.push(input);
      const count = calls.length;
      return {
        count:
          options.blockedAfter !== undefined && count >= options.blockedAfter
            ? input.policy.maxAttempts + 1
            : count,
        resetAt: input.now + input.policy.windowMs,
      };
    },
  };
  return { calls, store };
}

async function runMiddleware(middleware: RequestHandler) {
  const app = express();
  app.post("/__test-limiter", middleware, (_request, response) => {
    response.status(204).end();
  });
  app.use(apiErrorHandler);
  const origin = await listen(app);
  return fetch(`${origin}/__test-limiter`, { method: "POST" });
}

describe("shared authentication rate limiting", () => {
  it("delegates scoped counters to the configured shared store", async () => {
    const store = recordingStore();
    const limiter = createRateLimiter(
      { windowMs: 60_000, maxAttempts: 5 },
      { store: store.store, scope: "auth:test", now: () => 1_000 },
    );

    const response = await runMiddleware(limiter);

    expect(response.status).toBe(204);
    expect(response.headers.get("x-ratelimit-limit")).toBe("5");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("4");
    expect(store.calls).toHaveLength(1);
    expect(store.calls[0]).toMatchObject({
      scope: "auth:test",
      now: 1_000,
    });
  });

  it("returns the normal RATE_LIMITED error when the shared store exceeds policy", async () => {
    const store = recordingStore({ blockedAfter: 1 });
    const limiter = createRateLimiter(
      { windowMs: 60_000, maxAttempts: 1 },
      { store: store.store, scope: "auth:test", now: () => 2_000 },
    );

    const response = await runMiddleware(limiter);
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(payload.error.code).toBe("RATE_LIMITED");
    expect(payload.error.message).toContain("Too many authentication attempts");
  });

  it("uses X-Forwarded-For only when an explicit trusted proxy hop is configured", async () => {
    const trusted = recordingStore();
    const trustedOrigin = await listen(
      createApp({ trustProxyHops: 1, rateLimitStore: trusted.store }),
    );
    const body = JSON.stringify({
      email: "proxy@example.com",
      password: "not-a-real-password",
    });

    await fetch(`${trustedOrigin}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.42",
      },
      body,
    });

    expect(trusted.calls[0]?.key).toBe("198.51.100.42");

    const direct = recordingStore();
    const directOrigin = await listen(
      createApp({ rateLimitStore: direct.store }),
    );
    await fetch(`${directOrigin}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.42",
      },
      body,
    });

    expect(direct.calls[0]?.key).not.toBe("198.51.100.42");
  });

  it("surfaces shared-store failures instead of silently falling back per process", async () => {
    const store: RateLimitStore = {
      async increment() {
        throw new Error("shared store unavailable");
      },
    };
    const limiter = createRateLimiter(
      { windowMs: 60_000, maxAttempts: 1 },
      { store, scope: "auth:test" },
    );

    const response = await runMiddleware(limiter);

    expect(response.status).toBe(500);
  });

  it("keeps the public throttling error type stable", () => {
    const error = new ApiError(
      429,
      "RATE_LIMITED",
      "Too many authentication attempts; try again later",
    );
    expect(error.status).toBe(429);
    expect(error.code).toBe("RATE_LIMITED");
  });
});
