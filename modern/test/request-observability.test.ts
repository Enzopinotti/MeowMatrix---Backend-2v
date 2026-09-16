import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { StructuredLogRecord } from "../src/observability/request-observability.js";

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

async function listen(input: {
  logs: StructuredLogRecord[];
  requestId?: string;
  clockValues?: number[];
}) {
  const clockValues = [...(input.clockValues ?? [100, 125])];
  const app = createApp({
    requestLogSink(record) {
      input.logs.push(record);
    },
    requestIdFactory: () => input.requestId ?? "server-request-id",
    requestClock: () => clockValues.shift() ?? 125,
  });
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe("request observability", () => {
  it("generates a server-owned request id and ignores a spoofed inbound id", async () => {
    const logs: StructuredLogRecord[] = [];
    const origin = await listen({ logs, requestId: "server-generated-123" });

    const response = await fetch(`${origin}/missing?token=must-not-be-logged`, {
      headers: { "x-request-id": "attacker-controlled" },
    });
    await response.text();

    expect(response.headers.get("x-request-id")).toBe("server-generated-123");
    expect(logs).toEqual([
      expect.objectContaining({
        level: "info",
        event: "http_request_completed",
        requestId: "server-generated-123",
        method: "GET",
        path: "/missing",
        statusCode: 404,
        durationMs: 25,
      }),
    ]);
    expect(JSON.stringify(logs)).not.toContain("must-not-be-logged");
    expect(JSON.stringify(logs)).not.toContain("attacker-controlled");
  });

  it("suppresses routine health/readiness access logs while still returning correlation ids", async () => {
    const logs: StructuredLogRecord[] = [];
    const origin = await listen({ logs });

    const health = await fetch(`${origin}/healthz`);
    const ready = await fetch(`${origin}/readyz`);
    await health.text();
    await ready.text();

    expect(health.headers.get("x-request-id")).toBe("server-request-id");
    expect(ready.headers.get("x-request-id")).toBe("server-request-id");
    expect(logs).toEqual([]);
  });

  it("never logs request bodies, cookies, authorization headers, query strings or raw IPs", async () => {
    const logs: StructuredLogRecord[] = [];
    const origin = await listen({ logs });

    const response = await fetch(`${origin}/api/v1/auth/login?secret=query-secret`, {
      method: "POST",
      headers: {
        authorization: "Bearer header-secret",
        cookie: "meow_session=cookie-secret",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "private@example.test",
        password: "body-secret-password",
      }),
    });
    await response.text();

    const serialized = JSON.stringify(logs);
    expect(serialized).toContain("/api/v1/auth/login");
    expect(serialized).not.toContain("query-secret");
    expect(serialized).not.toContain("header-secret");
    expect(serialized).not.toContain("cookie-secret");
    expect(serialized).not.toContain("private@example.test");
    expect(serialized).not.toContain("body-secret-password");
    expect(serialized).not.toContain("127.0.0.1");
  });
});
