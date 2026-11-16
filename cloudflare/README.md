# Offscript Ghana | Cloudflare parent website

The brand website is hosted at https://offscriptgh.com/ on the Cloudflare Worker `offscriptgh-site`.

## Website layout

- `/`: the new Offscript Ghana mother site, including About and Events
- `/events/pitch-night-001/`: Offscript Pitch Night Edition 001, the unchanged Make Your Case event archive
- `/events/pitch-night-001/props.html`: event Prop Studio
- `/events/pitch-night-001/venue-explore.html`: venue experience
- `/events/pitch-night-001/#thank-you-card`: thank-you note
- `/api/*`: existing event analytics API, temporarily reverse-proxied to Vercel
- `/admin/analytics/`: existing password-protected organiser dashboard, temporarily reverse-proxied to Vercel

## Deployment state and limitations

As of November 16, 2026, the **Offscript homepage runs in a Cloudflare Worker**, but the event archive's HTML, CSS, JS, images and private analytics are still fetched from the existing production Vercel origin `makeyourcase.vercel.app`. The Worker only accepts the fixed Vercel origin, protects API writes with an Origin check, and rewrites archive paths. This is an **interim Cloudflare front door**, not a fully independent migration. Do not delete or pause the Vercel project yet.

This branch stores the currently deployed Worker source as `cloudflare/offscriptgh-site-worker.js` for auditability. The Worker was deployed through the Cloudflare API. **There is no GitHub-to-Cloudflare automatic deployment configured yet.** Editing this file alone does not change production. Re-deploy through the Cloudflare API or set up Workers Builds before promising automatic changes.

The next technical phase is to move public assets to Cloudflare Workers Static Assets, then adapt `/api/track` and `/api/admin` and copy Vercel Blob sessions, feedback and organiser figures to a supported Cloudflare store (R2 activation is currently pending). Validate private dashboard behaviour, data completeness, and same-origin protections before cutting over. The original Vercel site remains live for rollback.

The new apex domain and `www` use Cloudflare Workers Custom Domains. `www` redirects to the apex. Keep the event archive and homepage navigation separate: the Offscript homepage represents the brand, not an event announcement.
