# B7 registry promotion without rebuild

This carrier closes the provider-neutral gap between the retained immutable application bundle and the immutable registry digests that a real deployment must consume. It does **not** choose a registry provider and it does not deploy production.

## Invariant

The registry is never allowed to build Meow Matrix from source.

The promotion authority is the retained `meow-release-bundle-<backend SHA>` artifact produced by the qualifying `main` full-stack run. The bundle contains the already-qualified API and web images plus `release-bundle.json` and `SHA256SUMS`.

The chain is:

```text
backend/frontend Git SHAs
        ↓
qualified local image IDs
        ↓
immutable release bundle + internal SHA-256
        ↓
registry promotion without rebuild
        ↓
immutable registry manifest digests
        ↓
cutover manifest v3
        ↓
deploy by digest
        ↓
external HTTPS qualification
```

Local Docker image IDs and registry manifest digests are different identifiers and must not be substituted for one another.

## Permanent CI rehearsal

`modern-full-stack.yml` starts an isolated Distribution registry after the release bundle has already passed the transactional/full-stack and destructive bundle reload proof.

The rehearsal uses Distribution `3.1.1`, pinned by digest. This line includes the upstream fix for CVE-2026-41888. The registry is bound only to `127.0.0.1` in CI and is not a production authority.

`integration/promote-release-bundle.sh` then:

1. validates `SHA256SUMS` from the retained bundle;
2. loads API/web from `meow-app-images.tar` rather than building source;
3. requires the loaded image IDs to match the bundle manifest;
4. tags and pushes those exact images to the target registry;
5. records the immutable digest returned by each push;
6. removes the source/target local tags;
7. pulls API/web back **by digest**;
8. requires the pulled image IDs to match the bundle image IDs;
9. runs API/web as non-root with read-only filesystems, dropped capabilities and `no-new-privileges`;
10. writes `meow-registry-promotion-v1` evidence.

The evidence intentionally contains no username/password/token. It records bundle hashes, backend/frontend SHAs, registry repository names, immutable image digests, image IDs and proof flags.

## Main rehearsal evidence

A successful `main` full-stack run publishes a short-lived `meow-registry-rehearsal-<backend SHA>` artifact in addition to the 90-day immutable release bundle. The rehearsal artifact is evidence that the promotion algorithm works; its localhost registry digests are **not** production digests.

## External registry promotion

`.github/workflows/modern-external-registry-promotion.yml` is the manual provider-neutral promotion gate.

Required inputs:

- the qualifying `main` full-stack `bundle_run_id`;
- full backend SHA;
- expected SHA-256 of `release-bundle.json`;
- expected SHA-256 of `meow-app-images.tar`;
- registry `host[:port]`;
- lowercase registry namespace.

The workflow verifies that the backend SHA is contained in `main`, downloads `meow-release-bundle-<backend SHA>` from the specified run, validates both expected bundle hashes, and confirms the frontend SHA inside the bundle is still the frontend pinned by that backend authority.

Registry credentials are intentionally not committed. The workflow expects repository/environment secrets:

```text
MEOW_REGISTRY_USERNAME
MEOW_REGISTRY_PASSWORD
```

Those credentials should be scoped to only the intended release repositories. Rotation and provider-specific identity policy remain infrastructure concerns.

The workflow then executes the same `promote-release-bundle.sh` used by the local rehearsal and uploads `meow-registry-promotion-<backend SHA>` containing sanitized evidence.

## Promotion evidence and cutover manifest v3

The real promotion evidence JSON must be hashed after the successful external promotion:

```bash
sha256sum external-evidence.json
```

`cutover-manifest` schema v3 requires both:

- `evidence.registryPromotionRunId`;
- `evidence.registryPromotionEvidenceSha256`.

The manifest's `release.apiImageDigest` and `release.webImageDigest` must be the **registry digests recorded by that same promotion evidence**. The manifest validator checks shape/immutability; provider-specific authorization must additionally verify the referenced run/evidence actually exists and matches the registry authority.

## Current qualified bundle example

The first retained bundle created after the bundle carrier merged was produced by full-stack run `35219582498` for backend `2078d2669fc7efbceb1f8680a0468556552b525c` and frontend `9d64c48d2324703cb594acad8e1bb0c9a3d6191c`.

At creation time its internal hashes were:

```text
release-bundle.json  d46ea1549746498464d23be21908085e6574b8253d3291d4249598f235b7bb8a
meow-app-images.tar  74ffad7c8f2b6641453c4d8b3f1aec72a10b66b058a8f1047889411a7bf42bf9
```

These values are evidence for that exact bundle only. A later `main` release must use the hashes emitted by its own qualifying run.

## Security boundary

The external promotion workflow:

- never runs `docker build` or `docker compose build`;
- defaults to normal Docker TLS verification for non-local registries;
- never prints the registry password;
- publishes only sanitized promotion evidence;
- does not deploy the promoted digest;
- does not mutate DNS, Mongo, storage or SMTP;
- does not by itself declare B7 complete.

A green promotion proves only that exact bundle images reached the registry and can be pulled back by immutable digest with the same local image identities.

## Remaining provider-specific release work

After real registry promotion, B7 still needs the selected provider's:

- production registry/repository authority and credential policy;
- canonical DNS and TLS termination;
- production Mongo migration/topology;
- durable private-object storage and backup policy;
- SMTP authority and deliverability monitoring;
- PITR/backup schedule and declared RPO/RTO;
- deployment of the promoted API/web **by registry digest**;
- real target data preflight;
- completed cutover manifest v3 with rollback digests;
- external HTTPS qualification;
- rollback observation window and release acceptance.
