#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose=(docker compose -p meow-b6 -f "$repo_root/integration/compose.b6.yml")
api_origin="${MEOW_API_ORIGIN:-http://127.0.0.1:18080}"
web_origin="${MEOW_WEB_ORIGIN:-http://127.0.0.1:14173}"
runtime="$repo_root/.runtime/b7-recovery"
smoke_runtime="$repo_root/.runtime/b6-smoke"
cookies="$smoke_runtime/cookies.txt"
rm -rf "$runtime"
mkdir -p "$runtime"

test -s "$cookies"

stage() {
  printf 'B7 recovery rehearsal: %s\n' "$1"
}

json_expr() {
  local expression="$1"
  node -e "let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);const v=(${expression});if(v===undefined||v===null)process.exit(2);process.stdout.write(String(v));});"
}

wait_http() {
  local url="$1"
  local label="$2"
  for attempt in $(seq 1 60); do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      return 0
    fi
    if [ "$attempt" -eq 60 ]; then
      echo "$label did not become ready: $url" >&2
      "${compose[@]}" ps >&2 || true
      return 1
    fi
    sleep 1
  done
}

mongo_eval() {
  local expression="$1"
  "${compose[@]}" exec -T mongo mongosh --quiet \
    'mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
    --eval "$expression"
}

collection_counts() {
  mongo_eval 'print(JSON.stringify({users:db.users.countDocuments({}),products:db.products.countDocuments({}),orders:db.commerce_orders.countDocuments({}),privateFiles:db.private_files.countDocuments({status:"active"})}))' | tail -n 1
}

stage "create durable recovery fixture through authenticated API"
private_source="$runtime/recovery-avatar.png"
private_download="$runtime/recovery-avatar.downloaded.png"
printf '\x89PNG\r\n\x1a\nB7-recovery-private-blob' > "$private_source"

upload="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -H "Origin: $web_origin" \
  -F "file=@$private_source;type=image/png;filename=recovery-avatar.png" \
  "$api_origin/api/v1/files/purposes/avatar")"
file_id="$(printf '%s' "$upload" | json_expr 'j.data.id')"

orders="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  "$api_origin/api/v1/orders?limit=25&offset=0")"
order_id="$(printf '%s' "$orders" | json_expr 'j.data.items[0].id')"

storage_key="$(mongo_eval "const d=db.private_files.findOne({_id:ObjectId('$file_id'),status:'active'});if(!d){quit(2)};print(d.storageKey)" | tail -n 1)"
[[ "$storage_key" =~ ^[a-f0-9]{64}$ ]]

blob_hash_before="$("${compose[@]}" exec -T api node -e "const{readFileSync}=require('node:fs');const{createHash}=require('node:crypto');const k='$storage_key';const p='/var/lib/meow/private/'+k.slice(0,2)+'/'+k;process.stdout.write(createHash('sha256').update(readFileSync(p)).digest('hex'));" )"
counts_before="$(collection_counts)"

stage "capture Mongo and private-volume backups"
backup_started="$(date +%s)"
"${compose[@]}" exec -T mongo mongodump \
  --uri='mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
  --archive --gzip > "$runtime/mongo.archive.gz"
"${compose[@]}" exec -T api tar -C /var/lib/meow/private -cf - . \
  > "$runtime/private-files.tar"
backup_finished="$(date +%s)"
backup_seconds="$((backup_finished - backup_started))"

test -s "$runtime/mongo.archive.gz"
test -s "$runtime/private-files.tar"
sha256sum "$runtime/mongo.archive.gz" "$runtime/private-files.tar" \
  > "$runtime/backup.sha256"
sha256sum --check "$runtime/backup.sha256" >/dev/null

backend_sha="$(git -C "$repo_root" rev-parse HEAD)"
frontend_sha="$(tr -d '[:space:]' < "$repo_root/integration/frontend-ref.txt")"
printf '{"backendSha":"%s","frontendSha":"%s","fileId":"%s","orderId":"%s","blobSha256":"%s","counts":%s,"backupSeconds":%s}\n' \
  "$backend_sha" "$frontend_sha" "$file_id" "$order_id" "$blob_hash_before" "$counts_before" "$backup_seconds" \
  > "$runtime/recovery-manifest.json"

stage "destroy data volumes"
"${compose[@]}" down --volumes --remove-orphans --timeout 10 >/dev/null

stage "recreate empty database and restore backup"
restore_started="$(date +%s)"
"${compose[@]}" up -d mongo mongo-init mailpit >/dev/null
for attempt in $(seq 1 60); do
  if "${compose[@]}" exec -T mongo mongosh --quiet \
    'mongodb://127.0.0.1:27017/admin?directConnection=true' \
    --eval 'if(db.adminCommand({hello:1}).isWritablePrimary!==true){quit(1)}' \
    >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "Mongo did not become writable-primary before restore" >&2
    exit 1
  fi
  sleep 1
done

"${compose[@]}" exec -T mongo mongorestore \
  --uri='mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
  --archive --gzip --drop < "$runtime/mongo.archive.gz" >/dev/null

"${compose[@]}" run --rm --no-deps --entrypoint sh api \
  -c 'mkdir -p /var/lib/meow/private && tar -C /var/lib/meow/private -xf -' \
  < "$runtime/private-files.tar" >/dev/null

"${compose[@]}" up -d --wait api web >/dev/null
wait_http "$api_origin/readyz" "API readiness after full restore"
wait_http "$web_origin/healthz" "frontend health after full restore"
restore_finished="$(date +%s)"
restore_seconds="$((restore_finished - restore_started))"

stage "verify restored durable state"
counts_after="$(collection_counts)"
test "$counts_after" = "$counts_before"

blob_hash_after="$("${compose[@]}" exec -T api node -e "const{readFileSync}=require('node:fs');const{createHash}=require('node:crypto');const k='$storage_key';const p='/var/lib/meow/private/'+k.slice(0,2)+'/'+k;process.stdout.write(createHash('sha256').update(readFileSync(p)).digest('hex'));" )"
test "$blob_hash_after" = "$blob_hash_before"

curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  "$api_origin/api/v1/files/$file_id/content" \
  --output "$private_download"
cmp "$private_source" "$private_download"

restored_order="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  "$api_origin/api/v1/orders/$order_id")"
restored_order_id="$(printf '%s' "$restored_order" | json_expr 'j.data.id')"
test "$restored_order_id" = "$order_id"

stage "record recovery evidence"
printf '{"backendSha":"%s","frontendSha":"%s","fileId":"%s","orderId":"%s","blobSha256":"%s","counts":%s,"backupSeconds":%s,"restoreSeconds":%s,"result":"success"}\n' \
  "$backend_sha" "$frontend_sha" "$file_id" "$order_id" "$blob_hash_after" "$counts_after" "$backup_seconds" "$restore_seconds" \
  > "$runtime/recovery-manifest.json"
cat "$runtime/recovery-manifest.json"
printf 'B7 recovery rehearsal passed: backup=%ss restore=%ss\n' "$backup_seconds" "$restore_seconds"
