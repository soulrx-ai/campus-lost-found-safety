<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# AGENTS.md
# Campus Lost & Found & Safety Incident Reporting System

This file provides project rules and context for AI coding agents working in this repository.

---

## 1. MOST IMPORTANT RULE

The CURRENT repository is the source of truth.

Before making ANY code change:

1. Inspect the current Git branch.
2. Run `git status`.
3. Inspect the current implementation of every relevant file.
4. Inspect existing routes, components, types, auth guards, Supabase clients, database-dependent code, and dependencies.
5. Check the current diff against `main` when relevant.
6. Preserve existing working business logic unless the task explicitly requires changing it.
7. Never write code only from assumptions, memory, this document, or an old conversation.
8. If this document conflicts with the current repository, investigate the current implementation first.
9. If something cannot be verified, explain that before modifying it.
10. Before shared/integration work, re-check the latest `main`.

Never invent:
- database columns
- tables
- routes
- RPC functions
- RLS policies
- Storage buckets
- dependencies
- workflow behavior

Always verify first.

---

# 2. PROJECT

Project:

**Campus Lost & Found & Safety Incident Reporting System**

This is a university web application combining:

- Lost Item reporting
- Found Item reporting
- Item Search
- Dynamic potential matching
- Claims
- Staff Claim Review
- Physical Handover
- Safety Incident reporting
- Service Tickets
- Notifications
- Administration

The system is currently intended for a university/campus environment.

Using **Walailak University** branding is acceptable when appropriate.

However, do not unnecessarily hard-code university-specific assumptions into business logic.

---

# 3. TECHNOLOGY STACK

Currently known stack:

- Next.js 16
- App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- `@supabase/supabase-js`
- `@supabase/ssr`

Before using these versions as implementation assumptions, verify `package.json`.

Do not install new dependencies unless they are actually necessary.

Prefer existing project patterns.

---

# 4. USER ROLES

The system has three roles:

- `USER`
- `STAFF`
- `ADMIN`

All main application workflows require authentication.

Known authorization helpers:

- `requireUser()`
- `requireStaff()`
- `requireAdmin()`

Inspect their current implementation before changing protected pages.

Never weaken authorization just to make a UI feature work.

Frontend visibility is NOT a replacement for Supabase RLS.

---

# 5. ROLE RESPONSIBILITIES

## USER

Normal users can use end-user workflows such as:

- report a lost item
- report a found item
- search published items
- find potential matches
- submit claims
- track their claims
- report Safety Incidents
- view available Safety information
- create Service Tickets
- view their own Service Tickets
- receive/view notifications

Exact access is controlled by current RLS.

---

## STAFF

STAFF handles operational workflows.

Examples:

- approve/reject Lost reports
- approve/reject Found reports
- review Claims
- manage handover
- confirm item return
- review/manage Safety Incidents
- manage Service Tickets

STAFF is the operational role.

---

## ADMIN

ADMIN handles system/backend administration.

Examples:

- manage users
- manage roles/status
- manage system configuration where implemented
- notifications/announcements
- activity logs
- administrative functions

ADMIN and STAFF responsibilities should remain clearly separated.

Do not duplicate Staff operational review workflows inside Admin unless requirements explicitly change.

---

# 6. TEAM OWNERSHIP

Current feature ownership:

## Mon / Integration

Responsible for:

- Found Report
- Search
- Search Filters
- Dynamic Matching
- Home Dashboard
- Final Integration
- Shared App Shell integration

---

## Sor

Responsible for:

- Login
- Register
- Authentication
- Session
- Password recovery

---

## Gan

Responsible for:

- Lost Report
- Lost Item UI

---

## Leo

Responsible for:

- Claim
- Claim Review
- Handover

---

## Fee

Responsible for:

- Safety Incident
- Safety Filters
- Service Tickets

---

## To

Responsible for:

- Admin
- User/Role Management
- Notifications/Announcements
- Activity Logs

---

## Shared Integration

Shared/global UI should be handled centrally.

Examples:

