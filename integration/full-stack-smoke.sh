#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose=(docker compose -p meow-b6 -f "$repo_root/integration/compose.b6.yml")
api_origin="${MEOW_API_ORIGIN:-http://127.0.0.1:18080}"
web_origin="${MEOW_WEB_ORIGIN:-http://127.0.0.1:14173}"
mailpit_origin="${MEOW_MAILPIT_ORIGIN:-http://127.0.0.1:18025}"
runtime="$repo_root/.runtime/b6-smoke"
mkdir -p "$runtime"
cookies="$runtime/cookies.txt"
rm -f "$cookies"

stage() {
  printf 'B6 smoke: %s\n' "$1"
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

stage "dependency readiness"
wait_http "$api_origin/readyz" "API readiness"
wait_http "$web_origin/healthz" "frontend health"
wait_http "$mailpit_origin/api/v1/messages" "Mailpit API"

stage "non-root runtime users"
api_uid="$("${compose[@]}" exec -T api id -u)"
test "$api_uid" != "0"
web_uid="$("${compose[@]}" exec -T web id -u)"
test "$web_uid" != "0"

stage "Mongo writable-primary contract"
"${compose[@]}" exec -T mongo mongosh --quiet \
  'mongodb://127.0.0.1:27017/admin?directConnection=true' \
  --eval 'if (db.adminCommand({hello:1}).isWritablePrimary !== true) { quit(1); }' \
  >/dev/null

stage "catalog seed"
product_id="66a000000000000000000002"
"${compose[@]}" exec -T mongo mongosh --quiet \
  'mongodb://127.0.0.1:27017/meow_matrix?directConnection=true' \
  --eval "
const id = ObjectId('$product_id');
const now = new Date();
const result = db.products.updateOne(
  {_id:id},
  {\$set:{name:'B6 Transaction Product',description:'Full-stack transaction smoke',price:1250,code:'B6-SMOKE-001',stock:5,category:null,thumbnails:[],status:true,isVisible:true,tags:['b6'],createdAt:now,updatedAt:now}},
  {upsert:true}
);
if (result.acknowledged !== true) { quit(1); }
" >/dev/null

run_token="${GITHUB_RUN_ID:-local}-$(date +%s)"
email="b6-${run_token}@example.test"
password='B6-Smoke-Password-2026!'

stage "auth registration and cookie login"
register_body="$(printf '{"name":"B6","lastName":"Smoke","email":"%s","password":"%s"}' "$email" "$password")"
curl --fail-with-body --silent --show-error \
  -H 'Content-Type: application/json' \
  -H "Origin: $web_origin" \
  --data "$register_body" \
  "$api_origin/api/v1/auth/register" >/dev/null

login_body="$(printf '{"email":"%s","password":"%s"}' "$email" "$password")"
curl --fail-with-body --silent --show-error \
  -c "$cookies" -b "$cookies" \
  -H 'Content-Type: application/json' \
  -H "Origin: $web_origin" \
  --data "$login_body" \
  "$api_origin/api/v1/auth/login" >/dev/null

auth_me="$(curl --fail-with-body --silent --show-error -b "$cookies" "$api_origin/api/v1/auth/me")"
auth_email="$(printf '%s' "$auth_me" | json_expr 'j.data.email')"
test "$auth_email" = "$email"

stage "server-authoritative cart"
cart="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -X PUT \
  -H 'Content-Type: application/json' \
  -H "Origin: $web_origin" \
  --data '{"quantity":2}' \
  "$api_origin/api/v1/cart/items/$product_id")"
checkout_ready="$(printf '%s' "$cart" | json_expr 'j.data.checkoutReady')"
test "$checkout_ready" = "true"

stage "transactional checkout"
idempotency_key="checkout:b6:${run_token}"
checkout="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -X POST \
  -H "Origin: $web_origin" \
  -H "Idempotency-Key: $idempotency_key" \
  "$api_origin/api/v1/checkout")"
order_id="$(printf '%s' "$checkout" | json_expr 'j.data.order.id')"
order_code="$(printf '%s' "$checkout" | json_expr 'j.data.order.code')"
replayed="$(printf '%s' "$checkout" | json_expr 'j.data.replayed')"
test "$replayed" = "false"

stock_after_checkout="$(curl --fail-with-body --silent --show-error "$api_origin/api/v1/products/$product_id" | json_expr 'j.data.stock')"
test "$stock_after_checkout" = "3"

stage "idempotent checkout replay"
replay="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -X POST \
  -H "Origin: $web_origin" \
  -H "Idempotency-Key: $idempotency_key" \
  "$api_origin/api/v1/checkout")"
replay_id="$(printf '%s' "$replay" | json_expr 'j.data.order.id')"
replay_flag="$(printf '%s' "$replay" | json_expr 'j.data.replayed')"
test "$replay_id" = "$order_id"
test "$replay_flag" = "true"
stock_after_replay="$(curl --fail-with-body --silent --show-error "$api_origin/api/v1/products/$product_id" | json_expr 'j.data.stock')"
test "$stock_after_replay" = "3"

stage "order uniqueness"
orders="$(curl --fail-with-body --silent --show-error -b "$cookies" "$api_origin/api/v1/orders?limit=25&offset=0")"
order_matches="$(printf '%s' "$orders" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);process.stdout.write(String(j.data.items.filter(o=>o.id==='$order_id').length));});")"
test "$order_matches" = "1"

