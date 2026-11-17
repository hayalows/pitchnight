# OffScript Ghana parent website

The public website is https://offscriptgh.com/. Pitch Night Edition 001 is the archive at /events/pitch-night-001/.

## Structure

Edit sources in `site/src/`, then run `node site/build.mjs`. Everything else is generated.

| Source | What it is |
| --- | --- |
| `site/src/index.html` | Home page (hero, story, events, prop wall, sign-up form and its script). |
| `site/src/about.html`, `events.html`, `join.html`, `privacy.html` | Editorial pages. Each sets `<body data-page="…">` so the header marks the current page. |
| `site/src/partials/header.html`, `footer.html` | One header, menu sheet and footer for every OffScript page (`{{HEADER}}`, `{{FOOTER}}`). |
| `site/src/pages.css`, `experience.css` | Shared styles. Home inlines them; other pages load `/offscript.css`. |
| `site/src/site.js` | Shared behaviour (`{{SITE_JS}}`): sticky header, menu dialog, list links, reveals, motion pause. |
| `site/src/props/prop-01.svg` … `prop-10.svg` | The ten Edition 001 props as vectors. Place with `{{PROP_NN}}`; the wall uses `{{PROP_TILES}}`. Each page defines the props it uses once as `<symbol>`s. |
| `site/src/bridge/` | The OffScript family layer the Worker adds to every event page: bar, footer and `bridge.css`. |
| `site/src/logo-paths.json` | Original OffScript vector marks. Do not redraw. |
| `site/src/apple-touch-icon.png` | Home-screen icon made from the red mark. |

Generated: `site/*.html`, `site/offscript.css`, `favicon.svg` and `apple-touch-icon.png` (repository root, so the event origin serves the same red mark), and the constants inside `cloudflare/offscriptgh-site-worker.js`.

### How the event pages join the family

Event pages still come from the Vercel origin. On the way through `offscriptgh.com`, the Worker (`familyLayer`):

- turns the event's own "OffScript / Edition 001" line into a clickable breadcrumb (OffScript / Events / Pitch Night 001); sub-pages get the same breadcrumb as a slim strip. There is no second bar on top;
- replaces the event's own small footers with the one OffScript footer, and adds links home to the end of the event menu;
- points every OffScript logo (`.brand`, `.footer-brand`, `.prop-brand`, `.head-logo`) to `/`;
- removes Google Fonts and loads the self-hosted Anton, Space Grotesk and Instrument Serif instead;
- swaps the favicon for `/favicon.svg` (the red mark) and adds the touch icon.

Links such as "Back to the event" keep pointing inside the event.

### Run it locally

```
node site/build.mjs
node tools/local-worker.mjs 8787      # the Worker, with the event archive served from this checkout
python3 -m http.server 8099 &          # for the home page test
CHROME=/usr/bin/google-chrome python3 tests/offscript_home_e2e.py
CHROME=/usr/bin/google-chrome python3 tests/offscript_family_e2e.py
```

Open http://localhost:8787/ to see the whole site, event pages included.

## Subscriber backend

The form calls \`POST /api/subscribe\` from the same origin with
\`{"email":"name@example.com","source":"offscriptgh-home","consent":true,"company":""}\`.
The server checks origin, content type, size, email and explicit consent. It has an untrusted-input honeypot, a rate limit keyed by a hashed requester identifier and a D1 record keyed by normalised email.

The flow:

1. Store the consent and a two-day confirmation token hash in **Cloudflare D1**. Do not activate the address yet.
2. Send a confirmation request from the verified \`OffScript <hello@offscriptgh.com>\` Resend sender.
3. \`GET /confirm?token=…\` shows a confirmation page without changing any record. The visitor clicks to send \`POST /confirm\`, which checks the hash and expiry, activates the subscriber and sends the welcome. This prevents automatic email scanners from confirming subscriptions.
4. The welcome email includes a signed \`/unsubscribe\` link. GET opens a confirmation page; POST makes the change, preventing mail scanners from unsubscribing someone by opening the link.
5. If an active email is submitted again, return a generic message instead of leaking list membership or resending the welcome.

No message about an announced date or open recruitment is sent or implied. Real subscriber records are stored privately in the D1 database, not in a public Git repository. Subscriber records are not in the separate Vercel analytics database.

## Production configuration

Cloudflare account: Hayalows Ventures. Worker: \`offscriptgh-site\`. D1 database: \`offscript-subscribers\` (binding \`OFFSCRIPT_DB\`).

Worker secrets:
- \`SUBSCRIBE_SIGNING_SECRET\` is generated and stored in Cloudflare.
- \`RESEND_API_KEY\` must be a **sending-access** Resend key restricted to the verified offscriptgh.com domain. It cannot be placed in source control or shared in chat. Configure this in Cloudflare → Workers & Pages → offscriptgh-site → Settings → Variables and Secrets.

The form checks \`GET /api/list-status\` and stays disabled while configuration is incomplete. The backend still validates origin, email and consent before returning HTTP 503 for missing delivery configuration. All bindings and secrets must exist before real signup is opened. Keep this known limitation visible if the key has not been entered. Do not claim real email delivery from a mocked test.

Deploy as a **module Worker** using a multipart script upload with \`main_module: worker.mjs\`, D1 binding and the correct compatibility date. Confirm the Worker still lists its secret bindings after code updates. Deployment from GitHub is **not** automatically connected to Cloudflare at this point: a Git commit alone does not publish.

Run \`node site/build.mjs\` after source edits, review generated changes, and deploy only after validating the main pages, event archive, private analytics access, mobile navigation, consent state, confirmation, welcome and unsubscribe.

## Privacy, audience and delivery

The site collects only an email address, explicit permission and subscription status, plus a hashed rate-limit identifier. Email is delivered through Resend. The privacy page includes contact and removal instructions. Never expose subscriber records publicly. Use the confirmation flow before sending later announcements, and honour unsubscribes.

Real event details remain as recorded for Edition 001. Edition 002 has no announced date or format. The Join Us page is informational, not an active recruitment form.
