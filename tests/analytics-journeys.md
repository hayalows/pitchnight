# Make Your Case analytics: test-first user journeys

Revision baseline: `07a1fc13387f903a2adf12ef6833e6ffd63354de`.
Target: website owner using private event dashboard. Tracking started 5 Nov 2026.
No Paystack or Google Forms integrations are authorised by this task.

## Failure modes established before implementation

- Source counts and campaign counts are mistakenly compared with event click counts, without matched denominators.
- Untagged campaigns silently disappear from the campaign table.
- A page with zero measurements shows ambiguous blank or misleading values.
- Long 30-day plots lack labels or usable phone interactions.
- A visitor clicks again during an in-flight telemetry request, and the updated record is never sent.
- Rapid exit loses a pending client-side event; no browser implementation can guarantee delivery.
- An invalid/corrupt Blob record contaminates the aggregate.
- A report is truncated by the 400-record scan and still looks complete.
- Organiser-entered numbers appear as automatic or verified transactions.
- A lost/expired admin session reveals data or leaves the interface in a confusing state.
- Mobile tables or filters become inaccessible; keyboard focus disappears.
- Original Off Script logo is replaced by generic art.

## Browser/API journey acceptance checks

| Actor and entry | Action | Observable expected outcome |
| --- | --- | --- |
| Anonymous visitor, public homepage | Load page, click registration, open programme | Public journey works; only anonymous named events are posted; no form answers or names |
| Visitor, same browser tab | Reload page | Page views increase; session identity remains stable |
| Visitor, rapid actions | Click twice while a write is in flight | Latest snapshot eventually sent; no silent stranded pending update |
| Visitor without network | Interact | Public registration and poster still work; tracking failure does not block actions |
| Signed-out visitor, admin URL | Request GET /api/admin | 401, no event or organiser data |
| Signed-out visitor, dashboard | Enter incorrect password | Sign-in error, no dashboard data |
| Organiser, dashboard, 7 days | Load with sample or real data | Daily + source + device + campaign session counts reconcile to same total |
| Organiser, dashboard | Inspect activity counts | Unique sessions and total clicks have separate headings |
| Organiser, dashboard | Switch 7 to 30 days | Every day remains readable, including zero days; labels and values available |
| Organiser, dashboard | View untagged campaign sessions | Explicit Unattributed row; campaign table sums to measured sessions |
| Organiser, dashboard | Report is scan-capped or unreadable | Visible, understandable incomplete-coverage warning |
| Organiser, dashboard | Save organiser numbers | Manual status and timestamp; no assertion of verified payments |
| Organiser, dashboard | Export CSV | Same period, same metric definitions and safe string escaping |
| Organiser, phone and desktop | Load, filter, inspect tables, sign out | No horizontal clipping of essential content, keyboard-visible focus, logout clears private view |

## Verification evidence requirements

Report pass/fail/blocked for each scenario, identify actual revision/environment, keep secrets and privately retrieved data out of public artifacts. Prefer real browser flow and API boundary over isolated unit tests. Do not claim production E2E where only source review or preview HTML fetch was possible.

## Measurement invariants

- Valid browser sessions in window = sum of daily sessions = sum of traffic sources = sum of device sessions = sum of campaign sessions including `none`.
- For each action: sessions that performed it <= measured sessions; click counts can exceed action sessions.
- Untagged campaign sessions = all sessions minus the sessions with an explicit campaign label.
- Organiser-entered figures are independent, never added to website sessions or event counts.
- When record coverage is truncated or incomplete, counts are visibly partial and no derived rate is described as a complete population percentage.
