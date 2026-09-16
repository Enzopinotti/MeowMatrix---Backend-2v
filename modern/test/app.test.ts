import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let server: Server | undefined;

afterEach(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      server = undefined;
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

async function startApp() {
  server = createApp({ serviceName: "meow-api-test" }).listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe("createApp", () => {
  it("serves health without Mongo, credentials, or external services", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/healthz`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "meow-api-test",
      version: "2026-b2",
    });
    expect(response.headers.get("x-powered-by")).toBeNull();
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
