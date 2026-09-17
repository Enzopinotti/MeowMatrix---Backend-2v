# B7 immutable release bundle

This carrier closes the provider-neutral gap between **an application image that passed CI** and **an application artifact that can be promoted without rebuilding it**.

It does not choose a registry, deploy production, invent a domain, or claim that local Docker image IDs are registry digests. Those remain provider-specific B7 cutover work.

## Release authority

The permanent full-stack workflow already builds exactly two maintained application images:

- `meow-matrix-api:b6` from the backend `modern/` authority;
- `meow-matrix-web:b6` from the exact frontend SHA in `integration/frontend-ref.txt`.

Those same images are exercised by the transactional smoke, target data preflight and local public-smoke evidence contract. After those checks pass, `integration/package-release-bundle.sh` saves **those already-tested images** with `docker save`. There is no second application build between qualification and packaging.

Mongo and Mailpit are not application release artifacts. Their exact qualification image IDs remain in the bundle manifest as context, but the application bundle contains only API + web. Production Mongo and SMTP remain external infrastructure authorities.

## Bundle contents

The generated `.runtime/release-bundle/` directory contains:

- `meow-app-images.tar` — Docker archive containing the qualified API + web images;
- `release-bundle.json` — `meow-release-bundle-v1` manifest;
- `SHA256SUMS` — SHA-256 checksums for the archive and manifest.

The manifest binds:

- exact backend Git SHA;
- exact pinned frontend Git SHA;
- API contract version;
- Compose SHA-256 used during qualification;
- API and web local Docker image IDs;
- Mongo and Mailpit image IDs used by qualification;
- archive filename, byte size and SHA-256;
- GitHub run metadata when generated in Actions.

A local Docker image ID (`sha256:...`) is **not** represented as a registry manifest digest. The future registry promotion must load this exact archive, tag/push its application images, record the resulting registry digests, and place those registry digests in the production cutover manifest.

## Round-trip proof

`integration/verify-release-bundle.sh` verifies the bundle without a rebuild:

1. verifies `SHA256SUMS`;
2. validates the bundle manifest shape and immutable identifiers;
3. verifies archive size/hash;
4. when CI requests destructive verification, removes the local API/web tags;
5. reloads the Docker archive;
6. requires the reloaded image IDs to equal the manifest IDs exactly;
7. requires both images to remain configured as `USER node`;
8. starts API and web from the reloaded bundle under read-only root filesystem, `cap_drop=ALL` and `no-new-privileges`;
9. verifies API/web health and the `/files` SPA deep-link.

This proves the artifact is independently loadable and still represents the application images that were exercised earlier in the same full-stack job.

## GitHub artifact publication

Pull requests execute the package + destructive reload proof but do **not** publish a release artifact.

On a qualifying push to `main`, the same permanent full-stack job uploads `.runtime/release-bundle/` as:

```text
meow-release-bundle-<backend SHA>
```

The upload happens only after the application runtime, transactional smoke, data preflight, public-smoke evidence, package generation and destructive reload verification have passed.

The artifact is release input, not production proof. A provider-specific promotion workflow still has to consume the exact artifact bytes rather than rebuilding Git source.

## Cutover manifest chain

Cutover manifest schema version 2 adds mandatory bundle evidence:

- `bundleRunId`;
- `bundleManifestSha256`;
- `bundleArchiveSha256`.

The intended chain is therefore:

```text
backend SHA + pinned frontend SHA
        ↓
qualified API/web image IDs
        ↓
immutable release bundle + SHA-256 evidence
        ↓
registry promotion without rebuild
        ↓
registry API/web digests
        ↓
validated cutover manifest
        ↓
production deployment by digest
        ↓
external HTTPS qualification evidence
```

The repository can validate the shape of this chain today. It cannot prove the future registry artifact exists until a real registry/provider is selected.

## Remaining provider-specific work

B7 remains active for:

- selecting the production registry/hosting authority;
- loading the retained bundle and pushing API/web without a rebuild;
- recording immutable registry digests;
- production Mongo/private-storage/SMTP authorities and backups;
- canonical HTTPS origins, DNS and TLS;
- monitoring/alerts and production RPO/RTO;
- real target data preflight;
- real external qualification run;
- final cutover/rollback execution.

Mailpit remains CI/dev-only and must never be promoted from this bundle as production SMTP.
