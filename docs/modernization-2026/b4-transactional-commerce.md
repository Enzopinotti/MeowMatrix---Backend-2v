# B4 — Transactional commerce authority

## Why B4 exists

The historical checkout route mutated inventory one product at a time, created a ticket afterwards, removed purchased cart lines later, and sent email outside any durable transaction boundary. A process failure or stock race could therefore leave stock, cart and ticket state disagreeing.

B4 replaces that behavior instead of preserving it behind new TypeScript types.

## Data authority and migration policy

B4 deliberately treats data by business lifetime:

- `users` remains the identity authority established by B3. Existing accounts must survive modernization.
- `products` and `categories` remain the catalog authority. They are durable business data and are mapped through the new Mongo catalog adapter.
- historical `carts` are **not** migrated. A cart is ephemeral mutable state; carrying stale historical quantities into the new authority would create more risk than value.
- `commerce_carts` is the only mutable cart authority for B4.
- historical `tickets` remain historical evidence. New purchases are persisted as `commerce_orders`.
- `commerce_outbox` is the durable side-effect boundary. B4 does not claim that email or any external notification has been delivered merely because an order committed.

No historical collection is deleted by B4.

## Current-user ownership

Cart and order routes derive identity exclusively from the B3 `meow_session` HttpOnly cookie. The browser never supplies a trusted `userId`, purchaser, or cart id.

A normal user can list/read only their own orders. Admin detail access remains an explicit service rule rather than an unvalidated request parameter.

## Cart contract

Each canonical cart line stores only:

- product id;
- integer quantity;
- line update timestamp.

Quantity is limited to 1–99 and a cart to at most 50 distinct products. Prices, product names, visibility, owner and stock are intentionally **not** copied into mutable cart lines.

`GET /api/v1/cart` joins current product state and returns a view with:

- current product DTO when still available;
- current server price and line total;
- `available`, `unavailable`, or `insufficient_stock` status;
- a server-calculated total;
- `checkoutReady`.

The cart total is display information returned by the backend. Checkout recalculates everything again inside the transaction.

## Optimistic cart concurrency

`commerce_carts.version` is incremented on every mutation. Cart writes filter by both cart id and observed version. A concurrent mutation retries from fresh state a bounded number of times and otherwise returns `409 CART_CONCURRENT_UPDATE`.

This avoids the historical read-modify-save lost-update pattern.

## Checkout contract

Checkout is `POST /api/v1/checkout`; there is no mutating GET equivalent.

Every request requires an `Idempotency-Key` of 8–128 allowed characters. Only a SHA-256 digest of that key is persisted.

Within one Mongo transaction B4:

1. reads the current authenticated user's canonical cart;
2. loads every referenced product from the authoritative `products` collection;
3. validates visibility/status, seller self-purchase, quantities and current stock;
4. computes immutable order line snapshots from current server product name/price;
5. inserts the confirmed order with unique `(purchaserId, idempotencyKeyHash)`;
6. conditionally decrements every product only when current stock is still sufficient;
7. clears the cart only if its version did not change;
8. inserts `order.confirmed` into `commerce_outbox`;
9. commits.

If any validation, stock decrement, order write, cart version check or outbox write fails, Mongo aborts the entire transaction. There is no supported partially-purchased result.

## Stock race semantics

Pre-validation alone is not treated as a lock. Each stock mutation also requires `stock >= requested quantity` in the transactional update filter.

If another transaction changes stock before this checkout can commit, the operation fails with `409 STOCK_CHANGED`; all writes from this checkout roll back.

## Mongo driver option boundary

The modern TypeScript configuration keeps `exactOptionalPropertyTypes` enabled. Optional Mongo driver options therefore omit `session` when there is no active session instead of passing `session: undefined` or weakening the compiler with broad casts. Transactional calls pass an actual `ClientSession`; non-transactional cart/catalog reads receive an option object without that property.

This is intentionally a strict adapter boundary: driver-version typing changes must fail CI rather than silently widening persistence types.

## Server-authoritative money

The browser does not submit trusted prices or totals. Order snapshots are built from the fresh product documents loaded by the backend.

The historical catalog stores numeric prices. B4 retains that data representation for compatibility and rounds calculated line/order totals to two decimal places at the commerce boundary. Migrating the persisted catalog to integer minor units or Decimal128 would require a separate verified data migration and is not silently performed here.

## Idempotency semantics

The order collection has a unique index on purchaser + idempotency-key digest.

- first successful checkout: `201`, `Idempotency-Replayed: false`;
- safe retry of the completed operation after its cart was cleared: original order, `200`, `Idempotency-Replayed: true`;
- reusing that key while another non-empty current cart exists: `409 IDEMPOTENCY_KEY_REUSED`;
- duplicate-key races resolve to the already committed order only when the post-checkout cart is empty.

The frontend must retain the same key during retries of one checkout attempt and discard it after success or material cart mutation.

## Transaction topology requirement

Mongo multi-document transactions require a replica set or sharded cluster. A standalone server is not silently treated as transaction-capable.

When Mongo reports that transactions are unsupported, B4 returns `503 TRANSACTIONS_UNAVAILABLE`. B6 must provide a local Compose topology that actually supports transactions before full-stack integration is considered complete.

## Outbox boundary

B4 writes an `order.confirmed` outbox row inside the same transaction as the order and stock updates. It does **not** send email or call payment providers from inside that transaction.

B5 can add a recoverable outbox worker/delivery policy. Until then, product copy and UI must say only that the order was confirmed, not that a receipt email was delivered.

## Payment boundary

There is no verified payment-provider integration in B4. A confirmed B4 order means the inventory/order transaction committed; it must not be described as a captured card payment.

Any future payment integration requires its own state machine, provider idempotency and compensation/reconciliation contract.

## Security continuity

B4 inherits B3's security boundaries:

- HttpOnly opaque session cookie;
- exact browser Origin guard on mutations;
- credentialed CORS allow-list;
- no browser-readable authentication token;
- sanitized current-user DTO;
- historical credential security issue remains tracked separately.

## Qualification required before merge

B4 is not complete until permanent CI qualifies:

- canonical fingerprint behavior;
- all-or-nothing snapshot validation;
- server-side price calculation;
- session and Origin enforcement;
- quantity and cart bounds;
- idempotency/replay semantics;
- stock-race rollback behavior;
- historical product/category mapping;
- owner-scoped order reads;
- OpenAPI B4 regressions;
- production dependency audit;
- format/lint/typecheck/tests/build;
- compiled health smoke;
- paired frontend client and commerce UX.
