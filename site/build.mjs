// Builds the Offscript homepage.
//   node site/build.mjs
// Inputs:  site/src/index.html, site/src/logo-paths.json, site/fonts/instrument-serif-italic-subset.woff2
// Outputs: site/index.html (standalone page)
//          cloudflare/offscriptgh-site-worker.js (HOME constant replaced, routing untouched)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = (p, enc = "utf8") => readFileSync(join(root, p), enc);

const paths = JSON.parse(read("site/src/logo-paths.json"));
const font = readFileSync(join(root, "site/fonts/instrument-serif-italic-subset.woff2")).toString("base64");

// Favicon: the flipped f on a Red Pen circle, traced from the original mark.
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` +
  `<circle cx="60" cy="60" r="60" fill="#e8382b"/>` +
  `<g transform="translate(60 60) scale(0.82) translate(-193.8 -108.4)"><path fill="#faf4e7" d="${paths.flip}"/></g></svg>`;
const faviconUri = "data:image/svg+xml," + encodeURIComponent(favicon);

let html = read("site/src/index.html")
  .replaceAll("{{LOGO_STACKED}}", paths.stacked)
  .replaceAll("{{LOGO_OFF}}", paths.off)
  .replaceAll("{{LOGO_FLIP}}", paths.flip)
  .replaceAll("{{FAVICON}}", faviconUri)
  .replaceAll("{{FONT_IS}}", font);

const left = html.match(/\{\{[A-Z_]+\}\}/);
if (left) throw new Error("Unreplaced token: " + left[0]);

writeFileSync(join(root, "site/index.html"), html);

const workerPath = join(root, "cloudflare/offscriptgh-site-worker.js");
const worker = readFileSync(workerPath, "utf8");
const marker = /^const HOME=.*;\n/m;
if (!marker.test(worker)) throw new Error("Could not find the HOME constant in the worker");
writeFileSync(workerPath, worker.replace(marker, () => "const HOME=" + JSON.stringify(html) + ";\n"));

console.log(`site/index.html ${(html.length / 1024).toFixed(1)} KB; worker HOME updated`);
