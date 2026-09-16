# B5 — Private files, privacy and recoverable delivery

B5 replaces the historical upload and post-purchase side-effect paths with explicit maintained authorities. It builds on B4 main `15e52f07760555386b88a5460f5ac62443d327f5`.

## Historical risk being retired

The historical server used Multer disk storage under `src/public`. User identity, address and bank-statement documents were written below `src/public/documents`; product/profile images were also written below public source paths. The filter accepted all file types, filenames were derived from browser-supplied names and legacy JWT state, and the document route did not provide the maintained B3 session/authorization boundary.

B5 does not patch that historical implementation. The historical tree remains recoverable evidence; the maintained `modern/` authority gets a separate design.

## Private-file authority

The maintained API accepts only four purposes:

| Purpose | Allowed verified content | Maximum bytes |
| --- | --- | ---: |
| `avatar` | JPEG, PNG, WebP | 2 MiB |
| `premium-identification` | JPEG, PNG, PDF | 5 MiB |
| `premium-address` | JPEG, PNG, PDF | 5 MiB |
| `premium-bank-statement` | JPEG, PNG, PDF | 5 MiB |

The server validates all of the following before a blob becomes active:

1. configured purpose;
2. non-empty bounded body;
3. magic bytes/content signature;
4. purpose allow-list;
5. declared multipart MIME matches verified content;
6. display filename extension matches verified content.

SVG, HTML and arbitrary executable/document formats are not accepted by this contract.

Multer 2 is used only as a bounded multipart parser with memory storage. Multer does not choose the persistent path or filename.

## Storage boundary

`PrivateBlobStorage` is the replaceable blob port. B5 ships a local-filesystem implementation for the deployable baseline.

The filesystem provider:

- resolves one configured root outside the application webroot;
- creates that root and shard directories with mode `0700`;
- creates blobs with mode `0600` and exclusive `wx` semantics;
- accepts only a 64-character lowercase hexadecimal server-generated storage key;
- shards by the first two key characters;
- never incorporates owner id, purpose, extension or browser filename into a storage path.

`PRIVATE_STORAGE_ROOT` must therefore point to persistent private runtime storage. B6 will mount this as an explicit private volume in the full-stack Compose topology. Production may later replace this provider with object storage without changing the HTTP contract.

No maintained route exposes `storageKey`.

## Metadata and lifecycle

Mongo collection `private_files` keeps blob metadata separate from blob bytes:

- owner;
- purpose;
- safe display filename;
- verified media type;
- byte length;
- SHA-256;
- opaque storage key;
- lifecycle timestamps/status.

The lifecycle is:

```text
staging -> active -> deleting -> deleted
```

One `current` slot per `(owner, purpose)` is enforced by a unique partial index. Upload replacement is therefore explicit: delete the existing current file before activating another one.

The staging state is deliberate. A blob is never returned by metadata/download routes until storage write and metadata activation have both succeeded.

If upload cleanup cannot remove a possibly-written blob, the metadata remains in `staging` instead of erasing its recovery pointer. The cleanup worker later retries stale staging and deleting records. A failed physical delete likewise leaves the resource inaccessible in `deleting` until recovery finishes.

## Authorization and privacy

All maintained file routes require the B3 backend-owned HttpOnly session.

- normal users may list/read/download/delete only their own active files;
- cross-owner metadata/content access resolves as not-found where disclosure would reveal resource existence;
- admin may explicitly scope metadata/content to another owner;
- mutations also pass the exact-Origin guard inherited from B3.

The API is:

```text
GET    /api/v1/files
POST   /api/v1/files/purposes/:purpose
GET    /api/v1/files/:fileId
GET    /api/v1/files/:fileId/content
DELETE /api/v1/files/:fileId
```

Private downloads are served through the authenticated API with:

- `Cache-Control: private, no-store`;
- `X-Content-Type-Options: nosniff`;
- verified `Content-Type`;
- bounded `Content-Length`;
- attachment `Content-Disposition` with a sanitized display filename.