- Hamburger
- Sidebar
- Global navigation
- Notification Bell
- Account/Profile menu
- Logout placement
- Global Footer

Do NOT ask every teammate to independently add the same global navigation/footer to their feature pages.

Avoid editing another teammate's feature unless integration requires it.

---

# 7. GIT WORKFLOW

Do not work directly on `main` unless explicitly instructed.

Each feature should use its own branch.

Before editing:

```bash
git status
git branch --show-current
When appropriate:
git fetch origin

Inspect the current difference from main.
Do not discard existing uncommitted work without explicit permission.
Do not automatically:
- commit
- push
- merge
unless explicitly requested.
Before commit:
1. inspect the final diff
2. browser-test the feature
3. test relevant role restrictions
4. test responsive UI when applicable
5. run git diff --check
6. run npm run build
Recommended:
git diff --check
npm run build
git status

Only commit after validation.
8. DATABASE
Known public tables:
- profiles
- items
- claims
- security_incidents
- service_tickets
- notifications
- activity_logs
Always verify types/database.ts and the current Supabase implementation before changing database-dependent code.
9. PROFILES
Known important fields:
- id
- full_name
- phone
- role
- status
- created_at
Known roles:
- USER
- STAFF
- ADMIN
Known statuses:
- ACTIVE
- INACTIVE
IMPORTANT:
Email is stored in Supabase Auth.
Do NOT assume there is an email column in profiles.
10. ITEMS
Lost and Found reports use the same items table.
They are differentiated using:
report_type

Known values:
LOST
FOUND

Known fields include:
- id
- reporter_id
- report_type
- name
- category
- brand
- description
- color
- date_time
- location
- image_url
- status
- reviewed_by
- reviewed_at
- created_at
- updated_at
Known statuses include:
- PENDING_REVIEW
- PUBLISHED
- REJECTED
- CLAIMED
- RETURNED
- CLOSED
Verify current types before relying on this list.
11. LOST / FOUND MODERATION
All Lost and Found reports require Staff approval before public publication.
Expected flow:
USER creates report
        ↓
PENDING_REVIEW
        ↓
STAFF reviews
       ↙ ↘
PUBLISHED  REJECTED

Do not bypass Staff moderation.
12. LOST & FOUND PRIVACY
This is a critical project requirement.
Normal USER-facing:
- Search
- Item details
- Matching
- Claim
must NOT expose information that makes fake ownership claims easy.
Normal USER pages must NOT expose:
- item images
- reporter phone
- reporter email
- serial number / IMEI
- detailed storage location
- ownership verification details
- private evidence
Staff/Admin may see additional information when authorized.
Do not weaken this privacy behavior during UI redesigns.
13. MATCHING SYSTEM
There is intentionally NO matches database table.
Potential matching is calculated dynamically.
Current matching weights:
Attribute	Weight
Name	30%
Category	20%
Color	20%
Location	20%
Date	10%


Potential Match threshold:
score > 70%

Matching only means:
Potential Match
It does NOT mean confirmed ownership.
Never present a matching score as proof that an item belongs to a user.
14. CLAIMS
Known Claim statuses:
- PENDING_REVIEW
- APPROVED
- REJECTED
- COMPLETED
IMPORTANT DATABASE FIELD:
The evidence field is:
evidence

NOT:
evidence_url

unless the current schema has changed.
Claim evidence is optional.
15. CLAIM WORKFLOW
Expected workflow:
Potential Match
      ↓
USER submits Claim
      ↓
PENDING_REVIEW
      ↓
STAFF reviews
   ↙       ↘
APPROVED  REJECTED
   ↓
Physical Handover
   ↓
STAFF records handover
   ↓
COMPLETED
   ↓
Item = RETURNED

USER does NOT perform another final receipt confirmation.
If the user did not actually receive the item, they can create a Service Ticket.
16. CLAIM RPC
Known RPC functions may include:
review_claim(...)
complete_claim_handover(...)

Always inspect the current generated types/current implementation before using or modifying RPC calls.
Do not invent RPC signatures.
17. SERVICE TICKETS
Known ticket types:
- NOT_RECEIVED
- SYSTEM_PROBLEM
- GENERAL
Known statuses:
- OPEN
- IN_PROGRESS
- RESOLVED
A Service Ticket may optionally reference a Claim.
Expected example:
Approved Claim
     ↓
User has not received item
     ↓
NOT_RECEIVED Service Ticket
     ↓
Staff handles ticket

18. SAFETY INCIDENTS
Safety Incident reporting is a major feature.
Known statuses:
- PENDING_REVIEW
- PUBLISHED
- REJECTED
- CLOSED
Current requirement includes at least one incident image.
Safety Incident images are private.
Do not expose private Safety media publicly without authorization.
19. ANONYMOUS SAFETY REPORTING
An earlier project concept considered anonymous reporting.
However, the known database design uses a required reporter_id.
Therefore:
DO NOT implement anonymous reporting unless the current schema and project requirements explicitly support it.
Never invent anonymous behavior only because it was discussed previously.
20. SAFETY RLS
RLS is authoritative.
A previously verified policy allowed normal USER access to published Safety Incidents.
Therefore:
Do NOT assume a USER can always read their own:
- PENDING_REVIEW
- REJECTED
Safety reports.
Even if frontend code filters:
.eq("reporter_id", profile.id)

RLS still determines which rows are returned.
Never bypass this from the frontend.
21. NOTIFICATIONS
Known notifications fields include:
- id
- user_id
- title
- message
- type
- is_read
- created_at
Normal USER access is expected to be limited to their own notifications by RLS.
This data can support:
- Notification Bell
- unread count
- latest notifications
- mark as read
- notification list
IMPORTANT:
Do NOT assume every workflow automatically creates a notification.
Before claiming automatic notifications exist, inspect the relevant workflow/database logic.
22. STORAGE
Known private Storage buckets:
- lost-found
- claim-evidence
- handover
- safety-incidents
Treat these as PRIVATE unless current configuration proves otherwise.
Do NOT use:
getPublicUrl()

for private media.
Use the project's existing signed URL/access pattern.
Never make a private bucket public just to simplify UI development.
23. HOME DASHBOARD
Current Home direction:
1. Welcome
2. Safety Highlight
3. Quick Actions
4. Lost & Found
5. Report Safety Incident
6. My Activity
7. Recovery & Support
8. Role-specific shortcuts
Home should use REAL application data.
Do not create fake records simply to make the page look populated.
24. HOME SAFETY HIGHLIGHT
Home should display the latest PUBLISHED Safety Incident when available.
Expected data:
- title
- description
- location
- incident time
Do NOT request/display:
image_url

for the Home Safety Highlight.
Reason:
Safety images are private.
Also, do not use a generic campus photo as if it depicts the actual incident.
Use icons/graphics/decorative shapes instead.
25. MY ACTIVITY
Home My Activity can combine real user activity such as:
- Lost reports
- Found reports
- Claims
- Safety reports visible under current RLS
- Service Tickets
Sort recent activity by time.
Do not insert fake activity.
When no activity exists, use a proper empty state.
26. UI DESIGN DIRECTION
The UI should feel like:
- modern university service application
- clean
- trustworthy
- calm
- professional
- warm
- not overly corporate
- not generic SaaS
The UI should not feel:
- too empty
- too pale
- excessively white
- overly saturated
- childish
- dark/heavy
27. COLOR DIRECTION
Use the existing design system when possible.
General direction:
Primary
Deep botanical / forest green.
Used for:
- important navigation
- shared accents
- primary identity
Found / Search
Sage / green.
Lost
Warm amber / sand / muted orange.
Safety
Muted brick / red.
Safety should remain visually prominent.
Support
Muted blue / blue-grey.
Background
Warm off-white / cream.
Cards should have enough contrast to avoid looking like identical white boxes.
28. UI FOUNDATION
Known shared CSS classes include:
.app-container
.page-shell
.ui-card
.ui-input
.ui-button-primary
.ui-button-secondary

Inspect app/globals.css before creating duplicate styles.
Use existing design tokens where practical.
Do not introduce random one-off colors if existing semantic variables are suitable.
29. ICONS
Prefer:
- existing inline SVG
- existing project icon solution
Do not install an entire icon package just for a few simple icons unless clearly justified.
Icons should support navigation and hierarchy, not become decoration overload.
30. RESPONSIVE DESIGN
UI work must consider at least:
Desktop:
~1440px
Tablet:
~768px
Mobile:
~390px
Check:
- no horizontal overflow
- readable text
- buttons remain usable
- cards stack correctly
- navigation remains usable
- metadata wraps correctly
- role controls remain visible
31. PLANNED APPLICATION SHELL
A shared authenticated application shell is planned.
This should be implemented centrally after feature UI integration.
Expected structure:
┌──────────────────────────────────────────────┐
│ ☰ Campus Lost & Safety       🔔   User ▾    │
└──────────────────────────────────────────────┘

Page Content

Global Footer

32. HAMBURGER / SIDEBAR
The final navigation should use a hamburger button.
Clicking:
☰

opens a slide-in Sidebar from the LEFT.
It should include an overlay/backdrop.
Suggested navigation structure:
GENERAL

Home
Lost & Found
Find Matches


REPORT

Report Lost
Report Found
Report Safety


MY ACTIVITY

My Claims
Service Tickets
Notifications

STAFF should receive Staff-specific navigation.
ADMIN should receive Admin-specific navigation.
Normal USER must not see unauthorized Staff/Admin controls.
33. NOTIFICATION BELL
Planned top bar:
🔔

Use REAL notifications data.
Potential behavior:
- unread badge
- latest notifications
- read/unread distinction
- mark as read
Do not display a fake unread count.
Do not assume workflow notification generation exists without verification.
34. PROFILE / ACCOUNT MENU
Planned top-right account control:
User Name ▾

Possible menu content:
- Full Name
- Role
- Profile/Account
- Logout
Do not invent editable Profile fields/routes.
Before implementing Profile Management:
1. inspect profiles
2. inspect existing routes
3. inspect RLS
4. decide which fields USER may update
Known possible profile information includes:
- full_name
- phone
Email is managed by Supabase Auth.
35. LOGOUT
Reuse the existing Logout implementation if it remains valid.
Do not create duplicate sign-out logic in multiple components.
Logout should eventually live naturally inside the Account/Profile menu.
36. GLOBAL FOOTER
A reusable Footer is planned for authenticated application pages.
It may include:
Lost & Found & Safety Incident Reporting System

Campus item recovery and safety reporting service.

Lost & Found | Safety | Support

Walailak University

Do not independently add duplicate footers to every page.
The shared application shell should own the Footer.
37. IMPORTANT APP SHELL WARNING
Do NOT blindly add authenticated navigation to:
app/layout.tsx

without inspecting the route tree.
The root layout also wraps authentication pages.
Auth pages include things such as:
- Login
- Register
- Forgot Password
- Reset Password
These pages should NOT display the authenticated:
- Sidebar
- Notification Bell
- Account menu
Do not create redirect loops by calling requireUser() in the wrong layout.
Inspect the current architecture before implementing App Shell.
38. AUTHENTICATION UI
Authentication is owned separately.
Before changing Auth:
inspect current:
- login
- register
- forgot password
- reset password
- auth callback
A previously identified issue involved unwanted:
Campus Care

branding.
Another previously identified issue involved password recovery needing to preserve the:
/auth/callback

PKCE flow.
These must be RE-VERIFIED against current code before editing.
39. BUSINESS LOGIC VS UI
UI redesigns should NOT casually change business logic.
When asked to improve UI:
preserve:
- queries
- filters
- validation
- role checks
- RLS behavior
- RPC behavior
- Storage access
- privacy restrictions
unless the task specifically requires a business-logic change.
If a UI request requires changing business logic, explain it first.
40. SERVER / CLIENT COMPONENTS
Preserve existing Next.js server/client boundaries.
Do not add:
"use client";

to a Server Component just for convenience.
Only use Client Components when browser state/events genuinely require them.
Keep Supabase server-side access server-side where appropriate.
41. SECURITY
Never expose:
- service_role key
- secret Supabase key
- private credentials
Client code should only use credentials intended for frontend use.
Do not commit .env.local.
Do not log secrets.
Do not weaken RLS.
42. CODE QUALITY
When changing code:
- preserve TypeScript correctness
- avoid unnecessary dependencies
- avoid duplicate components
- avoid duplicated Supabase logic
- avoid duplicated auth logic
- avoid giant unrelated refactors
- keep changes scoped
- preserve existing naming conventions
- keep code readable
Do not rewrite working features just because another implementation looks cleaner.
43. ERROR / EMPTY / LOADING STATES
For user-facing features, consider:
- loading
- empty
- error
- success
- permission restrictions
Do not assume database queries always return rows.
Do not use fake content for empty states.
44. VALIDATION BEFORE COMPLETION
Before saying a task is complete:
1. Review changed files.
2. Run:
git diff --check

3. Run:
npm run build

4. Browser-test affected workflow.
5. If UI changed, check desktop and mobile.
6. Check role restrictions when relevant.
7. Run:
git status

Report:
- files changed
- business logic changes
- route changes
- security/privacy changes
- build result
- anything that still needs manual testing
45. DO NOT AUTO-COMMIT
Unless explicitly requested:
DO NOT automatically:
git add
git commit
git push
git merge

Finish the code and validation first.
Let the user inspect the result.
46. CURRENT INTEGRATION STRATEGY
General intended sequence:
1. Finish Home / Found / Search / Matching UI.
2. Re-check Lost UI.
3. Re-check Claims/Handover UI.
4. Re-check Safety/Tickets UI.
5. Re-check Admin UI.
6. Repair Auth UI separately.
7. Integrate feature UI branches.
8. Create a fresh shared integration branch from the latest main.
9. Build App Shell.
10. Add Hamburger / Sidebar.
11. Add Notification Bell.
12. Add Account/Profile menu.
13. Add Global Footer.
14. Test USER / STAFF / ADMIN.
15. Test responsive UI.
16. Final build and diff inspection.
This sequence is NOT permanent truth.
Always check current Git state first because branches may have changed.
47. CURRENT HOME WORK
Home is being polished on:
ui/found-search-matching

There may be UNCOMMITTED work in:
app/page.tsx

Before touching Home:
git status
git diff -- app/page.tsx

Do NOT reset/discard current Home work.
Current Home design direction includes:
- Welcome Hero
- Safety Highlight
- Quick Actions
- Lost & Found cards
- Safety Report banner
- My Activity
- Recovery & Support
- role shortcuts
The UI should become slightly stronger in color while preserving the earth-tone style.
48. FUTURE APP SHELL BRANCH
After feature UI integration, create a dedicated branch such as:
ui/app-shell

from the THEN-CURRENT main.
Do NOT create it from an outdated branch.
Before creating it:
git checkout main
git pull origin main
git status

Then:
git checkout -b ui/app-shell

Only after verifying the latest integrated application should App Shell work begin.
49. WHEN INFORMATION IS UNCERTAIN
If you encounter something not clearly supported by the repository:
DO NOT GUESS.
Examples:
- unknown RLS behavior
- unknown database column
- unknown route
- unknown role permission
- unknown RPC signature
- unknown notification trigger
- unknown profile edit permission
Instead:
1. inspect relevant code/schema
2. report what is known
3. identify what is not verified
4. propose the safest next step
50. FINAL PRINCIPLE
The objective is not to generate as much code as possible.
The objective is to safely improve an existing multi-member project without:
- breaking teammates' features
- changing requirements accidentally
- weakening privacy
- weakening security
- introducing fake behavior
- causing merge conflicts unnecessarily
Always inspect first.
Then plan.
Then edit.
Then test.
Then review.
Only then commit.