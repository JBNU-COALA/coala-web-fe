# Interface and integration review

Review date: 2026-09-26. These changes are local and have not been deployed.

## Shared boundaries

- `SectionNav`: community, archive, activity and profile navigation with icons.
- `ListingControls` / `FilterTabs`: categories, small result count, search and actions in a consistent order. Filter styling has one owner; conflicting legacy overrides were removed.
- `Pagination` / `usePagination`: bounded pages, previous/next controls, reset on a changed filter and clamp after removal.
- `HomeCarousel`: backend-managed slides, swipe, keyboard navigation, pause and reduced-motion support. A successful empty response hides all banners. Fallback navigation slides only cover an unavailable endpoint.
- `useProfileOverview`: one aggregated profile request, cancellation and identity-scoped results instead of loading every board/user list.
- `ServiceInquiries`: shared instance/domain inquiry form, complete content, operator replies, pending state, retry and retained drafts.
- `ServiceWorkspace`: shared instance/domain navigation, URL-backed selection and one role-gated link to the canonical admin editors. The duplicate instance/domain admin screens were removed, including an obsolete failure path that displayed a failed decision as successful.
- Admin editors are separated by resource, with shared input/validation/loading helpers and reused domain API methods.

The interface references were [Toss Tech](https://toss.tech/) for editorial hierarchy and banners, and [Banksalad](https://www.banksalad.com/) for task-oriented navigation. Existing club artwork and character avatars remain in use; test identities are confined to test files.

## Behavior and access checks

- Profile links connect authored posts, information, recruitment, study attendance and services. Private application counts are self-only; missing counts are not shown as zero.
- Recruitment saves persist through the backend and can be removed. Application submission preserves drafts on failure and blocks repeated submissions.
- Study record loading is tied to the current group/date. Editing and attendance entry preserve participant identities.
- Information saves persist per account; save/like operations cannot overwrite each other's state. Old detail responses cannot replace another article or navigate away after a late deletion.
- Post and notification requests are scoped to the current route/account.
- Bootstrap and API token refresh share one in-flight operation. Logout/account switches invalidate old requests; network failure does not erase the session, while rejected credentials do.
- Only the explicitly public `API_BASE_URL` is exposed by Vite. Proxy targets and other `API_` settings are not automatically exported to browser code.

## Local verification

- Frontend: 163 tests in 23 files passed; TypeScript/build and ESLint passed.
- Backend: 127 tests passed, including permission, privacy, bookmark, inquiry, category and isolated migration cases.
- `npm audit`: zero reported dependency vulnerabilities at review time. This is not a comprehensive security guarantee.
- Both repositories ignore private `.env` variants; none are tracked. No credentials or deployed data were modified.
- Route rendering tests use mocked API adapters, not production writes. They validate behavior and markup, not rendered pixel positions.
- The local Vite server was started successfully. Real browser spot checks used 320, 390, 768, 1024 and 1440-pixel viewports, with screenshots and DOM geometry. Coverage included home/carousel, about, board, information, archive, recruitment, service application navigation, user-service cards/list/detail, login and protected-route behavior. This is not an exhaustive route-by-viewport matrix.
- Fixed during browser checks: user-service images rendered at their intrinsic size beyond card/detail boundaries; the user directory requested a login-only API anonymously; instance/domain screens exposed duplicate management tabs to non-admin viewers. Directory failures now have retry and do not display a false zero-member count.
- Verified mobile image bounds after the fix (card media 130px tall and detail media 220px tall), navigation selection, card/list switching, anonymous registration guidance and authentication redirects. The in-app browser's large full-page captures showed stitching artifacts; viewport screenshots and DOM geometry were used instead.
- Browser checks used the local frontend's existing proxy and read-only public data. Authenticated profile/admin/attendance mutations were covered by isolated tests, not by an authenticated browser CRUD run.

## Required before release

1. Review the existing database migration history/baseline, then apply the four new additive migrations listed in the backend's `docs/management-api-changes.md`. Do not enable automatic baseline/schema updates or reset the database.
2. Deploy the matching backend before relying on the new banner, overview, bookmark and inquiry contracts. Existing public read endpoints responded during this review; the new banner endpoint was not yet available.
3. Run authenticated browser checks against the matching backend: profile task links, recruitment forms, attendance participants/photos, admin editors and inquiry reply display. Public/guest local browser checks have been performed; authenticated visual coverage remains pending.
4. Run authenticated end-to-end CRUD and image-persistence checks against an explicitly designated staging account/environment, then remove only that test's disposable records through the normal application workflow.

No deployment or remote mutation was performed. Backend migration and authenticated CRUD/image-persistence checks remain release gates; unit/integration passes must not be presented as completed deployment checks.
