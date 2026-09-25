# Integration audit — 2026-09-25

Branch: `fix/complete-integration-audit`, created from clean commit `6ffa214` on `fix/final-project-integration`. Production Supabase was inspected read-only. No production migrations, settings saves, review operations, or cleanup were executed.

## Deployment boundary

The application changes and SQL fixes are not equivalent to a deployed, verified system. In particular, the ticket API now calls `update_staff_ticket`; deploy the pending migrations before deploying this API. Until then ticket updates fail safely instead of performing a partial resolution. Authenticated visual checks are recorded separately below.

`7e59cce` and `e314ff9` are not ancestors of this branch. Their implementations were integrated as `9ae5295` and `d9b98aa`; they were not blindly cherry-picked again. Safety `b503682` is represented by `095c516` plus later hardening. Ticket source `02d2e11` is an ancestor. The former hidden Settings panel was a closed `<details>` element, corrected in `ba101c6`. This audit resumes from that already-pushed checkpoint.

## Requirement matrix

Status refers to the weakest verified layer, not merely file existence.

| Requirement | Status | Connected path and evidence / remaining work |
|---|---|---|
| Protected pages and strict roles | Requires manual UI test | AppShell links → route layouts → `requireUser` / strict `requireStaff` / `requireAdmin`. All 12 requested routes redirect anonymous browser visits to `/login`. Inactive guard tests pass. Signed-in role matrix remains separately tracked. |
| Active-category API access | Fixed during resumed audit | `useCategories` → `/api/categories` now checks authenticated profile status before reading. Anonymous 401; inactive 403; USER/STAFF active-only; active ADMIN may request inactive. POST/PATCH/DELETE already checked active ADMIN before privileged clients. Eight role/status tests cover reads and all mutations. |
| Active-account direct database access | Repository migration pending production | Ownership policies previously omitted ACTIVE checks. New restrictive policies AND account activity with existing ownership/role access on public workflow tables and Storage. Profile self-read remains available for login; profile RPC and writes require ACTIVE. Local SQL verifies inactive old-session denial. |
| Lost/Found reports and review | Repository migration pending production | AppShell → report forms → real Storage upload and `items` insert with `PENDING_REVIEW`; Staff page → `ItemReviewCard` pending-filtered update. New SQL enforces pending inserts and restricts Staff review to pending rows; production still has broader Staff ALL access. |
| Search filters | Requires manual UI test | `/search` → `SearchFilters` → `items` query restricted to PUBLISHED. Type/category/brand/color/location/date/name all alter the query. No production sample dataset found. `ItemCard` displays text details; there is no separate item-detail route. |
| Item/claim image privacy | Repository migration pending production | Search, matching and MyClaims select explicit text-only columns. Admin list/PATCH responses no longer select image fields or sign private images; Admin preview removed. New SQL removes ordinary-user evidence/handover SELECT policies; Staff preview policies remain. All four production buckets are private. Safety's separately specified published-image viewer is preserved. |
| Matching | Fixed during resumed audit | Owned published LOST → published FOUND → global settings → `PotentialMatches` → `calculateMatch`. Previously calculated percentage was not rendered; now displayed and translated. Threshold gates the potential-match label/claim link; lower-scoring comparisons remain visible. Missing/invalid settings and query failures now surface errors instead of defaulting or silently showing no matches. |
| Matching weights | Complete and connected | Existing weighting retained: name 30, category 20, color 20, location 20, date within 24 hours 10. No Matches table. Tests verify 70% score and eligibility changing with threshold 70 vs 80. No alternate numerical specification was supplied in the audit prompts. |
| Claims and handover | Repository migration pending production | `/claims/new` optional evidence → claims; `/staff/claims` → `StaffClaimCard` → RPCs; `/claims` → `MyClaims` includes Staff notes. Production RPC comparison `<> 'STAFF'` failed open for NULL/inactive roles. New RPCs use `IS DISTINCT FROM`, verify uploaded handover photo and commit Claim/Item changes together. Direct Staff writes removed. SQL tests verify ADMIN/inactive denial and APPROVED→COMPLETED / CLAIMED→RETURNED. |
| Safety | Repository migration pending production | Published-only user query and location/date filters; Staff cards/API accept pending review only; no Delete button or DELETE handler. Production still has Staff ALL policy and no deletion revocation. Pending `20260924112345` supplies database enforcement; new migration also constrains report inserts and inactive access. |
| Service tickets | Repository migration pending production | `TicketForm` verifies optional own claim; `MyTickets` filters owner and displays note. Staff card → API → new RPC. Previous separate update/notification could leave RESOLVED after notification failure. RPC now locks ticket, checks active STAFF/expected state, trims note, writes resolved_at and notification in one transaction. Local failure-injection test proves rollback and no duplicate notification on retry. |
| Admin Item Management | Requires manual UI test | AppShell ADMIN link → `/admin/items` → Admin layout guard → rendered `AdminItemManager`. Items tab, CategoryManager tab and always-open Settings section are connected. Admin metadata editing/deletion remains separate from Staff review. |
| System Settings | Requires manual UI test | Global production row exists (read-only snapshot: threshold 80, retention 30). Active-ADMIN GET/PUT select/upsert both validated integer fields. Manager loads inputs, shows loading/success/error, and now disables Save until successful load. Matching and cleanup consume the fields. Save/reload tested with handler doubles, not a production write. |
| Category renaming | Repository migration pending production | CategoryManager → active ADMIN API → service-only RPC. Existing case-insensitive category uniqueness was inconsistent with exact-case item rename. New SQL updates legacy case/whitespace variants together; SQL regression covers both spellings. |
| Admin users and logs | Requires manual UI test | `/admin/users` → UserTable → guarded server listing/deletion and ADMIN-only profile RLS updates; `/admin/logs` → ActivityLogTable → ADMIN-only logs SELECT. Error handling and direct authorization inspected. |
| In-app notifications / announcements | Requires manual UI test | AppShell loads own notification rows and marks read; Admin NotificationForm resolves email to user ID through active-ADMIN API then inserts a notification under ADMIN RLS. STAFF cannot create announcements. Ticket notifications move into atomic RPC. |
| Notification recipient configuration | Complete and connected | Email field selects an existing Auth user through `/api/admin/notification-recipient`; it does not configure an SMTP delivery destination or broadcast subscription. API checks active ADMIN before privileged user lookup. |
| Email delivery | Missing | No application email delivery worker/provider/send operation found. Entering an email in the announcement form only locates an in-app recipient. Supabase authentication mail is a separate facility; delivery was not tested. No new notification features added. |
| Browser push | Missing | No service-worker registration, Push API subscription or push-delivery infrastructure found. In-app rows are not browser push. No toggles added. |
| Returned-item cleanup | Repository migration pending production | Secret-authenticated endpoint defaults to dry-run; explicit enable flag and `dryRun=false` required. Retention → old completed claims → RETURNED items → transaction → Storage removals. New path validation rejects URLs/traversal before deletion. New RPC locks/rechecks eligibility; ticket references cleared while tickets remain. Tests mock Storage and run SQL in memory only. |
| Automatic cleanup scheduling | Code exists but disconnected | Endpoint exists, but no repository deployment cron configuration and no production `pg_cron` extension found. External hosting schedules were not accessible. No automatic schedule or live cleanup claimed. |
| Theme / EN–TH | Requires manual UI test | Home layout and CSS from `e314ff9` preserved; original CSS is unchanged. AppShell retained, with only item link and active-profile handling changes. New percentage label has both languages; existing Settings/category labels already have both. Signed-in light/dark/mobile checks remain. |

