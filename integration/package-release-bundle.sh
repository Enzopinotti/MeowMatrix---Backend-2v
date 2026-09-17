#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
candidate_path="${MEOW_RELEASE_CANDIDATE_PATH:-$repo_root/.runtime/release/candidate.json}"
bundle_dir="${MEOW_RELEASE_BUNDLE_DIR:-$repo_root/.runtime/release-bundle}"
archive="$bundle_dir/meow-app-images.tar"
manifest="$bundle_dir/release-bundle.json"
checksums="$bundle_dir/SHA256SUMS"
api_tag="${MEOW_RELEASE_API_TAG:-meow-matrix-api:b6}"
web_tag="${MEOW_RELEASE_WEB_TAG:-meow-matrix-web:b6}"
api_version="${MEOW_RELEASE_API_VERSION:-2026-b7}"

mkdir -p "$bundle_dir"
rm -f "$archive" "$manifest" "$checksums"
test -s "$candidate_path"

backend_sha="$(git -C "$repo_root" rev-parse HEAD)"
frontend_sha="$(tr -d '[:space:]' < "$repo_root/integration/frontend-ref.txt")"
compose_sha256="$(sha256sum "$repo_root/integration/compose.b6.yml" | awk '{print $1}')"
api_image_id="$(docker image inspect "$api_tag" --format '{{.Id}}')"
web_image_id="$(docker image inspect "$web_tag" --format '{{.Id}}')"

node - "$candidate_path" "$backend_sha" "$frontend_sha" "$compose_sha256" "$api_image_id" "$web_image_id" <<'NODE'
const fs = require("node:fs");
const [path, backendSha, frontendSha, composeSha256, apiImageId, webImageId] = process.argv.slice(2);
const candidate = JSON.parse(fs.readFileSync(path, "utf8"));
const sha40 = /^[a-f0-9]{40}$/;
const sha64 = /^[a-f0-9]{64}$/;
const imageId = /^sha256:[a-f0-9]{64}$/;
if (!sha40.test(backendSha) || !sha40.test(frontendSha) || !sha64.test(composeSha256)) process.exit(1);
if (!imageId.test(apiImageId) || !imageId.test(webImageId)) process.exit(2);
if (candidate.backendSha !== backendSha || candidate.frontendSha !== frontendSha) process.exit(3);
if (candidate.composeSha256 !== composeSha256) process.exit(4);
if (candidate.images?.api !== apiImageId || candidate.images?.web !== webImageId) process.exit(5);
if (!imageId.test(candidate.images?.mongo ?? "") || !imageId.test(candidate.images?.mailpit ?? "")) process.exit(6);
NODE

docker save --output "$archive" "$api_tag" "$web_tag"
test -s "$archive"
archive_sha256="$(sha256sum "$archive" | awk '{print $1}')"
archive_bytes="$(stat -c '%s' "$archive")"
generated_at="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

BACKEND_SHA="$backend_sha" \
FRONTEND_SHA="$frontend_sha" \
COMPOSE_SHA256="$compose_sha256" \
API_IMAGE_ID="$api_image_id" \
WEB_IMAGE_ID="$web_image_id" \
API_TAG="$api_tag" \
WEB_TAG="$web_tag" \
ARCHIVE_SHA256="$archive_sha256" \
ARCHIVE_BYTES="$archive_bytes" \
GENERATED_AT="$generated_at" \
API_VERSION="$api_version" \
CANDIDATE_PATH="$candidate_path" \
MANIFEST_PATH="$manifest" \
node <<'NODE'
const fs = require("node:fs");
const candidate = JSON.parse(fs.readFileSync(process.env.CANDIDATE_PATH, "utf8"));
const manifest = {
  schemaVersion: "meow-release-bundle-v1",
  generatedAt: process.env.GENERATED_AT,
  backendSha: process.env.BACKEND_SHA,
  frontendSha: process.env.FRONTEND_SHA,
  apiVersion: process.env.API_VERSION,
  composeSha256: process.env.COMPOSE_SHA256,
  images: {
    api: { tag: process.env.API_TAG, imageId: process.env.API_IMAGE_ID },
    web: { tag: process.env.WEB_TAG, imageId: process.env.WEB_IMAGE_ID }
  },
  qualificationDependencies: {
    mongoImageId: candidate.images.mongo,
    mailpitImageId: candidate.images.mailpit
  },
  archive: {
    file: "meow-app-images.tar",
    sha256: process.env.ARCHIVE_SHA256,
    bytes: Number(process.env.ARCHIVE_BYTES)
  },
  github: {
    repository: process.env.GITHUB_REPOSITORY ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    workflowRef: process.env.GITHUB_WORKFLOW_REF ?? null
  }
};
fs.writeFileSync(process.env.MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
NODE

manifest_sha256="$(sha256sum "$manifest" | awk '{print $1}')"
printf '%s  %s\n' "$archive_sha256" "$(basename "$archive")" > "$checksums"
printf '%s  %s\n' "$manifest_sha256" "$(basename "$manifest")" >> "$checksums"

printf 'release bundle created: %s\n' "$bundle_dir"
printf 'archive sha256: %s\n' "$archive_sha256"
printf 'manifest sha256: %s\n' "$manifest_sha256"
cat "$manifest"
