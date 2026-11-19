# Offscript analytics (review-only feature)

A dedicated private Next.js dashboard, first-party collector and PostgreSQL reporting model for **offscriptgh.com/analytics/**.

**Review status:** This feature is a proposal. A GitHub PR does not deploy the Cloudflare Worker or create a new database, analytics Vercel project, or production route. Nothing should be advertised as live until the release checklist is complete.

## Source and boundaries

- Dashboard architecture, filtering, engagement milestones, activity view and presence model were adapted from the *public repository* `hayalows/englishchatsession` (English Chat Finder). No changes were made to that repository, and it does not share data with Offscript.
- Visual system uses Offscript's existing warm paper, red mark, ink and yellow. The finder itself remains unchanged.
- The old Pitch Night analytics at `/admin/analytics/` and its private Vercel Blob records remain untouched. Historical data is **not** imported by this PR.
- Event files stay on `makeyourcase.vercel.app`. This PR does not retire, redirect or delete the old event application.
- The public Offscript Worker remains the host for its current pages. The new Next.js app is a separate deployable unit; the Worker forwards only the `/analytics/*` namespace when `OFFSCRIPT_ANALYTICS_ORIGIN` is configured.

## Architecture

Browser -> `/offscript-analytics.js` -> `POST /analytics/api/collect` -> new Neon PostgreSQL database.

Private organiser -> `/analytics/login` -> server-verified signed cookie -> `/analytics/` dashboard -> parameterised SQL reads, aggregate CSV export.

**Data collected:** random browser and session IDs, limited page routes, named action, coarse country/device/browser, source and campaign labels, visible-time milestones, presence heartbeats (every 30s). The active-now window is 90 seconds. No raw IP addresses, emails, form answers, payment details, friendship names or full referrer URLs go into the analytics event table. Signed-in admins can see aggregates, not individual visitor rows.

**Data definitions:** Unique visitor = distinct anonymous browser ID with a page-view in the period. Session = distinct random session ID with a page-view. Actions = named interactions excluding views, presence and engagement. Engaged 60s = sessions that crossed a visible-time milestone; the page timer pauses when hidden. Daily activity may count the same visitor on different days.

**Privacy:** Global Privacy Control and the pause toggle on Offscript's Privacy page stop new collection. The existing event pause preference is also respected. Failing analytics calls never stop page interactions. No data moves from English Chat Finder.

## Local verification

1. `cd analytics && npm ci`
2. `npm run build` and `npm run typecheck`
3. Run `npm run dev` in one terminal, then `npm run test:e2e` in another, **with DATABASE_URL and organiser credentials unset**, to test guarded access and the fail-open public collector.
4. For a populated local dashboard test, create a **separate** Neon database, apply `schema.sql`, set the three private values from `.env.example` only in `.env.local`, then log in at `http://localhost:3000/analytics/login`.
5. To regenerate Offscript HTML and Worker from sources, run `node site/build.mjs` at the repository root. Inspect the generated diff before any deployment.

No production analytics records are fetched by the build or tests. Do not run the SQL against a connected English Chat Finder or Pitch Night database.

## Release checklist (not authorised in this PR)

1. Provision a dedicated Neon database, apply schema and confirm private query access. Use least-privilege database credentials and review database usage/cost.
2. Provision a separate Next.js project with **Root Directory = analytics**, production build `next build`, and add the database, organiser password, and 32+ character session secret as server-only environment variables. Confirm the Next.js app responds at `/analytics/login` on its Vercel hostname.
3. Set `OFFSCRIPT_ANALYTICS_ORIGIN` on Cloudflare Worker `offscriptgh-site` to that exact HTTPS origin (no trailing path or slash). Keep this value out of user-controlled requests.
4. Before any Cloudflare deploy, run `node site/build.mjs`, verify unchanged public routes and event archive behaviour, and inspect the new `/analytics/` and `/offscript-analytics.js` routes. The Worker is manually deployed; GitHub merges do **not** automatically publish it.
5. Add Cloudflare Access in front of organiser dashboard paths and WAF/rate limits for the collector. The collector contains input guards and per-session caps; these do not replace edge abuse protection.
6. Verify 360px / 768px / 1280px browsers, keyboard/Escape/outside-click handling, auth failure, initial no-data state, normal/paused measurement, CSV formula neutralisation, dates and source filters, and expiry/sign-out in a staging environment.
7. Verify retention policy, data-use notice, database backup and an operator runbook; add retention automation as a separate reviewed change. The schema currently holds events until removed.
8. Publish the separate app and Worker only after an explicit release approval. Recheck every major public page and the archived Pitch Night, and confirm production event flows independently.
9. Keep the old Pitch Night reporting system unchanged until a *separate* historical migration plan is approved.

## Known limits

- No live integration or populated staging evidence is included in a code-only PR.
- Active-now is approximate; background/blocked clients may not report.
- Anonymous browser IDs undercount returning people whose storage is cleared or disabled.
- Existing Pitch Night counts should not be added directly to these new unique-visitor figures because the session definitions differ.
- Current reporting queries assume modest event volumes. As traffic grows, add daily rollups and a retention routine.
- The organiser password is a single shared secret. Require Cloudflare Access for production and rotate credentials after access changes.
