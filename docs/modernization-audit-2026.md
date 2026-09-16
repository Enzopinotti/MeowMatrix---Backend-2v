# Meow Matrix full-stack modernization audit — 2026

## Scope

Meow Matrix must be treated as one product lineage across:

- `Enzopinotti/Meow-Matrix---Frontend`;
- `Enzopinotti/MeowMatrix---Backend-2v`;
- historical ancestor/sibling `Enzopinotti/Proyecto_Backend`.

The goal is not to turn the project into a copy of TOP. The goal is to preserve the educational/product history and rebuild a credible full-stack ecommerce system with explicit API, authentication, data, runtime and delivery contracts.

## Historical authorities

Frontend baseline:

```text
452ca67fe3fe494ad7caa731c944d352973276d9
```

Backend baseline:

```text
9cd1b87e69b6455487c64d7fdbe6ef0c90b73f88
```

Shared backend genealogy evidence:

```text
a2cdc1c556538766dda3cf8dbb252cf81bccf491  Primer Commit
6b218d1bc07289a21bd0c32a501ebeb18847440b  Delete .env
```

`Proyecto_Backend` later continued on a separate branch of the same genealogy to:

```text
0cbfbfe4989a58787c80b9b1cfca7a309f0ff70e
```

This means `Proyecto_Backend` and Meow Backend should not receive independent speculative rewrites. Their shared history must be understood once, then one maintained backend authority should be chosen.

## Current product surface

### Frontend

The 2024 React/CRA frontend already models a substantial ecommerce workflow:

- catalogue and product detail;
- authentication, registration and password recovery;
- cart state;
- ticket/purchase result;
- user profile;
- likes/favourites;
- administrative product/category screens;
- multipart/profile/document interactions;
- cross-origin API calls to the backend.

React remains justified because the product has routing, shared auth/cart state, async server state and role-dependent surfaces.

### Backend

The backend is a real application rather than a toy API. It contains:

- Express routing/controllers/services/DAOs;
- Mongo/Mongoose persistence plus filesystem abstractions;
- products, categories, carts, users and tickets;
- Passport local/GitHub/JWT strategies;
- session storage through Mongo;
- password recovery email;
- Twilio/SMS integration;
- file uploads for avatars/products/documents;
- Swagger/OpenAPI fragments;
- Handlebars historical views and static assets;
- Mocha/Chai/Supertest-era tests;
- Docker and Kubernetes learning artifacts.

The modern backend therefore needs explicit domain/API boundaries, but it does not need microservices, event buses or Kubernetes solely for portfolio appearance.

## Security findings

Security issue #1 is a prerequisite lane. Material findings include:

- historical secret-bearing `.env` committed in the shared backend genealogy;
- current historical-backend source with hardcoded cookie signing material;
- password-sensitive console logging in authentication flows;
- fragmented JWT/session/cookie ownership;
- frontend JavaScript historically writing authentication-token state into `document.cookie`;
- incomplete cookie/CORS environment separation;
- source-controlled runtime logs;
- runtime/user-document files stored under source-controlled public paths.

No secret values belong in this document. External credential rotation/revocation cannot be replaced by code changes.

## Repository hygiene findings

The backend current tree contains artifacts that should not remain part of maintained source authority:

- a tracked `kubectl.exe` binary of roughly 45 MB plus checksum;
- runtime log files;
- runtime-ish JSON/user data fixtures that need classification;
- uploaded document/avatar/product artifacts mixed with static source assets;
- empty/generated leftovers;
- duplicated large media.

Historical recovery remains Git's job. Current authority should not keep vendor binaries or mutable user/runtime data just because they existed in 2024.

## Architecture direction — pending qualification

### Frontend

Likely maintained direction:

- React retained;
- CRA replaced only after frozen baseline qualification;
- Vite + TypeScript if compatibility evidence remains clean;
- explicit API client boundary rather than scattered hardcoded URLs;
- typed DTO/domain schemas;
- server-owned HttpOnly authentication cookie/session;
- deterministic cart/order state;
- explicit admin authorization surfaces;
- accessible loading/error/form/focus contracts;
- modern Sass/CSS only where it improves maintainability.

