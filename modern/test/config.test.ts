import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";

describe("loadConfig", () => {
  it("uses safe local defaults without requiring secrets", () => {
    expect(loadConfig({})).toEqual({
      port: 8080,
      nodeEnv: "development",
      frontendOrigins: [],
      sessionCookieSecure: false,
      sessionCookieSameSite: "lax",
      sessionTtlSeconds: 28_800,
      resetTtlSeconds: 1_800,
    });
  });

  it("uses Secure cookies by default in production", () => {
    expect(loadConfig({ NODE_ENV: "production" })).toMatchObject({
      sessionCookieSecure: true,
      sessionCookieSameSite: "lax",
    });
  });

  it("normalizes and deduplicates exact frontend origins", () => {
    expect(
      loadConfig({
        FRONTEND_ORIGINS:
          "https://app.example.com, http://localhost:5173,https://app.example.com",
      }).frontendOrigins,
    ).toEqual(["https://app.example.com", "http://localhost:5173"]);
  });

  it("rejects origin entries containing paths", () => {
    expect(() =>
      loadConfig({ FRONTEND_ORIGINS: "https://app.example.com/path" }),
    ).toThrow(
      "FRONTEND_ORIGINS entries must be origins without paths or credentials",
    );
  });

  it("requires Secure when SameSite=None is explicitly selected", () => {
    expect(() =>
      loadConfig({
        SESSION_COOKIE_SAME_SITE: "none",
        SESSION_COOKIE_SECURE: "false",
      }),
    ).toThrow(
      "SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true",
    );
  });

  it("validates the listener port", () => {
    expect(() => loadConfig({ PORT: "0" })).toThrow(
      "PORT must be an integer between 1 and 65535",
    );
  });

  it("validates NODE_ENV", () => {
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(
      "NODE_ENV must be development, test, or production",
    );
  });
});
