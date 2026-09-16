#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runtime="$repo_root/.runtime/release"
mkdir -p "$runtime"

backend_sha="$(git -C "$repo_root" rev-parse HEAD)"
frontend_sha="$(tr -d '[:space:]' < "$repo_root/integration/frontend-ref.txt")"
compose_sha256="$(sha256sum "$repo_root/integration/compose.b6.yml" | awk '{print $1}')"
api_image_id="$(docker image inspect meow-matrix-api:b6 --format '{{.Id}}')"
web_image_id="$(docker image inspect meow-matrix-web:b6 --format '{{.Id}}')"
mongo_image_id="$(docker image inspect mongo:8.0.32-noble --format '{{.Id}}')"
mailpit_image_id="$(docker image inspect axllent/mailpit:v1.31.1 --format '{{.Id}}')"

for image_id in "$api_image_id" "$web_image_id" "$mongo_image_id" "$mailpit_image_id"; do
  [[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]]
done
[[ "$backend_sha" =~ ^[a-f0-9]{40}$ ]]
[[ "$frontend_sha" =~ ^[a-f0-9]{40}$ ]]
[[ "$compose_sha256" =~ ^[a-f0-9]{64}$ ]]

printf '{"backendSha":"%s","frontendSha":"%s","composeSha256":"%s","images":{"api":"%s","web":"%s","mongo":"%s","mailpit":"%s"}}\n' \
  "$backend_sha" "$frontend_sha" "$compose_sha256" \
  "$api_image_id" "$web_image_id" "$mongo_image_id" "$mailpit_image_id" \
  > "$runtime/candidate.json"

cat "$runtime/candidate.json"
