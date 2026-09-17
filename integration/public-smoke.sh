#!/usr/bin/env bash
set -euo pipefail

web_origin="${MEOW_PUBLIC_WEB_ORIGIN:-}"
api_origin="${MEOW_PUBLIC_API_ORIGIN:-}"
allow_http="${MEOW_PUBLIC_ALLOW_HTTP:-false}"
api_version="${MEOW_PUBLIC_API_VERSION:-}"

if [ -z "$api_version" ]; then
  echo "MEOW_PUBLIC_API_VERSION is required" >&2
  exit 2
fi

require_origin() {
  local value="$1"
  local name="$2"
  if [ -z "$value" ]; then
    echo "$name is required" >&2
    exit 2
  fi
  node -e '
const value=process.argv[1];const name=process.argv[2];const allowHttp=process.argv[3]==="true";
const url=new URL(value);
if(url.origin!==value||url.username||url.password||url.pathname!=="/"||url.search||url.hash){throw new Error(name+" must be an exact origin");}
if(url.protocol!=="https:"&&!(allowHttp&&url.protocol==="http:")){throw new Error(name+" must use HTTPS");}
' "$value" "$name" "$allow_http"
}

require_origin "$web_origin" MEOW_PUBLIC_WEB_ORIGIN
require_origin "$api_origin" MEOW_PUBLIC_API_ORIGIN

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

stage() {
  printf 'B7 public smoke: %s\n' "$1"
}

stage "frontend TLS/runtime authority"
curl --fail --silent --show-error \
  -D "$tmp/web-health.headers" \
  "$web_origin/healthz" \
  -o "$tmp/web-health.body"
grep -Fq '"status":"ok"' "$tmp/web-health.body"

curl --fail --silent --show-error \
  -D "$tmp/web-spa.headers" \
  "$web_origin/files" \
  -o "$tmp/web-spa.html"
grep -Eqi '<!doctype html>|<html' "$tmp/web-spa.html"
grep -Eqi '^x-content-type-options:[[:space:]]*nosniff' "$tmp/web-spa.headers"

stage "API liveness and request correlation"
curl --fail --silent --show-error \
  -D "$tmp/api-health.headers" \
  "$api_origin/healthz" \
  -o "$tmp/api-health.body"
grep -Fq '"status":"ok"' "$tmp/api-health.body"
node -e '
const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
if(j.version!==process.argv[2])process.exit(1);
' "$tmp/api-health.body" "$api_version"
request_id="$(awk 'BEGIN{IGNORECASE=1} /^x-request-id:/ {gsub("\r", "", $2); print $2}' "$tmp/api-health.headers" | tail -n1)"
[[ "$request_id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]]

stage "API readiness"
curl --fail --silent --show-error \
  -D "$tmp/api-ready.headers" \
  "$api_origin/readyz" \
  -o "$tmp/api-ready.body"
node -e '
const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
if(j.ready!==true)process.exit(1);
for(const value of Object.values(j.checks??{})){if(value!=="ok")process.exit(2);}
' "$tmp/api-ready.body"
grep -Eqi '^cache-control:[[:space:]]*no-store' "$tmp/api-ready.headers"

stage "canonical credentialed CORS boundary"
status="$(curl --silent --show-error \
  -o "$tmp/auth-me.body" \
  -D "$tmp/auth-me.headers" \
  -w '%{http_code}' \
  -H "Origin: $web_origin" \
  "$api_origin/api/v1/auth/me")"
test "$status" = "401"
grep -Fqi "access-control-allow-origin: $web_origin" "$tmp/auth-me.headers"
grep -Eqi '^access-control-allow-credentials:[[:space:]]*true' "$tmp/auth-me.headers"
grep -Eqi '^vary:.*origin' "$tmp/auth-me.headers"

stage "untrusted preflight origin rejection"
status="$(curl --silent --show-error \
  -o "$tmp/evil.body" \
  -D "$tmp/evil.headers" \
  -w '%{http_code}' \
  -X OPTIONS \
  -H 'Origin: https://untrusted.invalid' \
  -H 'Access-Control-Request-Method: POST' \
  "$api_origin/api/v1/auth/login")"
test "$status" = "403"
if grep -Eqi '^access-control-allow-origin:' "$tmp/evil.headers"; then
  echo "Untrusted origin unexpectedly received Access-Control-Allow-Origin" >&2
  exit 1
fi

printf 'B7 public smoke passed for web=%s api=%s\n' "$web_origin" "$api_origin"
