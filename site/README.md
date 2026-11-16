# offscriptgh.com homepage

The Offscript parent-brand homepage, built from the approved Figma redesign
("Board 10 / offscriptgh.com" in the Pitch Night Figma file).

## Files

| Path | What it is |
| --- | --- |
| `site/src/index.html` | Source. Edit this. |
| `site/src/logo-paths.json` | Logo paths traced from the original Offscript mark. The flipped f keeps its exact angle. Do not redraw. |
| `site/fonts/instrument-serif-italic-subset.woff2` | Instrument Serif Italic, Latin subset (SIL OFL, see licence file). Inlined at build time. |
| `site/build.mjs` | Build: `node site/build.mjs` |
| `site/index.html` | Built page. One self-contained file. |
| `cloudflare/offscriptgh-site-worker.js` | The Worker. The build rewrites only its `HOME` constant with the built page. Routing is unchanged. |
| `tests/offscript_home_e2e.py` | 12 end-to-end journeys in a real browser. |

Anton and Space Grotesk still load from `/assets/fonts/`, which the Worker serves from the event origin.

## Deploy (two routes, pick one)

1. **Worker only (simplest).** Run the build, then deploy `cloudflare/offscriptgh-site-worker.js` to the `offscriptgh-site` Worker, the same way it was deployed before. The new page is inside `HOME`.
2. **Serve the file from elsewhere.** Host `site/index.html` and point the Worker's `/` route at it. Keep the `/events/`, `/api/`, `/admin/` and `/assets/` routes as they are.

After deploying, check: `/` shows "Edition 002 is on the way", `/events/pitch-night-001/` still opens the archive, and the Notify me form shows the expected message.

## Back end to build: the sign-up endpoint

The form sends:

```
POST /api/subscribe
Content-Type: application/json
{"email": "name@example.com", "source": "offscriptgh-home"}
```

What the page shows for each response:

| Response | Message |
| --- | --- |
| any 2xx | "You are on the list. We will email you when Edition 002 is set." The field hides. |
| 404, 405, 501 | "The list is not open just yet. Please check back soon." (This is what visitors see until the endpoint exists.) |
| other errors | "We could not save that. Please try again in a moment." |
| network failure | "You seem to be offline. Check your connection and try again." |

Notes for the endpoint:
- Today the Worker forwards `/api/*` to the Vercel origin with an Origin check. Either add `api/subscribe.js` there, or handle `POST /api/subscribe` inside the Worker before the forward.
- Validate the email on the server, rate-limit by IP, and de-duplicate.
- The form has a hidden `company` field as a spam trap. The browser never submits when it is filled. Reject it on the server too if you add it to the payload.
- Store consent: the page promises "One email when the next night is set. No spam."

To use a different URL, change `signupEndpoint` in the `OFFSCRIPT_CONFIG` block near the end of `site/src/index.html`.

## Social and contact links

None are published, so none are invented. Fill `links` in `OFFSCRIPT_CONFIG` (`instagram`, `tiktok`, `whatsapp`, `email`) and rebuild. Each one appears in the footer only when it is set.

## Tests

```
python3 -m http.server 8099 &
python3 tests/offscript_home_e2e.py        # add CHROME=/path/to/chrome to use an installed Chrome
```

Covers: desktop layout and script errors, phone menu (open, Escape, link), list links landing in the field, validation, success payload, 404, 500, offline, spam trap, phone sticky bar timing, keyboard order and focus, reduced motion.
