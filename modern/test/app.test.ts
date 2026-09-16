import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp, type AppOptions } from "../src/app.js";

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

describe("createApp", () => {
  it("serves liveness without Mongo, credentials, or external services", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/healthz`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "meow-api-test",
      version: "2026-b5",
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
