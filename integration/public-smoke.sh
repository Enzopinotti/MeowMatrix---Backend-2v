#!/usr/bin/env bash
set -euo pipefail

web_origin="${MEOW_PUBLIC_WEB_ORIGIN:-}"
api_origin="${MEOW_PUBLIC_API_ORIGIN:-}"
allow_http="${MEOW_PUBLIC_ALLOW_HTTP:-false}"
api_version="${MEOW_PUBLIC_API_VERSION:-}"
evidence_path="${MEOW_PUBLIC_EVIDENCE_PATH:-}"

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
const dns=require("node:dns").promises;
const net=require("node:net");
const value=process.argv[1];
const name=process.argv[2];
const allowHttp=process.argv[3]==="true";
function nonPublicV4(value){
  const p=value.split(".").map(Number);
  if(p.length!==4||p.some((part)=>!Number.isInteger(part)||part<0||part>255))return true;
  const [a,b]=p;
  return a===0||a===10||a===127||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===0)||(a===192&&b===168)||(a===198&&(b===18||b===19))||a>=224;
}
function nonPublic(value){
  if(net.isIPv4(value))return nonPublicV4(value);
  if(net.isIPv6(value)){
    const lower=value.toLowerCase();
    if(lower==="::"||lower==="::1"||lower.startsWith("fc")||lower.startsWith("fd")||/^fe[89ab]/.test(lower)||lower.startsWith("ff")||lower.startsWith("2001:db8:"))return true;
    if(lower.startsWith("::ffff:")){
      const mapped=lower.slice(7);
      return net.isIPv4(mapped)?nonPublicV4(mapped):true;
    }
    return false;
  }
  return true;
}
(async()=>{
  const url=new URL(value);
  if(url.origin!==value||url.username||url.password||url.pathname!=="/"||url.search||url.hash){throw new Error(name+" must be an exact origin");}
  if(url.protocol!=="https:"&&!(allowHttp&&url.protocol==="http:")){throw new Error(name+" must use HTTPS");}
  if(!allowHttp){
    if(url.port&&url.port!=="443")throw new Error(name+" must use the default HTTPS port or 443");
    const host=url.hostname.toLowerCase();
    if(host==="localhost"||host.endsWith(".localhost"))throw new Error(name+" cannot target localhost");
    if(net.isIP(host)&&nonPublic(host))throw new Error(name+" cannot target a non-public IP address");
    const addresses=await dns.lookup(host,{all:true,verbatim:true});
    if(addresses.length===0||addresses.some(({address})=>nonPublic(address))){throw new Error(name+" must resolve only to public IP addresses");}
  }
})().catch((error)=>{console.error(error.message);process.exit(1);});
' "$value" "$name" "$allow_http"
}

require_origin "$web_origin" MEOW_PUBLIC_WEB_ORIGIN
require_origin "$api_origin" MEOW_PUBLIC_API_ORIGIN

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl_common=(--silent --show-error --connect-timeout 5 --max-time 15)
if [ "$allow_http" != "true" ]; then
  curl_common+=(--proto '=https' --tlsv1.2)
fi

stage() {
  printf 'B7 public smoke: %s\n' "$1"
}

stage "frontend TLS/runtime authority"
curl "${curl_common[@]}" --fail \
  -D "$tmp/web-health.headers" \
  "$web_origin/healthz" \
  -o "$tmp/web-health.body"
grep -Fq '"status":"ok"' "$tmp/web-health.body"

curl "${curl_common[@]}" --fail \
  -D "$tmp/web-spa.headers" \
  "$web_origin/files" \
  -o "$tmp/web-spa.html"
grep -Eqi '<!doctype html>|<html' "$tmp/web-spa.html"
grep -Eqi '^x-content-type-options:[[:space:]]*nosniff' "$tmp/web-spa.headers"

stage "API liveness and request correlation"
curl "${curl_common[@]}" --fail \
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
curl "${curl_common[@]}" --fail \
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
status="$(curl "${curl_common[@]}" \
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
status="$(curl "${curl_common[@]}" \
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

if [ -n "$evidence_path" ]; then
  mkdir -p "$(dirname "$evidence_path")"
  MEOW_OBSERVED_REQUEST_ID="$request_id" node -e '
const fs=require("node:fs");
const path=process.env.MEOW_PUBLIC_EVIDENCE_PATH;
const evidence={
  schemaVersion:"meow-external-qualification-v1",
  result:"success",
  observedAt:new Date().toISOString(),
  backendSha:process.env.MEOW_EVIDENCE_BACKEND_SHA||null,
  frontendSha:process.env.MEOW_EVIDENCE_FRONTEND_SHA||null,
  webOrigin:process.env.MEOW_PUBLIC_WEB_ORIGIN,
  apiOrigin:process.env.MEOW_PUBLIC_API_ORIGIN,
  apiVersion:process.env.MEOW_PUBLIC_API_VERSION,
  requestId:process.env.MEOW_OBSERVED_REQUEST_ID,
  github:{
    repository:process.env.GITHUB_REPOSITORY||null,
    runId:process.env.GITHUB_RUN_ID||null,
    runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
    workflowRef:process.env.GITHUB_WORKFLOW_REF||null
  }
};
fs.writeFileSync(path,JSON.stringify(evidence,null,2)+"\n",{encoding:"utf8",mode:0o600});
'
fi

printf 'B7 public smoke passed for web=%s api=%s\n' "$web_origin" "$api_origin"
