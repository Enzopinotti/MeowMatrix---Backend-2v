# B7 migration and cutover contract

This carrier turns the remaining provider-neutral parts of B7 into executable contracts. It does **not** claim that a public production deployment exists yet and it does not invent DNS, TLS, Mongo, private-storage, SMTP, registry, monitoring, backup/PITR or provider credentials.

## Scope

The carrier adds three independent controls:

1. a read-only Mongo data preflight for migration source/target review;
2. a machine-validated cutover manifest that binds the candidate, evidence and rollback target;
3. a public runtime smoke that can be pointed at the eventual real HTTPS authorities.

The permanent quality, full-stack and recovery workflows exercise these contracts so they cannot silently rot as documentation-only scripts.

## Data preflight

Run the compiled CLI with the deployment Mongo configuration:

```bash
DATA_PREFLIGHT_MODE=source npm run preflight:data
DATA_PREFLIGHT_MODE=target npm run preflight:data
```

`MONGO_URL` is required; `MONGO_DB_NAME` is optional in the same way as the runtime.

The command is read-only. It does not create indexes, rewrite documents, normalize emails, delete orphan rows or migrate blobs. Its output is aggregate JSON only; it does not print user documents, emails, tokens, file keys or object identifiers.

### Source mode

Source mode is intended to reject a migration before copy/cutover when the historical authority is not structurally consumable. It checks the required historical collections and validates user/product shapes plus normalized-email collisions. Categories are inspected when present.

The current CLI also records Mongo topology/session capability. A source failing the required connectivity/topology contract must be handled explicitly in the provider-specific migration plan rather than silently copied through an unqualified path.

### Target mode

Target mode is stricter because the 2026 runtime depends on Mongo transactions and durable operational indexes. It requires:

- replica-set or mongos transaction capability plus logical sessions;
- all maintained auth, commerce, rate-limit and private-file collections;
- the permanent indexes created by the runtime;
- valid user/product/category shapes;
- no normalized-email collisions;
- no orphan auth sessions/password resets/carts/cart lines/orders/outbox/private-file metadata.

The command exits non-zero when a required collection/index is absent or an integrity counter is non-zero.

A green target preflight does **not** prove that private blob objects exist in the final provider. Blob authority must be validated by the provider-specific storage migration and public/deployment rehearsal. The permanent destructive recovery gate already validates Mongo metadata and private blob bytes together inside the reproducible topology.

## Cutover manifest

`integration/cutover-manifest.example.json` is a schema example, not production evidence. A real cutover must create a separate manifest populated with real immutable values and validate it using:

```bash
CUTOVER_MANIFEST_PATH=/path/to/cutover.json npm run preflight:cutover
```

The validator requires:

- full 40-character backend and frontend Git SHAs;
- immutable `sha256:` API/web image digests;
- API contract version;
- exact HTTPS frontend and API origins;
- explicit trusted-proxy hop count;
- data strategy (`in-place` or `copy`), write-freeze decision and immutable pre-cutover backup evidence reference;
- quality, full-stack, recovery and data-preflight run IDs;
- a rollback candidate different from the release candidate;
- immutable rollback image digests and an explicit data rollback action;
- a bounded rollback decision deadline.

The manifest intentionally does not fetch GitHub, a registry or a cloud provider. Verification that each supplied SHA/digest/run/evidence reference really exists is part of release promotion and provider-specific cutover authorization.

## Public smoke

The public smoke is parameterized rather than tied to an invented domain:

```bash
MEOW_PUBLIC_WEB_ORIGIN=https://app.example.com \
MEOW_PUBLIC_API_ORIGIN=https://api.example.com \
bash integration/public-smoke.sh
```

HTTP is rejected by default. `MEOW_PUBLIC_ALLOW_HTTP=true` exists only so permanent CI can exercise the same script against the isolated local topology.

The smoke checks:

- frontend health and SPA fallback;
- browser security header baseline;
- API health/version and server-generated UUID request correlation;
- API readiness with every dependency check healthy;
- credentialed CORS for the declared frontend authority;
- rejection of an untrusted browser preflight origin.

It deliberately avoids registration/login/order mutations against production. Provider-specific cutover may add a dedicated synthetic account or deeper browser transaction smoke only after its lifecycle and cleanup are explicitly defined.

## Cutover sequence

The intended sequence is:

1. qualify the exact backend/frontend candidate through permanent quality/full-stack/recovery gates;
2. build/promote immutable registry artifacts and record their digests;
3. run source data preflight before migration/write freeze;
4. capture provider-specific backup/PITR evidence for Mongo and private storage;
5. migrate or bind the final data authorities;
6. run target data preflight against the production target before public promotion;
7. populate and validate the real cutover manifest, including rollback artifacts;
8. deploy by immutable digest;
9. establish canonical DNS/TLS and production cookies/CORS/proxy configuration;
10. run the public smoke against the real HTTPS origins;
11. monitor the bounded rollback window and either accept the release or execute the manifest rollback plan.

No DNS switch should be used as the first time the target database, backup, rollback candidate or public runtime contract is tested.

## Rollback boundary

Application rollback and data rollback are separate decisions. Re-pointing API/web to older immutable images cannot safely undo writes that used a newer incompatible data shape. The manifest therefore requires an explicit data action and pre-cutover backup evidence rather than treating `git revert` as a production rollback strategy.

Any migration that permits writes during copy/cutover needs a provider-specific reconciliation plan. This repository does not claim one exists until the real data topology and provider are selected.

## Remaining B7 provider-specific work

After this carrier, B7 still remains active for the parts that cannot be proven from the repository alone:

- canonical production hostnames, DNS and TLS termination;
- real production Mongo topology and migration execution;
- real durable private-object/storage authority and its backup policy;
- real SMTP authority and deliverability/operational monitoring;
- registry/release promotion using immutable digests;
- production backup frequency/PITR and declared RPO/RTO;
- external uptime/error/alert routing;
- real public HTTPS smoke and, if chosen, controlled synthetic browser transactions;
- cutover approval, observation window and rollback rehearsal against the selected provider.

The historical external-secret rotation/revocation blocker remains separate. Repository changes cannot prove that previously exposed third-party credentials were rotated outside GitHub.