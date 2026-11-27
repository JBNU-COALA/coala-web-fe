# Education And Employment Integration

## Data Ownership

All user-facing content comes from the Coala Spring backend and PostgreSQL. The frontend does not bundle problems, curricula, employment reviews, companies, industries or job-role fixtures. Coala login/JWT and the existing shared Axios refresh flow apply to both features. There is no separate CTF account or public `/ctf` proxy anymore.

The supplied CTF YAML/Markdown is an import source, not the live application database. Coala stores subjects, courses/documents, challenge content, submission results, solve scores, lesson completion and instance references. Docker execution and dynamic grading stay in the private Python adapter. Raw submitted flags are not retained. Never upload an import bundle to frontend hosting: it contains grading inputs.

## Routes

- `/education`: API-backed subject directory.
- `/education/hacking/challenges[/:id]`: problems and server-side submission/instance controls.
- `/education/hacking/curriculum`: all published hacking tracks and related guide documents.
- `/education/hacking/scoreboard`, `/education/hacking/instances`.
- `/education/algorithms`, `/education/subjects/:subjectId`: independent course catalogs.
- `/education/courses/:courseId`: Markdown documents and persisted lesson completion.
- `/community/employment`: accepted/rejected reviews with server-side company, industry, role and title filters; 20 rows per page.
- `/community/employment/new`, `/:reviewId`, `/:reviewId/editor`: verified member writing, public reading, owner/moderator editing and deletion.
- `/admin?tab=education`: subjects, structured courses/documents, problems, attachment uploads, learner history and execution readiness/termination.
- `/admin?tab=employment`: review search/edit/delete and DB-backed industry/job-role taxonomy, including unpublishing options without destroying old reviews.
- `/admin?tab=archive`, `/admin?tab=audit`: archive CRUD and searchable audit history. The searchable dashboard directory covers 17 management areas.
- The expanded 17-area dashboard also includes comment moderation, direct report-target inspection and sanction history/release. Full operational coverage and permission boundaries: [Administrator Coverage](ADMIN_MANAGEMENT.md).

Subject metadata and course counts are fetched, not hardcoded. `subjects.ts` contains only route/icon mapping. Future subjects are siblings of hacking, not CTF categories. Algorithms supports real courses/documents/progress, but no algorithm judge is fabricated.

## Backend Contracts

Public reads use `/api/education/subjects`, `/subjects/:id/courses`, `/courses/:id`, and `/hacking/{challenges,curriculum,scoreboard}`. Coala-authenticated writes use `/courses/:id/progress/:lesson`, `/hacking/submit`, `/hacking/launch/:id`, `/hacking/stop/:id`. Personal instances/submissions remain authenticated and user-scoped. Declared file downloads go through `/api/education/hacking/files/:id/...`.

Employment uses `/api/employment/options` and `/api/employment/reviews[/:id]`. List query parameters: `outcome=ACCEPTED|REJECTED`, `company`, `industry`, `role`, `q`, zero-based `page`. Companies are normalized names saved with reviews and returned as DB-backed autocomplete suggestions; a first-time company can be typed. Industries and roles are persisted options, not free-text aliases. Reviews additionally record recruitment year and stage. There are no fabricated reviews, likes or comments.

Admin APIs are `/api/admin/education/*`, `/api/admin/employment/{options,reviews}` and `/api/admin/operations`. Existing education/employment records require the returned `version` on updates; 409 preserves drafts for deliberate reload/reconciliation. Import never overwrites existing IDs or learner progress. The challenge editor never receives stored answers/hashes; an empty replacement answer preserves the existing hash. Attachments are stored in the backend DB and downloaded through the existing declared-file endpoint. Dynamic challenge templates/images must still exist on the private execution host: editing metadata does not build Docker targets.

## Local And Production

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 3001 --strictPort
```

Vite proxies `/api` and `/media` to `API_PROXY_TARGET` (default `http://127.0.0.1:8080`). Only public API URLs enter the client bundle. See the backend `docs/EDUCATION_AND_EMPLOYMENT.md` for migration/import and private runtime setup.

The development preview uses a persistent **local H2 file**, not production PostgreSQL. Its launcher is test-only and excluded from the production jar. Runtime is intentionally disabled there. Production deployment applies Flyway migrations and imports the encrypted release pack create-only when `APP_EDUCATION_SEED_KEY` is configured. The key is a backend Actions Secret, never frontend configuration. The dashboard's basic-pack button can register missing records later without individual uploads. It contains 120 problems, six tracks, four guide documents and 104 attachments. Local preview DB/session files and plaintext import bundles are never deployed. Actual Docker execution still requires a private runtime and isolated challenge networking.

## Verification

- Full frontend regression suite: 249 passed (46 files, single worker) after integrating the concurrent responsive-UI changes. Production build and changed-file ESLint passed.
- The previous four failures are resolved: three attendance tests now use the real custom selection control, and the missing post-report action is restored. The backend suite passes all 166 tests.
- Backend integration tests cover real 120-problem/six-track/four-guide import, ownership, permissions, privacy, progress, create-only reimport, optimistic versions and database constraints. Runtime bridge has separate signature/replay/path/grader tests.
- User-supplied source has six tracks: first/second/third/fourth year and advanced are 12 weeks; BoB preparation is 16. Guides preserve supplied content; time-sensitive program/admissions claims have not been independently re-researched.
- Real local-browser checks: review creation/reload/result update, record survival across backend restart, mobile list/editor at 390/360px, six-track curriculum/four guides, lesson completion persistence and administrator catalogs. Temporary QA review removed; no real reviews seeded. Screenshot review used a temporary in-app browser tab, which was closed. Ego screenshot capture timed out; DOM checks and the independent screenshot were used without claiming a successful Ego image.
- Unified admin QA additionally verified one-click registration of all 104 attachments, structured algorithm-course/lesson creation and stable editing at 360/390/1440px. New admin screenshot capture remained unavailable in Ego; layout was checked using rendered element geometry, not an invented screenshot result.
