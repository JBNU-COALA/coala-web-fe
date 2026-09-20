# CRUD Verification

## Local Regression Checks

- `design/check-crud-regressions.cjs`: mocked UI contracts for standalone activities, optional group linkage, version conflicts, deletion, recruitment validation, and 403 draft preservation. Screenshots cover 320/390/768/1280px.
- `design/check-activity-api.cjs`: existing approval, attendance, profile and information-post integration contracts with mocked responses.
- Backend `StudyIntegrationTest` and `ApiSmokeTest`: H2 persistence and HTTP validation/authorization. These are not deployed-server evidence.

## Deployed Backend

- `node design/check-deployed-crud.cjs` defaults to read-only requests against the public HTTPS deployment.
- Authenticated checks require process variables `QA_WRITE=1`, `QA_EMAIL`, and `QA_PASSWORD`. Do not store credentials in this repository or print responses containing tokens.
- The runner creates only timestamp-prefixed QA records and removes only IDs returned by its own creation requests. A cleanup failure is explicitly reported.
- Service DELETE retires a service rather than deleting it. Service registration/retirement, infrastructure requests and account lifecycle checks need a disposable staging environment to avoid permanent public test entries or provisioning side effects.
- Unauthenticated successful reads are not proof that create/update/delete works. A rejected QA login leaves authenticated verification incomplete.

## Contract Changes

- New recruitment and service IDs are server UUIDs; existing IDs and URLs remain valid.
- Recruitment creation and editing share one validation/conversion module. Technology and process lists may be empty; role/count, title, summary and body are required. Commas and line breaks in the body are preserved.
- Unauthenticated requests return 401, while insufficient permissions return 403. Only 401 triggers token refresh; concurrent API retries share that refresh. A network error or permission denial does not redirect an active editor.
- Activity `groupId` is nullable through an additive Flyway migration. No tables or existing records are deleted.
