# Pitch Night — Make Your Case

A playful, mobile-first event website for **Off Script's Pitch Night: Make Your Case**. The visual design is intentionally based on the official Pitch Night flyer rather than a generic event template: warm paper background, large blue/black display typography, red hand-drawn marks, and yellow/mint/blue poster blocks.

## Event details (from the flyer)
- **Date:** Friday, 13 November 2026
- **Time:** 6:30 PM (GMT, Ghana time)
- **Entry:** GHC 70
- **Venue:** Communicated after registration
- **Flyer question:** "Why should another YSA consider dating your friend?"
- **Registration:** https://hqr.la/68d7f6f7 — decoded from the original flyer QR code. Its destination has **not** been independently verified; check that it is the intended live registration and payment page before publishing.

## What's included in v1
- Responsive flyer-led hero with animated red marker circle around YOUR and a prominent GHC 70 ticket action.
- An original SVG cartoon pitch booth with two characters, playful stickers, and a three-line interactive pitch rehearsal.
- A native accessible programme dialog (Escape to dismiss, focus restored).
- Illustrative programme board. **Provisional only**: activity order and timing await organiser confirmation.
- Host reveal placeholder; no invented host name, image, or biography.
- Ticket visual with registration link and GMT-based countdown.
- Share button with system sharing, clipboard, and WhatsApp fallback.
- FAQs and basic SEO/social metadata.
- Reduced-motion support, keyboard focus styles, clear heading hierarchy, and no user tracking.

## Local preview

There is no build step, package installation, framework, or database. Open \`index.html\` in a browser. For a local HTTP server, run:

\`\`\`bash
python -m http.server 8080
\`\`\`

Then visit \`http://localhost:8080\`.

## Deploy

The root \`index.html\` works on any static hosting provider, including Vercel, Netlify, Cloudflare Pages, or GitHub Pages. For Vercel, import \`hayalows/pitchnight\`, select **Other** as the framework if prompted, leave the build command empty, and set the output directory to the repository root.

## Before public launch

1. Verify the shortened registration URL and payment recipient. The website links out to the existing flyer registration flow; it does **not** collect payments or attendee data directly.
2. Confirm the city/location (not printed on the flyer) and replace the venue placeholder when appropriate.
3. Confirm and publish the actual programme/timing.
4. Replace the host reveal placeholder after the host has been announced.
5. Add a final event social preview image and domain to the Open Graph metadata once a public URL is assigned.

## Structure

\`\`\`
index.html   Semantic page and programme dialogue
styles.css   Design system, layout, responsive styles and motion
main.js      Countdown, programme and sharing interactions
favicon.svg  Event favicon
\`\`\`