### Backend

Likely maintained direction:

- Express retained unless baseline evidence reveals a concrete reason to replace it;
- TypeScript for maintained API/domain contracts;
- validated environment/configuration;
- one authentication/session model;
- Mongoose/Mongo behind repository/service boundaries;
- DTO/schema validation at HTTP boundaries;
- authorization separated from authentication;
- uploads treated as runtime storage, never source assets;
- structured logging with sensitive-value redaction;
- OpenAPI generated/validated from maintained contracts where practical;
- deterministic integration tests;
- hardened Docker runtime;
- no Kubernetes unless a real deployment requirement exists.

## Required modernization phases

### Phase 0 — security + exact baseline

- complete repository-side security hotfix;
- verify/rotate external credentials through issue #1;
- freeze exact frontend/backend historical baselines;
- qualify historical install/build/test behavior under documented Node versions;
- classify public endpoints/deployments;
- record dependency/runtime failures without mutating baselines.

### Phase 1 — authority + reproducible foundation

- choose one maintained backend authority;
- preserve historical frontend/backend truth and rollback;
- Node/package-manager contracts;
- TypeScript/tooling foundation where justified;
- immutable-SHA read-only CI;
- remove current-authority vendor/runtime artifacts;
- deterministic development environment.

### Phase 2 — API/domain contract

- products/categories/cart/users/tickets schemas;
- consistent response/error envelope;
- API client generated or typed from one contract where practical;
- remove scattered endpoint literals;
- loading/error/not-found semantics;
- explicit versioning/cutover strategy.

### Phase 3 — auth/session/authorization

- backend-owned HttpOnly cookie/session lifecycle;
- login/logout/current-user contract;
- registration sanitization;
- dedicated reset-token lifecycle;
- role/ownership checks for admin and user resources;
- CSRF/CORS/cookie policy appropriate to the final deployment topology;
- no credentials/tokens in browser-readable storage.

### Phase 4 — ecommerce correctness

- canonical cart lines and derived totals;
- server-side price/product validation for checkout/order creation;
- transactional or explicitly bounded stock semantics;
- idempotent/duplicate-submit protection;
- ticket/order success only after persistence succeeds;
- recoverable failures;
- no unsupported payment/email/stock claims.

### Phase 5 — uploads/privacy

- file-type/size validation;
- safe filenames/object keys;
- authorization for personal documents;
- runtime storage outside source tree;
- lifecycle/deletion policy;
- no public serving of identity/bank/address documents by default;
- testable privacy boundary.

### Phase 6 — UX/admin/media

- responsive/accessibility qualification;
- catalogue/detail/cart/checkout/profile/admin flows;
- media deduplication and delivery budgets;
- historical assets preserved without shipping everything to production.

### Phase 7 — Docker/deployment/production qualification

- non-root minimal images;
- health/readiness contract;
- no secrets in image layers or build context;
- Compose for local full-stack integration where useful;
- production origin/CORS/cookie qualification;
- browser/API smoke;
- rollback and migration documentation.

## Deliberate non-goals

Unless a real requirement appears, do not add:

- microservices;
- Kafka/RabbitMQ;
- Kubernetes as the default runtime;
- GraphQL;
- Redis only for appearance;
- multi-tenancy;
- complex RBAC beyond product roles actually needed;
- AI features;
- payment gateway claims without a real integration contract.

## Definition of Done

The Meow Matrix lane is complete only when:

- historical frontend/backend baselines remain recoverable;
- secret exposure has a documented external remediation status;
- one maintained backend authority is explicit;
- frontend/backend install/build/test contracts are reproducible;
- API/auth/cart/order/upload boundaries are typed and tested;
- browser-readable auth tokens are eliminated;
- server-side order integrity does not trust browser prices/totals;
- mutable uploads/runtime data are outside source authority;
- CI, Docker and deployment are qualified;
- public claims match implemented behavior;
- central profile/roadmap synchronization is completed.
