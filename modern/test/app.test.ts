import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createApp, type AppOptions } from "../src/app.js";
import type { RuntimeLogRecord } from "../src/runtime/observability.js";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      server = undefined;
      if (error) return reject(error);
      resolve();
    });
  });
});

async function startApp(options: AppOptions = {}) {
  server = createApp({ serviceName: "meow-api-test", ...options }).listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function flushRequestLogs() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe("createApp", () => {
  it("serves liveness without Mongo, credentials, or external services", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/healthz`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "meow-api-test",
      version: "2026-b7",
    });
    expect(response.headers.get("x-powered-by")).toBeNull();
  });

  it("fails readiness closed when required runtime dependencies are unavailable", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/readyz`);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ready: false,
      checks: {
        database: "unavailable",
        privateStorage: "unavailable",
        outboxWorker: "unavailable",
        fileCleanupWorker: "unavailable",
      },
    });
  });

  it("reports only coarse dependency readiness without sensitive details", async () => {
    const origin = await startApp({
      readinessProbe: async () => ({
        ready: true,
        checks: {
          database: "ok",
          privateStorage: "ok",
          outboxWorker: "ok",
          fileCleanupWorker: "ok",
        },
      }),
    });
    const response = await fetch(`${origin}/readyz`);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).not.toContain("mongoUrl");
    expect(body).not.toContain("smtp");
    expect(body).not.toContain("storageKey");
  });

  it("adds server-generated request correlation without logging PII-bearing request data", async () => {
    const records: RuntimeLogRecord[] = [];
    const origin = await startApp({
      runtimeLogSink(record) {
        records.push(record);
      },
      trustProxyHops: 1,
    });

    const response = await fetch(
      `${origin}/healthz?email=private-user@example.com`,
      { headers: { "X-Forwarded-For": "203.0.113.9" } },
    );
    await response.json();
    await flushRequestLogs();

    const requestId = response.headers.get("x-request-id");
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(records).toContainEqual(
      expect.objectContaining({
        level: "info",
        event: "http.request.completed",
        requestId,
        method: "GET",
        statusCode: 200,
      }),
    );
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain("private-user@example.com");
    expect(serialized).not.toContain("203.0.113.9");
    expect(serialized).not.toContain("/healthz");
  });

  it("correlates unhandled failures without serializing the error payload", async () => {
    const records: RuntimeLogRecord[] = [];
    const origin = await startApp({
      runtimeLogSink(record) {
        records.push(record);
      },
      readinessProbe: async () => {
        throw new Error("sensitive-provider-detail");
      },
    });

    const response = await fetch(`${origin}/readyz`);
    expect(response.status).toBe(500);
    const requestId = response.headers.get("x-request-id");
    await response.json();
    await flushRequestLogs();

    expect(records).toContainEqual({
      level: "error",
      event: "http.request.unhandled_error",
      requestId,
      errorName: "Error",
    });
    expect(records).toContainEqual(
      expect.objectContaining({
        level: "error",
        event: "http.request.completed",
        requestId,
        statusCode: 500,
      }),
    );
    expect(JSON.stringify(records)).not.toContain("sensitive-provider-detail");
  });

  it("returns a stable JSON 404 contract", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/missing`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });
});
