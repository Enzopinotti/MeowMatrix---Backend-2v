# B2 — API/domain contract (2026)

## Status

This block establishes the first authoritative HTTP contract under `/api/v1` without pretending that the historical Mongo persistence has already been migrated.

The modern process remains bootable and `/healthz` remains independent from Mongo, credentials, mail, uploads, or any external service. Catalog endpoints are mounted permanently, but the default catalog adapter returns an explicit `503 CATALOG_UNAVAILABLE` until a real persistence adapter is connected. Tests inject an in-memory service only to qualify HTTP behavior; no fake catalog ships in production authority.

## Historical model mapping

The contract was reconstructed from the real historical Mongoose models and behavior rather than from a greenfield ecommerce template.

| Historical concept | 2026 contract decision |
| --- | --- |
| Product | Preserve name, description, price, code, stock, category relation, thumbnails, status, visibility, tags and timestamps. Do not expose the historical owner email as public catalog data. |
| Category | Preserve name, description, visibility and creation timestamp with normalized API field names. |
| Cart | Preserve user ownership and product/quantity lines. Use IDs at the transport boundary instead of populated Mongoose documents. |
| User | Public/account DTO is explicitly sanitized. Passwords, reset tokens, reset expirations and private document references are not response fields. |
| Ticket | Preserve the historical purchase code/time/amount/purchaser concept as a legacy-compatible receipt contract. |
| Order | New forward contract. It captures immutable product/price/quantity snapshots and lifecycle status, but persistence and checkout correctness are intentionally deferred to B4. |

## HTTP authority

Current endpoints:

- `GET /healthz`
- `GET /api/v1/`
- `GET /api/v1/openapi.json`
- `GET /api/v1/products`
- `GET /api/v1/products/:productId`
- `GET /api/v1/categories`
- `GET /api/v1/categories/:categoryId`

Cart, current-user, ticket and order schemas are published now so frontend/backend can share a stable language, but their authenticated/mutating routes are not claimed as implemented in B2.

## Runtime validation

B2 deliberately adds no schema-library dependency. The repository already has a deterministic B1 lockfile, so the first contract layer uses small explicit TypeScript decoders/validators that are covered by tests. A future schema library is allowed only if it materially improves maintainability rather than merely increasing dependency count.

Validation failures use HTTP `400` with:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "limit", "message": "..." }]
  }
}
```

## Error semantics

The v1 envelope is stable:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Human-readable message"
  }
}
```

Semantics fixed in B2:

- `400` — malformed/invalid request input;
- `404` — route or requested resource not found;
- `409` — request conflicts with current resource state;
- `500` — unexpected server fault with no internal details leaked;
- `503` — required runtime adapter/service is intentionally unavailable.

## OpenAPI

`GET /api/v1/openapi.json` is generated from the source-controlled `openApiDocument`. It declares Product, Category, Cart, User, Ticket, Order and error schemas, including 400/404/409/503 response semantics.

The user schema intentionally contains no password or reset-token properties.

## Cutover rule

`/api/v1` is the only new API namespace. Historical unversioned routes remain historical evidence and are not silently repointed. New frontend code must target `/api/v1`; old endpoints may be removed from current authority only in a later controlled cutover after replacement coverage exists.

Breaking changes require a new version boundary or an explicitly documented compatible migration. B2 does not alias old route names into v1 because that would preserve accidental historical response shapes.

## B4 boundary discovered during audit

The historical purchase flow executes a mutation through `GET /:cid/purchase`, decrements stock item-by-item, then creates a ticket and sends mail. That sequence can partially succeed before a later operation fails.

B2 does **not** reproduce this behavior. B4 must introduce a server-authoritative order/checkout command, idempotency/duplicate-submit protection, stock/price validation, recoverable failure semantics and a persistence boundary capable of preventing partially committed purchases.

## Security/privacy continuity

This block does not close the separate historical-secret issue. It also does not move uploads yet; that remains B5. B2 only guarantees that modern API DTOs do not expose credential/reset/private-document fields and that backend failures do not leak internal exception messages.