## Additional fixes and audit findings

- Removed unused `components/claims/ClaimReviewCard.tsx`: it had an obsolete two-write handover implementation and no imports. The active implementation is `StaffClaimCard` with RPCs.
- Matching pages no longer discard query errors. The interrupted audit's Home-page error-banner change was deliberately rejected so the preserved Home implementation remains byte-for-byte unchanged.
- `lib/auth/guards.ts` now rejects Auth errors as well as missing users; AppShell does not construct navigation from an inactive/failed profile lookup.
- Removed the unused legacy `AppNavigation`, `AdminNavigation`, and `StaffNavigation` components. No current imports depended on them; AppShell remains authoritative.
- Empty catches in localStorage/theme bootstrapping are optional-preference fallbacks. The server-cookie catch is the documented Server Component write restriction. No editable metadata authorizes roles; `handle_new_user` uses metadata only for the name and assigns USER/ACTIVE explicitly. `SUPABASE_SECRET_KEY` remains behind `server-only`; public variables are only URL/publishable key.
- Upload-failure cleanup in report/claim forms is best effort and does not have its own transaction with Storage. A failed cleanup can leave an orphan; these paths do not falsely report the report/claim as successfully submitted. This is distinct from returned-item cleanup, which reports orphan warnings explicitly.

## Rejected interrupted-audit changes

