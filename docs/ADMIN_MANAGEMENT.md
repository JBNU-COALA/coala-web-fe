# Administrator Coverage

The dashboard manages persisted backend data. It does not use editable frontend fixtures or grant an operator another member's identity. Query parameters select workspaces under `/admin`; STAFF and SUPER_ADMIN gates remain enforced by backend services.

| Workspace | Supported Operations |
| --- | --- |
| Operations | Live counts, pending work, create-only education recovery, navigation |
| Analytics | Existing analytics integration and its configured/unavailable states |
| Audit | Read and search the existing audit records |
| Members | Profiles, SUPER_ADMIN-only role changes, sanctions, sanction history and reasoned release |
| Boards | Create, rename, describe, classify NORMAL boards, deactivate/reactivate; type remains immutable |
| Posts | Ordinary-post hide/restore/lock/unlock/admin-delete; information/recruit content editing and deletion |
| Comments | Paginated body/ID/status search, reasoned hide/restore/admin-delete, original-post link |
| Employment | Review search/edit/delete; persisted industry/role classifications |
| Activity | Month/group filters; existing group, record, attendance and photo editors |
| Reports | Detailed reason, direct target inspection, accept/reject and audit |
| Education | Subjects, courses/documents, stable lessons, problems, answers, files, publication, learners, runtime readiness/stop |
| Archive | Create/edit/delete metadata and body; file upload/link |
| Banners | Create/edit/delete title, eyebrow, description, image, link, button, tone, order and visibility; image upload/remove |
| About | Persist title, description and keywords |
| Services | Create/edit metadata, audience, detailed description, features, stack, representative/additional images and operational status |
| Instances | Read/process applications and answer inquiries |
| Domains | Read/process applications and answer inquiries |

Banner API data is authoritative even when a title matches older seed copy. Text-mode banners display the saved eyebrow; image-mode banners display the uploaded media without duplicate overlay copy. Asset URL resolution and uncropped images from the concurrent responsive-UI change are retained. Referenced banner uploads are excluded from orphan cleanup, including unpublished banners. Service detail fields are optional on the API: older clients never erase fields they omit.

Sanction release ends the existing sanction without deleting its original reason/history. It requires a reason (450 characters maximum), records an audit entry and retains the existing SUPER_ADMIN protection for moderator accounts. Repeat release is idempotent. New sanctions require an end later than their start. Ordinary member post/comment content retains its existing authorship policy; moderation does not impersonate its author. Education publication controls retain learning records rather than cascading hard deletion.

Local QA uses an isolated, ignored H2 preview and locally generated test authentication only. No production credentials are read or QA records created on production. Backend integration tests exercise persistence/permissions; frontend tests exercise payloads, error recovery, upload controls, confirmations and target navigation. Live production writes are not simulated with a fabricated operator session.

Runtime-host provisioning, real Docker targets, DNS changes and email delivery remain external integrations, not work completed by changing an application status. The dashboard exposes the application-level management and genuine readiness/errors without claiming those systems were provisioned.
