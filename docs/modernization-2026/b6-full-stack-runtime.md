# B6 — full-stack runtime, persistence and deployment contract

B6 turns the maintained Meow Matrix frontend/backend into a reproducible container topology and proves the runtime invariants introduced in B3–B5 against real services.

## Authorities

The maintained application authorities are:

- backend runtime: `modern/`
- backend image: `modern/Dockerfile`
- full-stack topology: `integration/compose.b6.yml`
- frontend source pin: `integration/frontend-ref.txt`
- frontend preparation: `integration/prepare-frontend.sh`
- replica-set bootstrap: `integration/mongo-init.js`
- system smoke: `integration/full-stack-smoke.sh`
- permanent CI gate: `.github/workflows/modern-full-stack.yml`

The repository-root historical Docker/runtime files are legacy evidence and are not the B6 deployment authority.

## Pinned frontend

The backend integration topology does not build an arbitrary frontend branch. `integration/frontend-ref.txt` pins the exact qualified frontend commit:

`9d64c48d2324703cb594acad8e1bb0c9a3d6191c`

`prepare-frontend.sh` fetches that exact SHA, checks out detached HEAD, verifies the resolved SHA and requires the maintained `modern/Dockerfile` to exist before Compose may build the web image.

## Backend image

`modern/Dockerfile` is a Node 24 multi-stage image:

1. deterministic build with `npm ci --ignore-scripts`;
2. compiled TypeScript from `tsconfig.build.json`;
3. separate production-only dependency stage;
4. runtime contains compiled `dist`, production dependencies and package metadata only;
5. runtime process is the non-root Node user;
6. API listens on unprivileged port 8080;
7. private blobs live under `/var/lib/meow/private`, outside application source and web content.

The Compose runtime additionally applies a read-only root filesystem, drops all Linux capabilities, sets `no-new-privileges` and grants only a dedicated persistent volume for private blobs plus a constrained `/tmp` tmpfs.

## MongoDB transaction topology

B4 checkout uses MongoDB multi-document transactions. B6 therefore runs MongoDB as a real single-node replica set (`rs0`) rather than a standalone server.

`mongo-init.js` is idempotent:

- initializes `rs0` only when required;
- tolerates a previously initialized replica set;
- waits until the node reports `isWritablePrimary=true` before completing.

The API is not started until replica-set initialization succeeds. This makes the transactional checkout requirement an executable deployment contract rather than a documentation-only assumption.

The B6 CI/dev image is pinned to `mongo:8.0.32-noble`. Production may use a managed MongoDB replica set/cluster instead, but it must support transactions and the application connection string must target that topology.

## Private persistent storage

B5 metadata is stored in MongoDB while file bytes are stored behind `PrivateBlobStorage`. In the B6 topology the filesystem implementation is mounted at `/var/lib/meow/private` using the dedicated `private-files` volume.

Invariants:

- blobs are not stored under the frontend webroot;
- blobs are not exposed as static URLs;
- browser clients only receive authenticated API downloads;
- container restarts do not remove active blobs;
- source checkout and container root filesystem remain immutable.

A production deployment may replace this filesystem volume with an object-storage implementation later, but must preserve the same private-file service boundary and authorization rules.

## SMTP and outbox

CI/development uses `axllent/mailpit:v1.31.1` as an isolated SMTP sink. It exists to prove delivery from the persistent order-confirmation outbox and password-reset notifier without sending external email.

Mailpit is **not** the production mail service. Production must supply an authenticated/reliable SMTP provider through the existing `SMTP_*` configuration.

Order confirmation remains post-commit work. Checkout stores the order and outbox event transactionally; the outbox worker performs SMTP delivery after commit and can retry independently.

## Readiness

`GET /healthz` is process liveness.

`GET /readyz` is dependency readiness and requires all configured maintained runtime components to be healthy:

- MongoDB ping;
- private storage probe;
- outbox worker;
- private-file cleanup worker.

Compose uses `/readyz` for the API healthcheck, so the frontend does not start merely because the Node process is listening.

## Full-stack smoke contract

`integration/full-stack-smoke.sh` proves the runtime end to end:

1. API readiness, frontend health and Mailpit API;
2. API and frontend processes execute as non-root;
3. Mongo node is writable primary;
4. seed one historical-compatible product with stock 5;
5. register and log in using the real cookie-session API;
6. add quantity 2 to the server-authoritative cart;
7. checkout with an idempotency key;
8. assert stock transitions 5 → 3;
9. replay the same key and assert the same order plus stock still 3;
10. assert exactly one matching order;
11. wait until the order-confirmation outbox reaches Mailpit;
12. upload a verified private PNG through the authenticated multipart API;
13. download it and compare exact bytes;
14. restart the API and re-download the same blob;
15. restart MongoDB and verify the order is still readable;
16. delete the private file and assert subsequent download returns 404;
17. assert final product stock remains 3.

The workflow always captures Compose status/logs and tears down containers and volumes, including on failure.

## CI qualification

Two permanent workflows cross-qualify the maintained runtime:

- `Meow modern backend quality`: locked install, production dependency audit, formatting, lint, TypeScript, tests, build and compiled liveness smoke.
- `Meow modern full-stack runtime`: pinned frontend preparation, Compose validation, image builds, hardened runtime startup, transactional/persistence smoke and teardown.

Both watch the maintained code, integration topology and each other's workflow files so changing a gate cannot silently evade the other gate.

## Production requirements carried forward

B6 does not provision production infrastructure or secrets. A real deployment still requires:

- TLS termination and an HTTPS frontend origin;
- `SESSION_COOKIE_SECURE=true` in production;
- a transaction-capable MongoDB replica set/cluster with backup/restore policy;
- durable private blob storage with backup/lifecycle controls;
- a real SMTP provider and operational alerting for outbox failures;
- trusted reverse-proxy/IP configuration before relying on in-process IP rate limiting across replicas;
- external secret management and rotation of the historical credentials tracked by security issue #1;
- observability, retention and deployment rollback procedures.

Those deployment/operations concerns are the next production-hardening layer; they do not weaken the B6 local/CI runtime contract.