- `app/page.tsx`: rejected because it changed the preserved Home UI for a generic query banner outside the confirmed integration gaps.
- `lib/supabase/cleanup-upload.ts` and the related report/claim form rewrites: rejected because they expanded five UI flows without focused regression coverage and did not change the returned-item cleanup transaction under review. Existing upload compensation remains best effort.
- The extra upload-cleanup translation was rejected with those form changes.
- No part of `dafcfb8` was merged or cherry-picked wholesale; every retained file was restored individually after review.

## Migration inventory and production evidence

| Repository migration | Production history | Active production inspection |
|---|---|---|
| `20260924104824_harden_active_roles_and_add_ticket_staff_note.sql` | Present | staff_note exists; get_my_role selects ACTIVE; anonymous privileged RPC execution revoked. |
| `20260924104825_secure_admin_configuration_tables.sql` | Present | Categories/settings exist with RLS; global row present; category RPCs service-only. |
| `20260924104835_add_returned_item_cleanup_rpc.sql` | Present | Transactional cleanup function exists and is service-only; original version lacks the new locking. |
| `20260924112345_enforce_staff_workflow_invariants.sql` | **Pending** | Safety still has ALL policy; resolution-note trigger absent. |
| `20260925023730_enforce_active_workflow_access.sql` | **Pending** | Active restrictive policies, null-safe claim/profile RPCs, atomic ticket RPC, narrower direct-write policies, category rename normalization and locked cleanup are not deployed. |

No migrations remain in `lib/supabase/migrations`. The new filename was generated by the installed Supabase CLI. All five repository migrations replay twice successfully against the in-memory base-schema fixture. This is an incremental migration repository: the existing core tables and four earlier production-history migrations (`20260920035640`, `20260920035651`, `20260920035704`, `20260920040540`) are prerequisites, not recreated by this audit. Category/settings prerequisites are created before alterations in their migration. Tests are not a claim that an empty production database can be bootstrapped from these five files alone.

Read-only production inspection confirmed all nine public tables have RLS and all four Storage buckets are private. Security advisor reported authenticated SECURITY DEFINER entrypoints (intentional for role-checked RPCs) and disabled leaked-password protection. See [RPC advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No production configuration was changed.

## Verification and remaining role tests

Fresh `npm ci` completed. Node regression suite includes handler authorization, real React output and PGlite transaction/RLS checks. Build/lint final results and commit identifiers are recorded in the delivery report.

Fresh browser visits to `/`, `/search`, `/matching`, `/claims`, `/safety`, `/tickets`, `/staff/items`, `/staff/claims`, `/staff/safety`, `/staff/tickets`, `/admin`, `/admin/items` all ended at `/login` with a rendered password input when unauthenticated.

Manual signed-in checks still required unless supplemented by the browser record:

1. USER: report forms, all seven search filters, owned matching/claims/tickets, published Safety, text-only item/claim payloads; deny all Staff/Admin routes and actions.
2. STAFF: four `/staff/*` pages, pending-only reviews, claim approval/rejection, required-photo handover and trimmed-note ticket resolution; deny `/admin/*` and announcements.
3. ADMIN: `/admin`, `/admin/items`, `/admin/users`, `/admin/notifications`, `/admin/logs`; visible Settings/category tab; both settings round-trip on a nonproduction test database; deny all Staff routes/actions.
4. INACTIVE accounts with existing sessions: page, API and direct Data API denial after migrations are deployed to a test database.
5. EN/TH and light/dark/mobile inspection across Home, shared forms and Admin settings.

The audited working tree is on `fix/complete-integration-audit`. A deployed website's branch cannot be inferred from the local checkout; its URL/deployment SHA must be supplied or verified separately. No merge to main is part of this audit.
