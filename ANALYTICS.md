# Make Your Case organiser analytics

The private dashboard is at `/admin/analytics/`. Vercel project `pitchnight` uses the existing private Blob store and the server-only `BLOB_READ_WRITE_TOKEN` and `MYC_ADMIN_PASSWORD` variables. The API requires an authenticated cookie before returning a report or updating figures.

## What the dashboard counts

| Measure | Source and unit |
| --- | --- |
| Recorded sessions | One anonymous browser-tab session, renewed after 30 minutes of inactivity or at the next interaction on a new Ghana calendar day |
| Page views | Recorded page loads, including reloads |
| Interaction sessions | Recorded sessions that took a named action at least once |
| Events | Recorded actions, including repeats, with each action capped at 35 per session |
| Source and campaign | First recorded link tags or referral hostname for that session. Direct / unknown and No campaign tag remain visible |
| Country | Approximate country from the Vercel request header. Earlier records and missing headers appear as Unknown |
| Screen size | Initial viewport width bucket, split at 700 px |
| Feedback | Voluntary rating, topic and note, stored separately from the session record and excluded from the summary CSV |
| Form responses, paid tickets and gross revenue | Whole-event figures entered by the organiser after checking the external records |

The registration button, desk, external Google Form link, submission checkbox and Paystack link are separate events. The checkbox is self-reported. Google Forms and Paystack completions are outside the website and are represented only through organiser-entered totals. Section impressions record a section entering the viewport by at least 25% in a visible tab.

## Coverage

Reports include the current day and the previous 6 or 29 calendar days in Ghana time. Website actions are grouped by session start. Feedback uses its receipt date. Session files already stored by the previous version remain readable. Country and new actions begin with the new collector. Repeated snapshots merge counts with conditional writes to protect newer values from late updates.

Reporting lists only dates in scope, beginning with the newest. It reads up to 400 session files and 60 feedback files. If a cap is exceeded or records cannot be read, the dashboard reports partial coverage for that section. Breakdowns use the same included-session denominator. Measurements are best effort and can miss visitors who opt out, block scripts, or leave before a request reaches the server.

The collector respects Global Privacy Control and the on-page analytics pause setting. It stores the country code, limited attribution labels, a random session ID, viewport bucket and named event counts. It does not store IP addresses, exact locations, full referrer URLs, form answers, payment details or poster names. The voluntary feedback form asks users to leave personal details out of their messages. Feedback is stored privately and shown to signed-in organisers.

## Release checks

- Public page and registration keep working when tracking fails.
- The signed-out admin API returns 401.
- After sign-in, historical records and new records aggregate together. Sources, campaigns, screen sizes, countries and days sum to recorded sessions.
- Late or repeated snapshots preserve newer recorded actions.
- Submitted feedback appears for its report period and stays out of the CSV.
- Production deployment reaches READY and serves the intended commit.
