# B7 release bundle evidence chain

This note supplements `b7-migration-cutover.md` and `b7-release-bundle.md`.

Cutover manifest schema version 2 requires the future production manifest to bind the promoted registry digests to the already-qualified application bundle through three immutable evidence fields:

- `evidence.bundleRunId` — the GitHub Actions run that produced the retained bundle from the qualified images;
- `evidence.bundleManifestSha256` — SHA-256 of `release-bundle.json`;
- `evidence.bundleArchiveSha256` — SHA-256 of `meow-app-images.tar`.

These values do not replace `apiImageDigest` / `webImageDigest`. The bundle hashes identify the retained pre-registry artifact; the image digests identify what the selected registry actually serves after promotion.

A production promotion is valid only when it can show that registry images were loaded/tagged/pushed from the retained bundle without rebuilding the source tree. The provider-specific promotion workflow is still intentionally absent until a real registry is selected.
