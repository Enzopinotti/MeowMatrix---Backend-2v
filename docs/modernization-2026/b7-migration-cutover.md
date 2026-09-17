# B7 migration and cutover contract

B7 turns the provider-neutral parts of deployment/cutover into executable contracts. It does **not** claim that a public production deployment exists yet and it does not invent DNS, TLS, Mongo, private-storage, SMTP, registry, monitoring, backup/PITR or provider credentials.

## Scope

The maintained provider-neutral controls now include:

1. a read-only Mongo data preflight for migration source/target review;
2. a machine-validated cutover manifest that binds the candidate, release-bundle evidence, registry-promotion evidence, production image digests and rollback target;
3. a public runtime smoke that can be pointed at the eventual real HTTPS authorities;
4. an immutable application release bundle that packages the already-qualified API/web images without rebuilding source;
5. a no-rebuild registry-promotion contract that proves bundle image IDs can be pushed, resolved to immutable registry digests, pulled back by digest and re-smoked without identity drift.

The permanent quality, full-stack and recovery workflows exercise these contracts so they cannot silently rot as documentation-only scripts. Bundle details live in `b7-release-bundle.md`; registry promotion details live in `b7-registry-promotion.md`.

## Data preflight

Run the compiled CLI with the deployment Mongo configuration:

```bash
DATA_PREFLIGHT_MODE=source npm run preflight:data
DATA_PREFLIGHT_MODE=target npm run preflight:data
```

`MONGO_URL` is required; `MONGO_DB_NAME` is optional in the same way as the runtime.

The command is read-only. It does not create indexes, rewrite documents, normalize emails, delete orphan rows or migrate blobs. Its output is aggregate JSON only; it does not print user documents, emails, tokens, file keys or object identifiers.

### Source mode

Source mode rejects a migration before copy/cutover when the historical authority is not structurally consumable. It checks the required historical collections and validates user/product shapes plus normalized-email collisions. Categories are inspected when present.

The CLI records Mongo topology/session capability for evidence, but source mode deliberately does not require a replica set or logical sessions: a historical standalone source may still be read and migrated. Transaction/session capability becomes a fail-closed requirement only in target mode.

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

## Immutable application release bundle

After the exact API/web images pass the permanent full-stack checks, `integration/package-release-bundle.sh` saves those **same images** into an application-only Docker archive. There is no second application build between qualification and packaging.

The retained bundle contains API + web only. Mongo and Mailpit remain external qualification dependencies and are not promoted as Meow application artifacts.

`integration/verify-release-bundle.sh` proves the archive round-trips without rebuild by deleting the local API/web tags, loading the archive, requiring exact local image-ID equality and starting both images again under the hardened non-root/read-only runtime contract.

A local Docker image ID is not a registry manifest digest. Registry promotion consumes these retained bundle bytes and records registry digests separately.

## Registry promotion

`integration/promote-release-bundle.sh` is the provider-neutral bridge from retained bundle to registry digest.

Permanent full-stack CI exercises it against an isolated, pinned Distribution registry. The rehearsal loads API/web from the retained tar, pushes them without build, captures the immutable registry digest, deletes local tags, pulls both images back by digest, requires exact image-ID equality and runs the hardened API/web smoke again.

The manual `.github/workflows/modern-external-registry-promotion.yml` uses the same script for the eventual real registry. It downloads an existing retained `main` bundle by run ID, validates caller-supplied bundle hashes, verifies the backend SHA is a merged `main` authority, authenticates with repository/environment secrets and uploads sanitized `meow-registry-promotion-v1` evidence. It never deploys the images and never rebuilds source.

## Cutover manifest

`integration/cutover-manifest.example.json` is a schema example, not production evidence. The current manifest contract is **schema version 3**. A real cutover must create a separate manifest populated with real immutable values and validate it using:

```bash
CUTOVER_MANIFEST_PATH=/path/to/cutover.json npm run preflight:cutover
```

The validator requires:

- full 40-character backend and frontend Git SHAs;
- immutable `sha256:` API/web **registry** image digests;
- API contract version;
- exact HTTPS frontend and API origins;
- explicit trusted-proxy hop count;
- data strategy (`in-place` or `copy`), write-freeze decision and immutable pre-cutover backup evidence reference;
- quality, full-stack, recovery and data-preflight run IDs;
- immutable release-bundle evidence: bundle-producing run ID, bundle-manifest SHA-256 and bundle-archive SHA-256;
- immutable registry-promotion evidence: promotion run ID and promotion-evidence SHA-256;
- a rollback candidate different from the release candidate;
- immutable rollback image digests and an explicit data rollback action;
- a bounded rollback decision deadline.