stage "post-commit outbox delivery"
for attempt in $(seq 1 50); do
  messages="$(curl --fail --silent --show-error "$mailpit_origin/api/v1/messages")"
  if printf '%s' "$messages" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);process.exit(j.messages?.some(m=>String(m.Subject).includes('$order_code'))?0:1);});"; then
    break
  fi
  if [ "$attempt" -eq 50 ]; then
    echo "Order confirmation did not reach Mailpit for $order_code" >&2
    exit 1
  fi
  sleep 0.2
done

stage "private file upload and authenticated download"
private_source="$runtime/avatar.png"
private_download="$runtime/avatar.downloaded.png"
printf '\x89PNG\r\n\x1a\nB6-private-persistence' > "$private_source"

upload="$(curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -H "Origin: $web_origin" \
  -F "file=@$private_source;type=image/png;filename=avatar.png" \
  "$api_origin/api/v1/files/purposes/avatar")"
file_id="$(printf '%s' "$upload" | json_expr 'j.data.id')"

curl --fail-with-body --silent --show-error -b "$cookies" \
  "$api_origin/api/v1/files/$file_id/content" \
  --output "$private_download"
cmp "$private_source" "$private_download"

stage "API restart preserves private blob"
"${compose[@]}" restart api >/dev/null
wait_http "$api_origin/readyz" "API readiness after restart"

curl --fail-with-body --silent --show-error -b "$cookies" \
  "$api_origin/api/v1/files/$file_id/content" \
  --output "$private_download"
cmp "$private_source" "$private_download"

stage "Mongo restart preserves order"
"${compose[@]}" restart mongo >/dev/null
wait_http "$api_origin/readyz" "API readiness after Mongo restart"

persisted_order="$(curl --fail-with-body --silent --show-error -b "$cookies" "$api_origin/api/v1/orders/$order_id")"
persisted_order_id="$(printf '%s' "$persisted_order" | json_expr 'j.data.id')"
test "$persisted_order_id" = "$order_id"

stage "private file deletion"
curl --fail-with-body --silent --show-error \
  -b "$cookies" \
  -X DELETE \
  -H "Origin: $web_origin" \
  "$api_origin/api/v1/files/$file_id" >/dev/null

deleted_status="$(curl --silent --show-error -o /dev/null -w '%{http_code}' -b "$cookies" "$api_origin/api/v1/files/$file_id/content")"
test "$deleted_status" = "404"

stage "final stock invariant"
final_stock="$(curl --fail-with-body --silent --show-error "$api_origin/api/v1/products/$product_id" | json_expr 'j.data.stock')"
test "$final_stock" = "3"

printf 'B6 full-stack smoke passed: order=%s product_stock=%s private_file=%s\n' "$order_id" "$final_stock" "$file_id"
