# Meow Matrix backend — security remediation 2026

## Purpose

This document records the repository-side security remediation that precedes the 2026 full-stack modernization. It deliberately documents **categories and contracts, never historical secret values**.

Security tracking issue: [#1 — SECURITY BLOCKER](../issues/1).

## Historical authority

The exact pre-remediation Meow backend baseline is:

```text
9cd1b87e69b6455487c64d7fdbe6ef0c90b73f88
```

That commit remains the historical 2024 authority and rollback reference. The security hotfix does not rewrite it.

The backend also shares Git ancestry with `Enzopinotti/Proyecto_Backend`. Confirmed shared commits include:

```text
a2cdc1c556538766dda3cf8dbb252cf81bccf491  Primer Commit
6b218d1bc07289a21bd0c32a501ebeb18847440b  Delete .env
```

This proves that the two repositories are branches of one historical backend lineage rather than independent products.

## Findings that triggered the hotfix

The audit found both historical and current-source exposure risks:

- a historical `.env` existed before the shared `Delete .env` commit;
- current 2024 source contained cookie-signing material hardcoded in application code;
- authentication/password-reset code logged password-related values;
- session defaults did not explicitly define the cross-site production cookie contract;
- the frontend/backend CORS origin was embedded directly in server code;
- `.dockerignore` did not exclude environment files or runtime-generated documents/logs;
- runtime log files were tracked in Git;
- the frontend historically wrote authentication-token state through `document.cookie`, which conflicts with server-owned `HttpOnly` session/token semantics and must be removed in the paired frontend modernization.

No historical or current secret value should be copied into documentation, issues, pull requests or logs.

## Repository-side hotfix contract

The security hotfix establishes the following minimum baseline before structural modernization:

- no cookie-signing secret literal in maintained source;
- environment/configuration names documented through a safe `.env.example`;
- `.env*` excluded from Git and Docker build context except the value-free example;
- CORS origin comes from configuration;
- `express-session` uses `resave: false`, `saveUninitialized: false`, explicit cookie attributes and aligned TTL;
- production cookies use `Secure` + `SameSite=None` behind a trusted proxy while local development uses `SameSite=Lax`;
- access-token cookies remain server-owned and `HttpOnly`;
- user payloads returned/signed by current auth handlers exclude password and password-reset fields;
- password/reset flows do not log password material;
- tracked runtime log output is removed from current authority;
- runtime document uploads are excluded from Docker build context;
- a read-only GitHub Actions gate validates these contracts without printing discovered secret values.

## What this hotfix does not claim to solve

Repository changes cannot revoke credentials that may already have been exposed. External rotation/revocation remains required for every affected credential family that is still valid, including database, OAuth, JWT/token, cookie/session, mail or SMS credentials as applicable.

This hotfix also does **not** rewrite Git history. A history rewrite changes commit SHAs and affects clones/forks/links, so it must be decided only after credential rotation and after the maintained backend authority is settled. Issue #1 remains open until that decision and external remediation are complete.

## Next security architecture work

The full modernization must still replace the fragmented historical auth model with one explicit frontend/backend contract. In particular:

1. backend owns authentication cookies/tokens;
2. frontend never reads or writes authentication tokens through `document.cookie`;
3. authenticated user endpoints return only public/session-safe DTOs;
4. password reset uses a dedicated, short-lived, single-purpose token lifecycle;
5. upload paths and user documents are runtime data, not source-controlled application assets;
6. production CORS/cookie configuration is environment-specific and tested;
7. authorization for admin/product/user/document operations is covered by integration tests;
8. secret scanning and dependency/runtime checks become part of permanent CI.

## Rollback

The historical baseline remains addressable at `9cd1b87e69b6455487c64d7fdbe6ef0c90b73f88`. Rolling back code does **not** roll back or restore rotated credentials; once a credential is revoked, historical values must remain revoked.
