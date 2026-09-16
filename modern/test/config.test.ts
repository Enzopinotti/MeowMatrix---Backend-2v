import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";

describe("loadConfig", () => {
  it("uses safe local defaults without requiring secrets", () => {
    expect(loadConfig({})).toEqual({
      port: 8080,
      nodeEnv: "development",
    });
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
