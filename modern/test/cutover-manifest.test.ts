import { describe, expect, it } from "vitest";
import { parseCutoverManifest } from "../src/cutover-manifest.js";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const SHA_C = "c".repeat(40);
const SHA_D = "d".repeat(40);
const DIGEST_A = `sha256:${"1".repeat(64)}`;
const DIGEST_B = `sha256:${"2".repeat(64)}`;
const DIGEST_C = `sha256:${"3".repeat(64)}`;
const DIGEST_D = `sha256:${"4".repeat(64)}`;

function validManifest() {
  return {
    schemaVersion: 1,
    release: {
      backendSha: SHA_A,
      frontendSha: SHA_B,
      apiImageDigest: DIGEST_A,
      webImageDigest: DIGEST_B,
      apiVersion: "2026-b7",
    },
    public: {
      frontendOrigin: "https://app.example.test",
      apiOrigin: "https://api.example.test",
      trustProxyHops: 1,
    },
    data: {
      strategy: "in-place",
      writeFreezeRequired: true,
      preCutoverBackupEvidence: "actions:123456",
    },
    evidence: {
      qualityRunId: 1,
      fullStackRunId: 2,
      recoveryRunId: 3,
      dataPreflightRunId: 4,
    },
    rollback: {
      backendSha: SHA_C,
      frontendSha: SHA_D,
      apiImageDigest: DIGEST_C,
      webImageDigest: DIGEST_D,
      dataAction: "none",
      decisionDeadlineMinutes: 15,
    },
  };
}

describe("cutover manifest", () => {
  it("accepts a fully pinned HTTPS release and rollback contract", () => {
    expect(parseCutoverManifest(validManifest())).toMatchObject({
      schemaVersion: 1,
      release: { backendSha: SHA_A, apiImageDigest: DIGEST_A },
      public: {
        frontendOrigin: "https://app.example.test",
        apiOrigin: "https://api.example.test",
        trustProxyHops: 1,
      },
      rollback: { backendSha: SHA_C, decisionDeadlineMinutes: 15 },
    });
  });

  it("rejects non-HTTPS or path-bearing public origins", () => {
    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        public: {
          ...validManifest().public,
          apiOrigin: "http://api.example.test",
        },
      }),
    ).toThrow("public.apiOrigin must be an exact HTTPS origin");

    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        public: {
          ...validManifest().public,
          frontendOrigin: "https://app.example.test/path",
        },
      }),
    ).toThrow("public.frontendOrigin must be an exact HTTPS origin");
  });

  it("requires immutable full SHAs and image digests", () => {
    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        release: { ...validManifest().release, backendSha: "abc123" },
      }),
    ).toThrow("release.backendSha must be a full lowercase Git SHA");

    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        release: { ...validManifest().release, apiImageDigest: "latest" },
      }),
    ).toThrow(
      "release.apiImageDigest must be an immutable sha256 image digest",
    );
  });

  it("rejects a rollback target identical to the release candidate", () => {
    const manifest = validManifest();
    expect(() =>
      parseCutoverManifest({
        ...manifest,
        rollback: {
          ...manifest.rollback,
          backendSha: manifest.release.backendSha,
          frontendSha: manifest.release.frontendSha,
          apiImageDigest: manifest.release.apiImageDigest,
          webImageDigest: manifest.release.webImageDigest,
        },
      }),
    ).toThrow("rollback target must differ from the release candidate");
  });

  it("fails closed for copy migration without freeze or data rollback", () => {
    const manifest = validManifest();
    expect(() =>
      parseCutoverManifest({
        ...manifest,
        data: {
          ...manifest.data,
          strategy: "copy",
          writeFreezeRequired: false,
        },
      }),
    ).toThrow(
      "copy migrations without a write freeze must declare restore-pre-cutover-backup rollback data action",
    );
  });

  it("bounds trusted ingress and rollback decision windows", () => {
    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        public: { ...validManifest().public, trustProxyHops: 11 },
      }),
    ).toThrow("public.trustProxyHops must be a positive integer <= 10");

    expect(() =>
      parseCutoverManifest({
        ...validManifest(),
        rollback: {
          ...validManifest().rollback,
          decisionDeadlineMinutes: 121,
        },
      }),
    ).toThrow(
      "rollback.decisionDeadlineMinutes must be a positive integer <= 120",
    );
  });
});
