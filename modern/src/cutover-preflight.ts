import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCutoverManifest } from "./cutover-manifest.js";

const manifestPath = process.env.CUTOVER_MANIFEST_PATH?.trim();
if (!manifestPath) {
  throw new Error("CUTOVER_MANIFEST_PATH is required");
}

const absolutePath = resolve(manifestPath);
const raw = await readFile(absolutePath, "utf8");
let input: unknown;
try {
  input = JSON.parse(raw) as unknown;
} catch {
  throw new Error("Cutover manifest must contain valid JSON");
}

const manifest = parseCutoverManifest(input);
console.log(
  JSON.stringify({
    status: "ok",
    schemaVersion: manifest.schemaVersion,
    release: {
      backendSha: manifest.release.backendSha,
      frontendSha: manifest.release.frontendSha,
      apiImageDigest: manifest.release.apiImageDigest,
      webImageDigest: manifest.release.webImageDigest,
      apiVersion: manifest.release.apiVersion,
    },
    public: manifest.public,
    data: {
      strategy: manifest.data.strategy,
      writeFreezeRequired: manifest.data.writeFreezeRequired,
      backupEvidenceConfigured:
        manifest.data.preCutoverBackupEvidence.length > 0,
    },
    evidence: manifest.evidence,
    rollback: {
      backendSha: manifest.rollback.backendSha,
      frontendSha: manifest.rollback.frontendSha,
      apiImageDigest: manifest.rollback.apiImageDigest,
      webImageDigest: manifest.rollback.webImageDigest,
      dataAction: manifest.rollback.dataAction,
      decisionDeadlineMinutes: manifest.rollback.decisionDeadlineMinutes,
    },
  }),
);
