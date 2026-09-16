# B7 — operational observability, recovery rehearsal and release evidence

This B7 carrier builds on the production-foundation invariants merged in backend `main` at `8aaa6f9763b5bd9fdb7b664c7823fba8ca3b3bb3`. It remains provider-neutral: it proves operating and recovery contracts before final DNS/TLS, Mongo, blob-storage and SMTP providers are selected.

## Runtime observability contract

Every HTTP request receives a server-generated UUID in the `X-Request-Id` response header. The runtime emits structured JSON records with that same request ID.

Request-completion records intentionally contain only:

- timestamp;
- severity level;
- event name;
- request ID;
- HTTP method;
- status code;
- elapsed milliseconds.

They deliberately do **not** log URL/path, query string, IP address, forwarded headers, user agent, email, cookies, request body or response body. This keeps request correlation useful without turning logs into a second source of private customer data.

Unhandled 500 records contain only request ID and error class name. Error messages/stacks are not emitted through that request path because provider/library errors may contain connection or customer details.

Startup, shutdown and background worker failures also use newline-delimited JSON records with stable event names and coarse non-secret fields.

## Recovery set

The current filesystem private-blob adapter means a recoverable deployment has two durable authorities that must be backed up together:

1. the Mongo database;
2. the private blob volume.

`integration/recovery-rehearsal.sh` captures:

- a gzip-compressed `mongodump` archive of `meow_matrix`;
- a tar archive of `/var/lib/meow/private`;
- SHA-256 checksums for both backup files;
- a recovery manifest containing only test IDs, durable collection counts, blob SHA-256, backend/frontend SHAs and elapsed rehearsal timings.

The backup manifest does not contain passwords, cookies, Mongo URLs, SMTP credentials, private storage keys or customer data.

## Destructive restore rehearsal

The permanent `Meow modern recovery rehearsal` workflow does not restore into the existing database and call that success. It:

1. builds the exact backend and pinned frontend candidates;
2. starts the qualified B6/B7 topology;
3. runs the full transactional smoke to create valid auth/order/outbox state;
4. creates an additional private file through the authenticated API;
5. records durable collection counts and the private blob checksum;
6. captures Mongo + private-volume backups;
7. verifies backup file checksums;
8. destroys the Compose project **including its data volumes**;
9. recreates an empty Mongo replica set;
10. restores the Mongo archive;
11. restores the private blob archive into a fresh volume;
12. starts API + web against the restored authorities;
13. verifies collection counts, private blob SHA-256, authenticated download byte equality and restored order access through the restored session.

A green recovery gate therefore demonstrates that Mongo metadata and private blob bytes can be recovered together from a clean state.

## RPO / RTO interpretation

The rehearsal records `backupSeconds` and `restoreSeconds` for evidence and regression detection. These values are **CI measurements only** and are not a production SLA.

The current script proves point-in-time backup semantics. A production RPO depends on the final provider and schedule, for example provider continuous backup/PITR plus an object/filesystem backup policy. The production RTO similarly depends on dataset size, network throughput, provider restore mechanics and deployment topology.

Before B7 closes, the selected production providers must have explicit target RPO/RTO values and a provider-specific restore rehearsal sized appropriately for production data.

## Exact release-candidate evidence

`integration/release-evidence.sh` records the exact candidate identity before runtime smoke/recovery:

- backend Git SHA;
- pinned frontend Git SHA;
- SHA-256 of `integration/compose.b6.yml`;
- local content-addressed Docker image IDs for API, web, Mongo and Mailpit.

Both the full-stack and recovery gates execute this after image build and print the resulting JSON evidence. This prevents a later cutover process from treating an arbitrary rebuild of a branch as equivalent to the candidate that CI actually exercised.

The final production promotion mechanism still needs a registry/provider authority that can promote immutable image digests. Local CI image IDs are evidence, not a substitute for a production registry digest.

## Remaining B7 cutover work

This carrier intentionally does not invent infrastructure values that have not been selected. B7 still requires:

- canonical public frontend/API domains and DNS;
- TLS/HTTPS ingress implementation and public trusted-proxy smoke;
- production transaction-capable Mongo provider plus migration/preflight;
- provider-specific backup/PITR policy and recovery rehearsal;
- durable production private storage mapping, with object storage evaluated behind `PrivateBlobStorage`;
- production SMTP and delivery observability;
- secrets injection/rotation through the deployment platform;
- immutable registry/artifact promotion;
- external readiness/liveness monitoring and alerting;
- public browser/API smoke against canonical HTTPS origins;
- freeze/cutover/rollback runbook and post-cutover evidence;
- historical external credential rotation/revocation tracked separately in security issue #1.

A successful CI restore proves recoverability of the current architecture. It does not, by itself, declare the system production-ready.
