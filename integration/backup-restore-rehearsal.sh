#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose=(docker compose -p meow-b6 -f "$repo_root/integration/compose.b6.yml")
runtime="$repo_root/.runtime/b7-backup-restore"
order_id="${1:?order id is required}"
file_id="${2:?private file id is required}"
run_token="$(printf '%s' "${GITHUB_RUN_ID:-local}-$$" | tr -cd '[:alnum:]_-')"
restore_db="meow_restore_$(printf '%s' "$run_token" | tr '-' '_')"
archive="$runtime/mongo.archive.gz"
blob_backup="$runtime/private-files"
restore_volume="meow-b7-restore-${run_token}"
restore_container="meow-b7-restore-${run_token}"

mkdir -p "$blob_backup"

cleanup() {
  "${compose[@]}" exec -T mongo mongosh --quiet \
    'mongodb://127.0.0.1:27017/admin?directConnection=true' \
    --eval "db.getSiblingDB('$restore_db').dropDatabase()" >/dev/null 2>&1 || true
  docker rm -f "$restore_container" >/dev/null 2>&1 || true
  docker volume rm "$restore_volume" >/dev/null 2>&1 || true
  rm -rf "$runtime"
}
trap cleanup EXIT

printf 'B7 recovery rehearsal: capture source metadata\n'
metadata="$("${compose[@]}" exec -T mongo mongosh --quiet \
  'mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
  --eval "
const file = db.private_files.findOne({_id:ObjectId('$file_id')},{storageKey:1,sha256:1,status:1});
if (!file || file.status !== 'active') { quit(1); }
if (typeof file.storageKey !== 'string' || !/^[a-f0-9]{64}$/.test(file.storageKey)) { quit(2); }
if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256)) { quit(3); }
print(file.storageKey + ' ' + file.sha256);
")"
read -r storage_key expected_sha <<<"$metadata"

printf 'B7 recovery rehearsal: create Mongo archive\n'
"${compose[@]}" exec -T mongo mongodump --quiet \
  --uri='mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
  --archive --gzip > "$archive"
test -s "$archive"

printf 'B7 recovery rehearsal: capture private blob tree\n'
api_container="$("${compose[@]}" ps -q api)"
test -n "$api_container"
docker cp -a "$api_container:/var/lib/meow/private/." "$blob_backup/"
test -f "$blob_backup/${storage_key:0:2}/$storage_key"

printf 'B7 recovery rehearsal: restore Mongo into isolated namespace\n'
cat "$archive" | "${compose[@]}" exec -T mongo mongorestore --quiet \
  --uri='mongodb://127.0.0.1:27017/admin?directConnection=true' \
  --archive --gzip \
  --nsFrom='meow_matrix.*' \
  --nsTo="$restore_db.*" \
  --drop

"${compose[@]}" exec -T mongo mongosh --quiet \
  'mongodb://127.0.0.1:27017/admin?directConnection=true' \
  --eval "
const source = db.getSiblingDB('meow_matrix');
const restored = db.getSiblingDB('$restore_db');
for (const collection of ['users','products','orders','private_files']) {
  if (source.getCollection(collection).countDocuments({}) !== restored.getCollection(collection).countDocuments({})) { quit(10); }
}
if (restored.orders.countDocuments({_id:ObjectId('$order_id')}) !== 1) { quit(11); }
const file = restored.private_files.findOne({_id:ObjectId('$file_id')});
if (!file || file.storageKey !== '$storage_key' || file.sha256 !== '$expected_sha') { quit(12); }
" >/dev/null

printf 'B7 recovery rehearsal: restore private blobs into isolated volume\n'
docker volume create "$restore_volume" >/dev/null
docker create --name "$restore_container" \
  -v "$restore_volume:/var/lib/meow/private" \
  meow-matrix-api:b6 \
  node -e 'setInterval(() => undefined, 60000)' >/dev/null
docker start "$restore_container" >/dev/null
docker cp -a "$blob_backup/." "$restore_container:/var/lib/meow/private/"

docker exec "$restore_container" node -e "
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const key = '$storage_key';
const expected = '$expected_sha';
const content = readFileSync('/var/lib/meow/private/' + key.slice(0,2) + '/' + key);
const actual = createHash('sha256').update(content).digest('hex');
if (actual !== expected) process.exit(1);
"

printf 'B7 recovery rehearsal passed: mongo namespace + private blob integrity restored\n'
