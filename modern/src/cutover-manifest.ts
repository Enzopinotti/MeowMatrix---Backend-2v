export type CutoverManifest = {
  schemaVersion: 1;
  release: {
    backendSha: string;
    frontendSha: string;
    apiImageDigest: string;
    webImageDigest: string;
    apiVersion: string;
  };
  public: {
    frontendOrigin: string;
    apiOrigin: string;
    trustProxyHops: number;
  };
  data: {
    strategy: "in-place" | "copy";
    writeFreezeRequired: boolean;
    preCutoverBackupEvidence: string;
  };
  evidence: {
    qualityRunId: number;
    fullStackRunId: number;
    recoveryRunId: number;
    dataPreflightRunId: number;
  };
  rollback: {
    backendSha: string;
    frontendSha: string;
    apiImageDigest: string;
    webImageDigest: string;
    dataAction: "none" | "restore-pre-cutover-backup";
    decisionDeadlineMinutes: number;
  };
};

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactString(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0
  ) {
    throw new Error(`${field} must be a non-empty exact string`);
  }
  return value;
}

function gitSha(value: unknown, field: string): string {
  const candidate = exactString(value, field);
  if (!/^[a-f0-9]{40}$/.test(candidate)) {
    throw new Error(`${field} must be a full lowercase Git SHA`);
  }
  return candidate;
}

function imageDigest(value: unknown, field: string): string {
  const candidate = exactString(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(candidate)) {
    throw new Error(`${field} must be an immutable sha256 image digest`);
  }
  return candidate;
}

function positiveInteger(
  value: unknown,
  field: string,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new Error(`${field} must be a positive integer <= ${maximum}`);
  }
  return value;
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean`);
  return value;
}

function httpsOrigin(value: unknown, field: string): string {
  const candidate = exactString(value, field);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${field} must be a valid absolute HTTPS origin`);
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== candidate
  ) {
    throw new Error(
      `${field} must be an exact HTTPS origin without path or credentials`,
    );
  }
  return candidate;
}

function oneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function parseCutoverManifest(input: unknown): CutoverManifest {
  const root = record(input, "manifest");
  if (root.schemaVersion !== 1) {
    throw new Error("schemaVersion must equal 1");
  }

  const release = record(root.release, "release");
  const publicConfig = record(root.public, "public");
  const data = record(root.data, "data");
  const evidence = record(root.evidence, "evidence");
  const rollback = record(root.rollback, "rollback");

  const manifest: CutoverManifest = {
    schemaVersion: 1,
    release: {
      backendSha: gitSha(release.backendSha, "release.backendSha"),
      frontendSha: gitSha(release.frontendSha, "release.frontendSha"),
      apiImageDigest: imageDigest(
        release.apiImageDigest,
        "release.apiImageDigest",
      ),
      webImageDigest: imageDigest(
        release.webImageDigest,
        "release.webImageDigest",
      ),
      apiVersion: exactString(release.apiVersion, "release.apiVersion"),
    },
    public: {
      frontendOrigin: httpsOrigin(
        publicConfig.frontendOrigin,
        "public.frontendOrigin",
      ),
      apiOrigin: httpsOrigin(publicConfig.apiOrigin, "public.apiOrigin"),
      trustProxyHops: positiveInteger(
        publicConfig.trustProxyHops,
        "public.trustProxyHops",
        10,
      ),
    },
    data: {
      strategy: oneOf(data.strategy, "data.strategy", ["in-place", "copy"]),
      writeFreezeRequired: boolean(
        data.writeFreezeRequired,
        "data.writeFreezeRequired",
      ),
      preCutoverBackupEvidence: exactString(
        data.preCutoverBackupEvidence,
        "data.preCutoverBackupEvidence",
      ),
    },
    evidence: {
      qualityRunId: positiveInteger(
        evidence.qualityRunId,
        "evidence.qualityRunId",
      ),
      fullStackRunId: positiveInteger(
        evidence.fullStackRunId,
        "evidence.fullStackRunId",
      ),
      recoveryRunId: positiveInteger(
        evidence.recoveryRunId,
        "evidence.recoveryRunId",
      ),
      dataPreflightRunId: positiveInteger(
        evidence.dataPreflightRunId,
        "evidence.dataPreflightRunId",
      ),
    },
    rollback: {
      backendSha: gitSha(rollback.backendSha, "rollback.backendSha"),
      frontendSha: gitSha(rollback.frontendSha, "rollback.frontendSha"),
      apiImageDigest: imageDigest(
        rollback.apiImageDigest,
        "rollback.apiImageDigest",
      ),
      webImageDigest: imageDigest(
        rollback.webImageDigest,
        "rollback.webImageDigest",
      ),
      dataAction: oneOf(rollback.dataAction, "rollback.dataAction", [
        "none",
        "restore-pre-cutover-backup",
      ]),
      decisionDeadlineMinutes: positiveInteger(
        rollback.decisionDeadlineMinutes,
        "rollback.decisionDeadlineMinutes",
        120,
      ),
    },
  };

  const releaseIdentity = [
    manifest.release.backendSha,
    manifest.release.frontendSha,
    manifest.release.apiImageDigest,
    manifest.release.webImageDigest,
  ].join(":");
  const rollbackIdentity = [
    manifest.rollback.backendSha,
    manifest.rollback.frontendSha,
    manifest.rollback.apiImageDigest,
    manifest.rollback.webImageDigest,
  ].join(":");
  if (releaseIdentity === rollbackIdentity) {
    throw new Error("rollback target must differ from the release candidate");
  }

  if (
    manifest.data.strategy === "copy" &&
    manifest.rollback.dataAction === "none" &&
    !manifest.data.writeFreezeRequired
  ) {
    throw new Error(
      "copy migrations without a write freeze must declare restore-pre-cutover-backup rollback data action",
    );
  }

  return manifest;
}
