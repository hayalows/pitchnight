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

## Icons and illustration consistency

The interface uses locally inlined **Lucide** vector icons for arrows, close controls, stars, and asterisk marks. Icon geometry is fixed across Windows, macOS, Android, and iOS. The original Pitch Night character illustration and marker strokes are retained as bespoke inline SVG artwork. No Icons8 Ouch assets have been embedded, so no paid illustration license or external image dependency is required. See `THIRD_PARTY_NOTICES.md` for attribution.

## Official Off Script identity

The website's header, footer, and ticket panel display the official transparent logo at `assets/offscript-logo.png`. It is the exact Git blob from the uploaded PNG with no pixel edits. CSS visually crops the transparent padding. The original uploaded file remains in the repository.

## Logo refinement and motion

The official Off Script logo is proportionally cropped from the original transparent image. Header, footer, and ticket variants use reduced sizes. One animated yellow brand seal appears in the About section, replacing an existing decorative asterisk, with a one-time entrance and subtle periodic sway. Motion respects `prefers-reduced-motion`, and the logo is static if JavaScript is unavailable.

## Mobile composition pass (November 2026)

The phone layout places a mint comic-note in the empty space beside the hero title. The animated Off Script stamp sits inside the About heading's unused area rather than creating an additional content row. Mobile section padding follows a consistent rhythm, the three Pitch/Fun/Games cards are shorter numbered strips, and the host/programme/ticket areas have tighter proportional spacing. Section entrances use one-time IntersectionObserver reveals only when motion preferences allow; the site remains fully visible when JavaScript is off. Registration, programme modal, share actions, and the existing event information are unchanged.

## Embedded registration ticket desk

The existing QR short link resolves to the official Google Form at `https://docs.google.com/forms/d/e/1FAIpQLSeISQIPuQUJdY39OOy-cupp-UQroZf7H2zV5auRe0nt2OAYNA/viewform`. The website's five ticket CTAs now open a native accessible registration dialog containing Google's supported iframe embed (the original QR link remains the no-JavaScript fallback). Visitors fill and submit the form, acknowledge completion themselves, and then follow the separately verified Paystack checkout link `https://paystack.shop/pay/vt_glrjuabf`. Their confirmation checkbox **is not server verification**. The site neither reads form answers nor handles card or mobile-money details. A direct Google Form fallback is always available, and `/?register=1` opens the dialog directly for sharing.

**Operational caution:** The Paystack page currently contains an editable amount field and may show GHS 1 by default. The website warns users to set GHS 70. The organiser should configure a fixed-price checkout before broad promotion and reconcile Google Form submissions with confirmed Paystack transactions. No submission/payment confirmation is claimed in this version.
