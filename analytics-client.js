/* Anonymous, low-volume Make Your Case interaction telemetry.
   Never send friend names, form answers, payment data, IP or page text. */
(() => {
  "use strict";
  if (!window.crypto || !window.crypto.randomUUID) return;
  const KEY = "myc-analytics-v1";
  const ALLOWED = new Set([
    "page_view", "ticket_open", "form_acknowledged", "payment_link_click",
    "programme_open", "poster_open", "poster_download_click",
    "poster_share_click", "site_share_click"
  ]);
  const tidy = (s, fallback) => {
    const v = String(s || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 32);
    return v || fallback;
  };
  const query = new URLSearchParams(location.search);
  let source = "direct";
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.hostname !== location.hostname) source = tidy(ref.hostname, "referral");
  } catch (_) {}
  source = tidy(query.get("utm_source"), source);
  let session;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (saved && saved.id && Date.now() - Date.parse(saved.startedAt) < 24 * 3600000) session = saved;
  } catch (_) {}
  if (!session) {
    session = {
      version: 1, id: crypto.randomUUID(),
      startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      source, campaign: tidy(query.get("utm_campaign"), "none"),
      device: matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop",
      events: {}
    };
  }
  let dirty = false, timer = null, busy = false;
  let writes = 0;
  function saveLocal() {
    try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch (_) {}
  }
  async function flush() {
    if (!dirty || busy || writes >= 12) return;
    busy = true;
    dirty = false;
    writes++;
    try {
      const response = await fetch("/api/track", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session)
      });
      if (!response.ok) dirty = true;
    } catch (_) { dirty = true; }
    finally { busy = false; }
  }
  function track(name) {
    if (!ALLOWED.has(name)) return;
    const old = Number(session.events[name]) || 0;
    session.events[name] = Math.min(35, old + 1);
    session.updatedAt = new Date().toISOString();
    saveLocal();
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 1800);
  }
  track("page_view");
  document.addEventListener("click", event => {
    const node = event.target instanceof Element ? event.target : null;
    if (!node) return;
    const mapping = [
      ["[data-registration-trigger]", "ticket_open"],
      ["[data-open-program]", "programme_open"],
      ["[data-open-pass]", "poster_open"],
      ["#pass-download", "poster_download_click"],
      ["#pass-share", "poster_share_click"],
      ["#share-button", "site_share_click"],
      ["#registration-pay", "payment_link_click"]
    ];
    for (const [selector, name] of mapping) {
      const target = node.closest(selector);
      if (target) {
        if (target.disabled || target.getAttribute("aria-disabled") === "true") return;
        track(name);
        return;
      }
    }
  }, { capture: true, passive: true });
  const ack = document.getElementById("registration-submitted");
  ack?.addEventListener("change", () => { if (ack.checked) track("form_acknowledged"); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty) {
      clearTimeout(timer);
      void flush();
    }
  });
})();
