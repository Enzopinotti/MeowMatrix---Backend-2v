# B7 — production foundation: ingress trust, shared throttling and fail-closed config

B7 moves Meow Matrix from the reproducible B6 CI/dev topology to an operable production contract. This first B7 carrier is intentionally provider-neutral: it hardens invariants that must hold regardless of the eventual DNS, TLS ingress, Mongo provider, SMTP provider or private-storage backend.

## Scope of this carrier

This carrier closes four production-foundation gaps:

1. production configuration fails closed instead of silently falling back to development-safe defaults;
2. reverse-proxy trust is explicit and bounded;
3. authentication throttling is shared across API replicas when Mongo persistence is configured;
4. CI executes a secret-safe production configuration preflight and the B6 full-stack smoke proves the shared limiter against real MongoDB.

It does **not** choose or provision the final production provider/domain. Those choices remain part of the later B7 cutover carriers.

## Production fail-closed contract

`NODE_ENV=production` now requires all of the following before the API may start:

- `SESSION_COOKIE_SECURE=true`;
- at least one `FRONTEND_ORIGINS` entry;
- every production frontend origin uses HTTPS;
- `TRUST_PROXY_HOPS` is an explicit integer from 1 to 10;
- `MONGO_URL` is configured;
- `RATE_LIMIT_HMAC_SECRET` is configured with at least 32 UTF-8 bytes whenever Mongo-backed auth throttling is active;
- `PRIVATE_STORAGE_ROOT` is configured for the currently implemented private filesystem adapter;
- the existing Mongo auth mail boundary remains complete: `SMTP_HOST`, `SMTP_FROM` and `PASSWORD_RESET_URL`;
- `PASSWORD_RESET_URL` itself is HTTPS and its origin is one of the exact production frontend origins.

Development/test retain safe local defaults. Production must be explicit.

## Reverse-proxy / client-IP contract

Express `trust proxy` is disabled by default. It is enabled only when `TRUST_PROXY_HOPS > 0` and uses the configured hop count.

This matters because auth throttling keys use `request.ip`. Without an explicit trusted-ingress contract, accepting arbitrary `X-Forwarded-For` would let callers choose their own rate-limit key.

### Deployment requirement

A numeric hop count is safe only when the network topology enforces that requests reach the API through the expected ingress path. A production platform must therefore:

- block or otherwise prevent untrusted direct access to the API container/service port;
- document how many trusted reverse-proxy/load-balancer hops exist between the public client and Node;
- configure `TRUST_PROXY_HOPS` to that exact topology;
- re-run the public client-IP/rate-limit smoke whenever the ingress chain changes.

Do not increase `TRUST_PROXY_HOPS` merely to make forwarded headers appear to work.

## Shared auth throttling

The B3 limiter was intentionally bounded but process-local. That is insufficient once multiple API replicas receive traffic.

B7 introduces `RateLimitStore` as the persistence boundary. The auth routes retain the same policies and public response contract but can now delegate counters to a shared store.

When Mongo is configured, server startup creates `MongoRateLimitStore` and the auth scopes are:

- `auth:login`;
- `auth:register`;
- `auth:password-reset`.

When Mongo is absent in test/local fallback mode, the previous bounded in-memory limiter remains available.

### Privacy

The Mongo store never persists the raw client IP. It derives `keyHash` with HMAC-SHA-256 using `RATE_LIMIT_HMAC_SECRET`, authenticating both the limiter scope and client key. Including the scope means the same IP does not receive the same digest across login/register/reset buckets, while the keyed digest prevents an observer with read access to `auth_rate_limits` from validating guessed IPv4 addresses without the secret.

`RATE_LIMIT_HMAC_SECRET` is an operational secret: inject it through the deployment secret manager, never source-control or log it, and rotate it independently from session/password-reset secrets. Rotation intentionally starts fresh throttle buckets; it does not invalidate sessions or mutate business data.

The collection is `auth_rate_limits`.

### Atomicity and expiry

Each request increments one bucket through `findOneAndUpdate` with an update pipeline. The window reset and count change happen in one database operation. A TTL index named `auth_rate_limits_expiry` expires documents by `resetAt`.

Store failures fail the request path; the middleware does not silently fall back to a per-process counter, because doing so would weaken the distributed production policy exactly when the shared dependency is unavailable. Mongo health remains part of `/readyz`.

## Production preflight

After `npm run build`, operators/CI can run:

```text
npm run preflight:production
```

The command calls the same `loadConfig()` used by the server, requires `NODE_ENV=production`, and prints only non-sensitive topology signals:

- frontend origins;
- trusted proxy hop count;
- cookie security flags;
- whether the shared rate-limit HMAC secret is configured;
- whether Mongo/private storage/SMTP/reset configuration is present.

It never prints the HMAC secret, Mongo connection string, SMTP password or any secret value.

The permanent backend quality workflow runs this preflight with synthetic safe values after the full maintained quality contract.

## CI evidence added by this carrier

Unit/integration tests cover:

- production fail-closed requirements;
- HTTPS frontend/reset boundaries;
- exact reset-origin allow-listing;
- explicit trusted proxy hop requirement;
- minimum HMAC-secret requirement for Mongo-backed throttling;
- shared-store rate-limit delegation and stable 429 contract;
- store failure fails closed;
- `X-Forwarded-For` affects the client key only when proxy trust is explicitly enabled.

The permanent B6 full-stack smoke is extended to prove the real Mongo adapter after register/login:

- `auth:register` and `auth:login` shared buckets exist;
- persisted `keyHash` values are 64-character lowercase HMAC-SHA-256 digests;
- no raw `key` field is persisted;
- the TTL index exists with `expireAfterSeconds: 0`.

This keeps B6 behavior regression coverage while adding B7 production-foundation evidence.

## Still open in B7

This carrier does not close B7. Remaining provider/cutover work includes:

- canonical production frontend/API domains and DNS;
- TLS termination and HTTPS ingress implementation;
- production Mongo provider/topology, migration preflight and backup/restore rehearsal;
- final private storage strategy; object storage may replace the current filesystem adapter behind the existing `PrivateBlobStorage` boundary;
- production SMTP provider and delivery observability;
- structured request correlation/logging without PII or secrets;
- exact image/artifact promotion rather than branch rebuilds;
- public browser/API smoke against the canonical origin;
- controlled cutover, rollback and post-cutover evidence;
- external rotation/revocation work tracked separately in security issue #1.

## Operational rule

A preview being reachable is not production readiness. B7 closes only when the exact promoted artifacts, ingress, data/storage dependencies, observability, backup/restore, public smoke and rollback path are all evidenced against the canonical production authority.