The bundle SHA-256 values identify the retained **pre-registry** artifact. `registryPromotionRunId` and `registryPromotionEvidenceSha256` identify the no-rebuild promotion that produced the registry digests. `apiImageDigest` and `webImageDigest` identify what the selected registry serves. These are separate layers of one release chain and must not be substituted for each other.

The manifest intentionally does not fetch GitHub, a registry or a cloud provider. Provider-specific cutover authorization must verify that the supplied run/evidence references exist and that the release image digests exactly match the same promotion evidence.

## Public smoke

The public smoke is parameterized rather than tied to an invented domain:

```bash
MEOW_PUBLIC_WEB_ORIGIN=https://app.example.com \
MEOW_PUBLIC_API_ORIGIN=https://api.example.com \
MEOW_PUBLIC_API_VERSION=2026-b7 \
bash integration/public-smoke.sh
```

HTTP is rejected by default. `MEOW_PUBLIC_API_VERSION` is mandatory so the smoke is bound to the promoted API contract instead of a hardcoded repository version. `MEOW_PUBLIC_ALLOW_HTTP=true` exists only so permanent CI can exercise the same script against the isolated local topology.

The smoke checks frontend health/SPA fallback, security headers, API health/version/request correlation, readiness, credentialed CORS for the intended frontend and rejection of an untrusted browser origin.

It deliberately avoids registration/login/order mutations against production. Provider-specific cutover may add a dedicated synthetic account or deeper browser transaction smoke only after its lifecycle and cleanup are explicitly defined.

## External qualification gate

`.github/workflows/modern-external-qualification.yml` packages the public smoke as a manual release gate once real production HTTPS authorities exist. It verifies that both supplied repository SHAs are merged authorities, that the frontend SHA is the exact frontend pinned by the backend candidate, runs the HTTPS smoke, and publishes sanitized success/failure evidence.

The workflow does **not** deploy or mutate production. Its PR-only contract job tests the external fail-closed boundary, while permanent full-stack CI tests the successful evidence path against the isolated local topology. Operational details live in `b7-external-qualification.md`.

## Cutover sequence

The intended sequence is:

1. qualify the exact backend/frontend candidate through permanent quality/full-stack/recovery gates;
2. package the already-qualified API/web images into the retained immutable release bundle and record the bundle run/hash evidence;
3. select the real registry and dispatch the external registry-promotion workflow against that exact retained bundle;
4. record the promotion run/evidence hash plus the API/web registry digests returned by that same promotion;
5. run source data preflight before migration/write freeze;
6. capture provider-specific backup/PITR evidence for Mongo and private storage;
7. migrate or bind the final data authorities;
8. run target data preflight against the production target before public promotion;
9. populate and validate the real schema-v3 cutover manifest, including bundle evidence, promotion evidence, registry digests and rollback artifacts;
10. deploy API/web by the immutable registry digests from the promotion evidence;
11. establish canonical DNS/TLS and production cookies/CORS/proxy configuration;
12. dispatch `Meow external release qualification` against the real HTTPS authorities using the exact merged backend/frontend SHAs and expected API version;
13. require that external qualification to be green before release acceptance;
14. monitor the bounded rollback window and either accept the release or execute the manifest rollback plan.

No DNS switch should be used as the first time the target database, backup, release bundle, registry promotion, rollback candidate or public runtime contract is tested.

## Rollback boundary

Application rollback and data rollback are separate decisions. Re-pointing API/web to older immutable images cannot safely undo writes that used a newer incompatible data shape. The manifest therefore requires an explicit data action and pre-cutover backup evidence rather than treating `git revert` as a production rollback strategy.

Any migration that permits writes during copy/cutover needs a provider-specific reconciliation plan. This repository does not claim one exists until the real data topology and provider are selected.

## Remaining B7 provider-specific work

B7 still remains active for the parts that cannot be proven from the repository alone:

- canonical production hostnames, DNS and TLS termination;
- real production Mongo topology and migration execution;
- real durable private-object/storage authority and its backup policy;
- real SMTP authority and deliverability/operational monitoring;
- selecting/configuring the production registry and credentials;
- dispatching the real external registry promotion and recording its immutable digests/evidence;
- production backup frequency/PITR and declared RPO/RTO;
- external uptime/error/alert routing;
- deploying the promoted images by digest;
- dispatch and green evidence from the real public HTTPS qualification gate;
- optional controlled synthetic browser transactions, if their lifecycle is explicitly defined;
- cutover approval, observation window and rollback rehearsal against the selected provider.

The historical external-secret rotation/revocation blocker remains separate. Repository changes cannot prove that previously exposed third-party credentials were rotated outside GitHub.
