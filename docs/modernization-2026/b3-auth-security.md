# B3 — Auth/session/authorization security model

## Decision

The 2026 authority does **not** port the historical Passport + JWT + express-session stack. The historical backend mixed local Passport, GitHub OAuth, Mongo-backed express sessions and a separate JWT cookie. Logout deleted the browser JWT but could not revoke it server-side, and password reset stored the full reset token on the user document.

B3 standardizes one model:

- local email/password identity contract;
- opaque server-owned session identifier;
- raw session identifier only in an HttpOnly cookie;
- only SHA-256 session-token digests cross the persistence boundary;
- password hashes use a versioned Node `scrypt` format;
- one-time password-reset tokens are stored only by SHA-256 digest;
- a successful password reset revokes every existing session for the user;
- response DTOs never contain password hashes, reset tokens or private document references.

GitHub OAuth is historical evidence, not part of B3. It can return later only if there is a real product requirement and a complete account-linking policy.

## HTTP contract

Authority lives under `/api/v1/auth`:

- `POST /register`
- `POST /login`
- `GET /me`
- `POST /logout`
- `POST /password-reset/request`
- `POST /password-reset/confirm`

Login returns the sanitized user + expiry metadata. The raw session token is **not** returned in JSON; it is sent only through `Set-Cookie`.

Logout is a mutating `POST`, not the historical `GET`. It revokes the server-side session digest and expires the cookie.

## Password policy and hashing

B3 uses Node 24's built-in `crypto.scrypt` with a source-controlled, versioned encoded format:

- N = 16384
- r = 8
- p = 1
- random salt = 16 bytes
- derived key = 64 bytes
- accepted password length = 12–128 characters

The password policy intentionally prioritizes length rather than requiring arbitrary uppercase/lowercase/number combinations. A new hash format/version is required before changing cost parameters incompatibly.

Historical bcrypt hashes are **not silently interpreted as scrypt**. The future real persistence adapter must include an explicit legacy-login migration policy (for example: verify legacy bcrypt once and rehash to scrypt after successful authentication) if old accounts are carried forward. Until that adapter exists, modern auth fails truthfully with `503 AUTH_UNAVAILABLE` rather than shipping a fake memory database.

## Session policy

Default development policy:

- cookie name: `meow_session`
- HttpOnly
- SameSite=Lax
- 8-hour absolute TTL
- Path=/
- Secure=false only outside production by default

Production defaults Secure=true. `SameSite=None` is rejected at configuration load time unless Secure=true.

`FRONTEND_ORIGINS` is an exact allow-list; wildcard credentialed CORS is not supported. Browser mutation endpoints apply an Origin guard. Requests without an Origin header remain possible for trusted non-browser clients/tests, so Origin checking is documented as a browser CSRF boundary rather than as API authentication.

Final deployment topology in B7 decides whether frontend/API can remain same-site with `Lax` or need a controlled cross-site `None; Secure` cookie.

## CSRF model

B3 combines:

1. HttpOnly cookie ownership on the backend;
2. SameSite=Lax by default;
3. JSON-only mutation payloads;
4. exact Origin checking on browser mutations;
5. no wildcard credentialed CORS.

If a future deployment changes the cookie/topology assumptions, B7 must re-run the threat model. A synchronizer/double-submit CSRF token is not added pre-emptively while exact Origin + SameSite satisfies the current contract.

## Reset contract

`POST /password-reset/request` returns the same `202 {data:{accepted:true}}` response for known and unknown valid email addresses. This removes the historical response-level account enumeration behavior.

For an existing account the service generates 32 random bytes, sends the raw token only to the notifier boundary, and stores only its SHA-256 digest with a default 30-minute expiry. Replacing a reset token invalidates the previous token for that user. Confirmation consumes the token atomically at the store boundary before changing the password, and successful confirmation revokes every active session.

The production notifier remains a separate adapter; B3 does not pretend email delivery exists before that adapter is configured.

## Authorization

Registration cannot choose a role. `user` is the default repository responsibility. Reusable policies define:

- explicit role allow-lists (`requireRole`);
- owner-or-admin resource access (`requireOwnerOrAdmin`).

Future cart/order/profile/admin endpoints must use these policies rather than trusting IDs or roles from request bodies.

## Abuse boundaries

B3 introduces bounded in-process limits:

- login: 10 attempts / 15 minutes / source IP;
- registration: 5 attempts / hour / source IP;
- password reset: 5 attempts / hour / source IP.

These are a safe single-process baseline, **not** a horizontally distributed rate-limit claim. Before multi-replica production, B7 must move the counter to a shared/edge enforcement layer and set trusted-proxy behavior deliberately.

## Deliberate persistence boundary

The domain exposes explicit repositories/stores for users, opaque sessions and one-time reset tokens, plus a reset notifier port. No in-memory implementation is wired into production authority. Tests inject memory adapters only to qualify the contract.

This means the default current runtime answers auth operations with `503 AUTH_UNAVAILABLE`. That is intentional until a real Mongo/Mongoose adapter and notifier are connected and migration semantics for historical bcrypt users are proven.

## Security blocker continuity

B3 does not close the historical credential issue. Repository hygiene and new auth design cannot rotate or revoke secrets that may have existed outside the repository.
