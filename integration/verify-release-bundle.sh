#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bundle_dir="${MEOW_RELEASE_BUNDLE_DIR:-$repo_root/.runtime/release-bundle}"
archive="$bundle_dir/meow-app-images.tar"
manifest="$bundle_dir/release-bundle.json"
checksums="$bundle_dir/SHA256SUMS"
api_tag="${MEOW_RELEASE_API_TAG:-meow-matrix-api:b6}"
web_tag="${MEOW_RELEASE_WEB_TAG:-meow-matrix-web:b6}"

for file in "$archive" "$manifest" "$checksums"; do
  test -s "$file"
done

(
  cd "$bundle_dir"
  sha256sum --check --strict SHA256SUMS
)

readarray -t manifest_values < <(node - "$manifest" <<'NODE'
const fs = require("node:fs");
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sha40 = /^[a-f0-9]{40}$/;
const sha64 = /^[a-f0-9]{64}$/;
const imageId = /^sha256:[a-f0-9]{64}$/;
if (j.schemaVersion !== "meow-release-bundle-v1") process.exit(1);
if (!sha40.test(j.backendSha) || !sha40.test(j.frontendSha)) process.exit(2);
if (!sha64.test(j.composeSha256) || !sha64.test(j.archive?.sha256 ?? "")) process.exit(3);
if (!imageId.test(j.images?.api?.imageId ?? "") || !imageId.test(j.images?.web?.imageId ?? "")) process.exit(4);
if (!imageId.test(j.qualificationDependencies?.mongoImageId ?? "") || !imageId.test(j.qualificationDependencies?.mailpitImageId ?? "")) process.exit(5);
if (j.archive?.file !== "meow-app-images.tar" || !Number.isSafeInteger(j.archive?.bytes) || j.archive.bytes < 1) process.exit(6);
console.log(j.images.api.imageId);
console.log(j.images.web.imageId);
console.log(j.archive.sha256);
console.log(String(j.archive.bytes));
NODE
)

expected_api_id="${manifest_values[0]}"
expected_web_id="${manifest_values[1]}"
expected_archive_sha="${manifest_values[2]}"
expected_archive_bytes="${manifest_values[3]}"

actual_archive_sha="$(sha256sum "$archive" | awk '{print $1}')"
actual_archive_bytes="$(stat -c '%s' "$archive")"
test "$actual_archive_sha" = "$expected_archive_sha"
test "$actual_archive_bytes" = "$expected_archive_bytes"

if [[ "${MEOW_RELEASE_VERIFY_REMOVE_EXISTING:-false}" == "true" ]]; then
  docker image rm "$api_tag" "$web_tag" >/dev/null
fi

docker load --input "$archive" >/tmp/meow-release-bundle-load.log
cat /tmp/meow-release-bundle-load.log

actual_api_id="$(docker image inspect "$api_tag" --format '{{.Id}}')"
actual_web_id="$(docker image inspect "$web_tag" --format '{{.Id}}')"
test "$actual_api_id" = "$expected_api_id"
test "$actual_web_id" = "$expected_web_id"

test "$(docker image inspect "$api_tag" --format '{{.Config.User}}')" = "node"
test "$(docker image inspect "$web_tag" --format '{{.Config.User}}')" = "node"

api_container="meow-bundle-api-${RANDOM}"
web_container="meow-bundle-web-${RANDOM}"
cleanup() {
  docker rm -f "$api_container" "$web_container" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --rm \
  --name "$api_container" \
  --read-only \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=16m \
  -e NODE_ENV=test \
  -p 127.0.0.1:18081:8080 \
  "$api_tag" >/dev/null

docker run -d --rm \
  --name "$web_container" \
  --read-only \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  -p 127.0.0.1:14174:8080 \
  "$web_tag" >/dev/null

for attempt in $(seq 1 30); do
  api_ok=false
  web_ok=false
  if curl -fsS http://127.0.0.1:18081/healthz >/tmp/meow-bundle-api-health.json; then
    grep -Fq '"status":"ok"' /tmp/meow-bundle-api-health.json && api_ok=true
  fi
  if curl -fsS http://127.0.0.1:14174/healthz >/tmp/meow-bundle-web-health.txt; then
    web_ok=true
  fi
  if [[ "$api_ok" == "true" && "$web_ok" == "true" ]]; then
    break
  fi
  if [[ "$attempt" == "30" ]]; then
    docker logs "$api_container" || true
    docker logs "$web_container" || true
    exit 1
  fi
  sleep 1
done

curl -fsS http://127.0.0.1:14174/files >/tmp/meow-bundle-files.html
grep -Fq '<!doctype html>' /tmp/meow-bundle-files.html

printf 'release bundle verified: api=%s web=%s archive=%s\n' \
  "$actual_api_id" "$actual_web_id" "$actual_archive_sha"