Before returning bytes, the service rechecks byte length and SHA-256 against metadata. Missing/corrupted backing storage produces a 503 integrity/unavailable response instead of returning unverifiable bytes.

## Historical product images

B5 intentionally does **not** reactivate the historical `productImage` upload endpoint. B4 can read durable historical product thumbnail references, but maintained product mutation/media management needs a separate admin/public-media contract. Reusing the old public-source upload mechanism would reintroduce the exact authority and path problems B5 is removing.

## Transactional outbox delivery

B4 writes `order.confirmed` to `commerce_outbox` inside the same Mongo transaction as the order/stock/cart mutation. B5 adds the consumer side.

A worker atomically claims one due event by setting:

- `leaseOwner`;
- `leaseExpiresAt`;
- incremented `attempts`.

Only unprocessed, non-terminal, due events with no live lease may be claimed. Expired leases are reclaimable after a crash.

Successful processing loads the persisted order and purchaser from Mongo and sends a factual order-confirmation email after the B4 transaction has committed. It does not claim external payment capture.

Failures use exponential backoff beginning at 30 seconds and capped at one hour. The configured final attempt is marked terminal/dead-letter. Persisted failure metadata stores only a tightly validated error class code, never SMTP response text, credentials, stack traces or message bodies.

If a worker loses its lease before persisting completion/failure, the repository fails closed rather than pretending the event state was saved.

## Delivery semantics: at-least-once

Mongo and SMTP cannot participate in one atomic distributed transaction. B5 therefore documents the truthful semantic: **at-least-once delivery**.

The order email uses a deterministic `Message-ID` derived from the immutable order id to improve downstream deduplication. There is still a small crash window after SMTP accepts a message but before Mongo records `processedAt`; a later worker may resend that event. B5 does not claim exactly-once email.

## Health and readiness

`GET /healthz` remains process liveness. It does not depend on Mongo, SMTP or storage.

`GET /readyz` is a separate no-store readiness surface and reports only coarse states for:

- database;
- private storage;
- outbox worker;
- private-file cleanup worker.

It does not return URLs, credentials, storage keys, stack traces or provider error messages. The instance is ready only when all required B5 runtime authorities are healthy.

## Runtime configuration

Maintained B5 adds:

```text
PRIVATE_STORAGE_ROOT
OUTBOX_POLL_MS
OUTBOX_LEASE_MS
OUTBOX_MAX_ATTEMPTS
FILE_CLEANUP_POLL_MS
FILE_STAGING_RECOVERY_MS
```

The existing Mongo/SMTP/session/reset configuration remains authoritative. `PRIVATE_STORAGE_ROOT` is optional at config parsing time so development/liveness can start truthfully without fake storage; `/readyz` stays unavailable and private-file routes return 503 until the storage runtime is actually configured.

## Qualification contract

B5 backend is not complete until permanent CI proves:

- production dependency audit;
- canonical formatting and lint;
- strict TypeScript;
- prior auth/catalog/commerce regressions;
- magic-byte/MIME/extension/size enforcement;
- traversal-safe filenames and opaque storage paths;
- exact-origin + authenticated mutation boundary;
- owner/admin scope and non-disclosing foreign access;
- private download security headers and integrity verification;
- recoverable staging/deletion lifecycle;
- outbox retry/backoff/dead-letter behavior;
- lease-loss failure semantics;
- liveness/readiness split;
- production build and compiled health smoke.

The frontend B5 lane must consume this API without persisting blobs/base64 or internal paths in browser storage.

## Pre-merge qualification evidence

The disposable formatter/qualification workflow completed successfully on 2026-09-16:

- run `35139935449`: success;
- production audit: 0 vulnerabilities;
- Prettier + ESLint: success;
- strict TypeScript: success;
- Vitest: 59/59 tests passed, including B3/B4 regressions and B5 private-file/outbox failure paths;
- production build: success;
- the temporary workflow removed itself after qualification.

This one-shot run is supporting evidence only. The merge authority remains the permanent repository quality workflow executed on the final PR head, followed by a post-merge `main` run.
