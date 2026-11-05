# Make Your Case: private organiser analytics

This is the lightweight analytics extension for Off Script's Pitch Night website.

## Current production design

- Public website: existing static HTML/CSS/JS, left otherwise unchanged.
- Client: analytics-client.js observes only named interactions and uses a temporary sessionStorage session ID.
- Server: /api/track validates a small JSON snapshot and saves it to a **private** Vercel Blob store.
- Private dashboard: /admin/analytics/, with a password-protected /api/admin API.
- Data: per-session anonymous interaction counts and separate organiser-entered registration/payment totals.
- Dependency: pinned @vercel/blob 2.8.2; no frontend framework and no tracking dependencies.

## Authentication

Set MYC_ADMIN_PASSWORD as an encrypted, production-only Vercel environment variable (at least 24 random characters).
Only the server reads it. Sign-in issues an eight-hour Secure, HttpOnly, SameSite=Strict cookie scoped to /api/admin.
The page HTML is public, but data and editing endpoints require valid authentication. Do not put any password in Git.

BLOB_READ_WRITE_TOKEN is created by connecting a **private** Blob store to the Vercel project.
This token stays on the server. Never publish it or the blob URLs.

## What the numbers mean

- Measured sessions = anonymous browser-tab sessions, not identifiable or deduplicated people.
- Page views = reloads/loads captured in those sessions.
- Ticket opens = clicks on an existing registration CTA, not completed Google Form responses.
- Form acknowledgements = visitors ticking the checkbox, not verified submissions.
- Payment link clicks = visitors opening Paystack, not successful payment.
- Poster download/share clicks = attempted actions, not proof of completed download or delivery.
- Source/campaign = link tags or available referrer; messaging apps sometimes show as direct.
- Reported form responses/paid tickets/gross = organiser-entered totals checked outside this site. No automatic Google Forms/Paystack API reconciliation is claimed.

Do not calculate a true website-visitor-to-payment conversion rate from these sources. The platform cannot join individuals between Google Forms, Paystack and browser sessions.

## Campaign links

Use ordinary link tags, e.g.:

https://makeyourcase.vercel.app/?utm_source=whatsapp&utm_campaign=november

The client stores only a sanitised source and campaign label, along with mobile/desktop and event counts.
It never records a poster friend's name, form answers, email, IP address, payment details or free text.

## Reporting and cost controls

Reports are available for the previous 7 or 30 UTC days, matching Ghana time.
The dashboard limits Blob scans to 400 session records per request and displays an explicit partial-data warning when it cannot report complete coverage.
Each browser session uses one Blob path and overwrites it at most 12 times per page lifetime (debounced).
This is a bounded, low-volume event implementation, not a large-scale analytics warehouse.

Vercel Hobby Blob includes limited monthly operations. At high traffic or in abusive conditions telemetry may become unavailable.
The public registration and poster flows must remain usable when analytics fails.
For event-scale growth, move to a properly rate-limited database with indexed daily aggregates and audited access rules.

## Data safety and retention

The Blob store is private. No Google Form answers, Paystack transactions, friend names or personal data are imported.
Only the person with organiser access can enter aggregate figures.
Replace the shared password when access changes. Use a dedicated SSO platform for named, audited organiser accounts later.
Do not make a retention or deletion guarantee until a cleanup job has been configured and verified.

## Review checklist

1. Public homepage loads and event/registration/poster actions work with and without the tracker.
2. GET /api/admin while signed out returns 401; no figures leak.
3. POST /api/admin with a bad password returns 401.
4. Sign in with the configured password, then GET /api/admin?days=7 returns real data or truthful zeroes.
5. A genuine same-origin page view creates a session record; check the measured session count.
6. The registration CTA increments a ticket-open count, not a verified payment count.
7. Only an authenticated organiser can save reported totals; no personal data is submitted.
8. Export CSV yields only counts, dates and safe campaign labels.
9. Verify phone, desktop, keyboard focus, reduced-motion and no-data states.
10. Confirm production SHA/READY status and the live route, not GitHub merge alone.

### Platform setup

Repository: hayalows/pitchnight
Vercel project: pitchnight (makeyourcase.vercel.app)
Required production env: BLOB_READ_WRITE_TOKEN, MYC_ADMIN_PASSWORD

### Limits of this release

- No historical backfill before the tracker was deployed.
- No verification of Google Form responses or Paystack payments.
- No individual transaction reconciliation, refunds ledger or automatic API import.
- No completed independent production browser E2E test until it is actually run.
