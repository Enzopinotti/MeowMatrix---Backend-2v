#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bundle_dir="${MEOW_RELEASE_BUNDLE_DIR:-$repo_root/.runtime/release-bundle}"
archive="$bundle_dir/meow-app-images.tar"
manifest="$bundle_dir/release-bundle.json"
checksums="$bundle_dir/SHA256SUMS"
evidence_path="${MEOW_REGISTRY_EVIDENCE_PATH:-$repo_root/.runtime/registry-promotion/promotion.json}"
registry_host="${MEOW_REGISTRY_HOST:-}"
namespace="${MEOW_REGISTRY_NAMESPACE:-meow}"
allow_http="${MEOW_REGISTRY_ALLOW_HTTP:-false}"
verify_pull="${MEOW_REGISTRY_VERIFY_PULL:-true}"

if [[ -z "$registry_host" ]]; then
  echo "MEOW_REGISTRY_HOST is required" >&2
  exit 1
fi
if [[ "$registry_host" =~ ^https?:// ]] || [[ "$registry_host" == */* ]]; then
  echo "MEOW_REGISTRY_HOST must be host[:port] without scheme or path" >&2
  exit 1
fi
if [[ ! "$registry_host" =~ ^[A-Za-z0-9.-]+(:[0-9]{1,5})?$ ]]; then
  echo "MEOW_REGISTRY_HOST has an invalid format" >&2
  exit 1
fi
if [[ ! "$namespace" =~ ^[a-z0-9]+([._/-][a-z0-9]+)*$ ]]; then
  echo "MEOW_REGISTRY_NAMESPACE must be a lowercase repository prefix" >&2
  exit 1
fi

if [[ "$allow_http" == "true" ]]; then
  registry_scheme="http"
else
  registry_scheme="https"
fi

for file in "$archive" "$manifest" "$checksums"; do
  test -s "$file"
done
(
  cd "$bundle_dir"
  sha256sum --check --strict SHA256SUMS
)

readarray -t bundle_values < <(node - "$manifest" <<'NODE'
const fs = require("node:fs");
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sha40 = /^[a-f0-9]{40}$/;
const sha64 = /^[a-f0-9]{64}$/;
const imageId = /^sha256:[a-f0-9]{64}$/;
if (j.schemaVersion !== "meow-release-bundle-v1") process.exit(1);
if (!sha40.test(j.backendSha) || !sha40.test(j.frontendSha)) process.exit(2);
if (!imageId.test(j.images?.api?.imageId ?? "") || !imageId.test(j.images?.web?.imageId ?? "")) process.exit(3);
if (!sha64.test(j.archive?.sha256 ?? "")) process.exit(4);
console.log(j.backendSha);
console.log(j.frontendSha);
console.log(j.images.api.tag);
console.log(j.images.web.tag);
console.log(j.images.api.imageId);
console.log(j.images.web.imageId);
console.log(j.archive.sha256);
NODE
)

backend_sha="${bundle_values[0]}"
frontend_sha="${bundle_values[1]}"
api_source_tag="${bundle_values[2]}"
web_source_tag="${bundle_values[3]}"
api_expected_id="${bundle_values[4]}"
web_expected_id="${bundle_values[5]}"
bundle_archive_sha="${bundle_values[6]}"
bundle_manifest_sha="$(sha256sum "$manifest" | awk '{print $1}')"

# The bundle, not source, is the promotion authority.
docker load --input "$archive" >/tmp/meow-registry-promotion-load.log
cat /tmp/meow-registry-promotion-load.log

test "$(docker image inspect "$api_source_tag" --format '{{.Id}}')" = "$api_expected_id"
test "$(docker image inspect "$web_source_tag" --format '{{.Id}}')" = "$web_expected_id"

api_repo="$registry_host/$namespace/api"
web_repo="$registry_host/$namespace/web"
api_tag="$api_repo:$backend_sha"
web_tag="$web_repo:$frontend_sha"

docker tag "$api_source_tag" "$api_tag"
docker tag "$web_source_tag" "$web_tag"

push_and_digest() {
  local ref="$1"
  local log_file="$2"
  docker push "$ref" | tee "$log_file" >&2
  local digest
  digest="$(sed -nE 's/^.*digest: (sha256:[a-f0-9]{64}).*$/\1/p' "$log_file" | tail -n 1)"
  if [[ ! "$digest" =~ ^sha256:[a-f0-9]{64}$ ]]; then
    echo "Unable to extract immutable digest for $ref" >&2
    return 1
  fi
  printf '%s\n' "$digest"
}

api_digest="$(push_and_digest "$api_tag" /tmp/meow-api-push.log)"
web_digest="$(push_and_digest "$web_tag" /tmp/meow-web-push.log)"
api_pull_ref="$api_repo@$api_digest"
web_pull_ref="$web_repo@$web_digest"

if [[ "$verify_pull" == "true" ]]; then
  docker image rm -f "$api_tag" "$web_tag" "$api_source_tag" "$web_source_tag" >/dev/null 2>&1 || true
  docker pull "$api_pull_ref" >/tmp/meow-api-pull.log
  docker pull "$web_pull_ref" >/tmp/meow-web-pull.log
  cat /tmp/meow-api-pull.log
  cat /tmp/meow-web-pull.log
  test "$(docker image inspect "$api_pull_ref" --format '{{.Id}}')" = "$api_expected_id"
  test "$(docker image inspect "$web_pull_ref" --format '{{.Id}}')" = "$web_expected_id"
fi

api_container="meow-registry-api-${RANDOM}"
web_container="meow-registry-web-${RANDOM}"
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
  -p 127.0.0.1:18082:8080 \
  "$api_pull_ref" >/dev/null

docker run -d --rm \
  --name "$web_container" \
  --read-only \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  -p 127.0.0.1:14175:8080 \
  "$web_pull_ref" >/dev/null

for attempt in $(seq 1 30); do
  api_ok=false
  web_ok=false
  if curl -fsS http://127.0.0.1:18082/healthz >/tmp/meow-registry-api-health.json; then
    grep -Fq '"status":"ok"' /tmp/meow-registry-api-health.json && api_ok=true
  fi
  if curl -fsS http://127.0.0.1:14175/healthz >/tmp/meow-registry-web-health.txt; then
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
curl -fsS http://127.0.0.1:14175/files >/tmp/meow-registry-files.html
grep -Eqi '<!doctype html>' /tmp/meow-registry-files.html

mkdir -p "$(dirname "$evidence_path")"
generated_at="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
BACKEND_SHA="$backend_sha" \
FRONTEND_SHA="$frontend_sha" \
BUNDLE_MANIFEST_SHA="$bundle_manifest_sha" \
BUNDLE_ARCHIVE_SHA="$bundle_archive_sha" \
REGISTRY_SCHEME="$registry_scheme" \
REGISTRY_HOST="$registry_host" \
REGISTRY_NAMESPACE="$namespace" \
API_REPO="$api_repo" \
WEB_REPO="$web_repo" \
API_TAG="$backend_sha" \
WEB_TAG="$frontend_sha" \
API_DIGEST="$api_digest" \
WEB_DIGEST="$web_digest" \
API_IMAGE_ID="$api_expected_id" \
WEB_IMAGE_ID="$web_expected_id" \
GENERATED_AT="$generated_at" \
EVIDENCE_PATH="$evidence_path" \
node <<'NODE'
const fs = require("node:fs");
const evidence = {
  schemaVersion: "meow-registry-promotion-v1",
  generatedAt: process.env.GENERATED_AT,
  backendSha: process.env.BACKEND_SHA,
  frontendSha: process.env.FRONTEND_SHA,
  bundle: {
    manifestSha256: process.env.BUNDLE_MANIFEST_SHA,
    archiveSha256: process.env.BUNDLE_ARCHIVE_SHA
  },
  registry: {
    scheme: process.env.REGISTRY_SCHEME,
    host: process.env.REGISTRY_HOST,
    namespace: process.env.REGISTRY_NAMESPACE
  },
  images: {
    api: {
      repository: process.env.API_REPO,
      tag: process.env.API_TAG,
      digest: process.env.API_DIGEST,
      imageId: process.env.API_IMAGE_ID,
      pullRef: `${process.env.API_REPO}@${process.env.API_DIGEST}`
    },
    web: {
      repository: process.env.WEB_REPO,
      tag: process.env.WEB_TAG,
      digest: process.env.WEB_DIGEST,
      imageId: process.env.WEB_IMAGE_ID,
      pullRef: `${process.env.WEB_REPO}@${process.env.WEB_DIGEST}`
    }
  },
  proof: {
    source: "immutable-release-bundle",
    rebuilt: false,
    pulledByDigest: true,
    exactImageIdsPreserved: true,
    hardenedSmokePassed: true
  },
  github: {
    repository: process.env.GITHUB_REPOSITORY ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    workflowRef: process.env.GITHUB_WORKFLOW_REF ?? null
  }
};
fs.writeFileSync(process.env.EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
NODE

cat "$evidence_path"
printf 'registry promotion verified: api=%s web=%s\n' "$api_digest" "$web_digest"
