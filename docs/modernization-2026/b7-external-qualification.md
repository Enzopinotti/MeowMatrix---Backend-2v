# B7 external release qualification

This carrier adds a manual, provider-neutral **external qualification gate** for an already deployed Meow Matrix release candidate. It does not deploy, publish images, mutate production data, switch DNS or create provider resources.

The gate exists so public-runtime verification is not improvised during cutover after DNS/TLS become real.

## Workflow

The maintained authority is `.github/workflows/modern-external-qualification.yml` (`Meow external release qualification`). Its real qualification path is manual `workflow_dispatch` only.

Required inputs:

- `backend_sha`: exact 40-character backend commit SHA;
- `frontend_sha`: exact 40-character frontend commit SHA;
- `web_origin`: real public HTTPS frontend origin;
- `api_origin`: real public HTTPS API origin;
- `api_version`: exact API contract version expected from `/healthz`.

The workflow refuses to use an arbitrary feature branch as a release candidate:

1. it checks out exactly `backend_sha`;
2. it requires that SHA to be an ancestor of backend `main`;
3. it requires `frontend_sha` to equal the candidate backend's `integration/frontend-ref.txt`;
4. it verifies that frontend SHA exists and is an ancestor of frontend `main`.

That makes the external smoke evidence attributable to merged repository authorities rather than to ad-hoc source.

The candidate must also implement the current `meow-external-qualification-v1` evidence contract. A historical merged SHA whose `public-smoke.sh` predates evidence output is rejected even if its runtime checks happen to pass; a qualification without retained evidence cannot be used as release authority.

## Public-network boundary

`integration/public-smoke.sh` defaults to external mode. In that mode:

- only exact `https://` origins are accepted;
- URL credentials, path/query/fragment additions and non-default HTTPS ports are rejected;
- localhost and literal non-public addresses are rejected;
- DNS resolution must return only public addresses;
- curl is constrained to HTTPS, TLS 1.2 or newer, a five-second connect timeout and a 15-second request timeout.

`MEOW_PUBLIC_ALLOW_HTTP=true` exists only for the isolated Compose CI topology. The manual workflow never sets it.

These checks are defense-in-depth for an operator-controlled workflow. They do not convert GitHub Actions into a general hostile-input network sandbox, and they do not replace provider firewall/egress policy.

## What the smoke proves

For the supplied public origins, the gate verifies:

- frontend `/healthz` is healthy;
- frontend SPA fallback is being served;
- the frontend response includes the maintained `nosniff` baseline;
- API `/healthz` is healthy and reports the exact requested API version;
- the API emits a server-generated UUID request correlation ID;
- `/readyz` reports every dependency as healthy and is `no-store`;
- the supplied frontend origin receives credentialed CORS permission;
- an untrusted browser preflight origin is rejected without `Access-Control-Allow-Origin`.

The qualification deliberately performs no registration, login, checkout, file upload or other business-data mutation against production.

## Evidence

A successful run writes `meow-external-qualification-v1` JSON evidence containing only:

- success/failure result;
- observation timestamp;
- backend/frontend SHAs;
- public origins;
- expected API version;
- observed request ID on success;
- GitHub repository/run/attempt/workflow reference.

Response bodies, cookies, tokens, user information and secrets are not retained in the artifact.

On smoke failure or missing success evidence, the workflow records a sanitized `failure` evidence file and uploads it before the final enforcement step turns the run red. The artifact is retained for 90 days by the workflow. That retention is operational CI evidence, **not** a production backup or long-term compliance archive.

## Contract self-test

The workflow also has a PR-only `contract` job. It does not contact a production environment. It validates:

- shell syntax;
- external HTTP is rejected before runtime smoke traffic;
- HTTPS targeting a loopback/non-public address is rejected before runtime smoke traffic.

The normal full-stack workflow separately runs the same smoke script against the isolated HTTP Compose topology and validates successful evidence generation. Together those two paths exercise both the external fail-closed boundary and the local success path.

## Relationship to cutover manifest

This workflow is a runtime observation after deployment. It does not by itself prove:

- the deployed container digest is the digest in the cutover manifest;
- production Mongo migration/preflight was run from a trusted operations environment;
- private storage migration completed;
- SMTP deliverability works;
- backup/PITR/RPO/RTO policy exists;
- monitoring/alert routing is operational;
- rollback images/data restoration are available.

Those remain separate cutover requirements. The external run ID should be attached to the release/cutover evidence set once a real provider exists.

## Recommended production sequence

1. qualify source code and local runtime through permanent quality/full-stack/recovery gates;
2. promote immutable API/web artifacts and record provider/registry digests;
3. execute migration and target data preflight from the trusted production operations environment;
4. confirm backup/PITR evidence and rollback authorities;
5. deploy the exact immutable candidate;
6. establish canonical DNS/TLS and production cookie/CORS/proxy configuration;
7. dispatch `Meow external release qualification` with the exact merged SHAs and real HTTPS origins;
8. require the manual run to be green before release acceptance;
9. observe the bounded rollback window, then accept or execute the documented rollback plan.

A green local CI smoke is not a substitute for step 7. Conversely, a green external smoke does not erase the data, backup, registry, SMTP or rollback requirements from the broader B7 cutover contract.

## Current status

The workflow can be installed and self-tested before a provider is selected, but a **real external qualification must not be claimed** until canonical production HTTPS authorities actually exist. Until then B7 remains active.