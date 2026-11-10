/* Anonymous, low-volume Make Your Case interaction telemetry.
   Never send friend names, form answers, payment data, IP or page text. */
(() => {
  "use strict";
  if (!window.crypto || !window.crypto.randomUUID) return;
  const KEY = "myc-analytics-v1";
  const PAUSE = "myc-analytics-paused";
  const DAY = () => new Date().toISOString().slice(0, 10);
  let paused = navigator.globalPrivacyControl === true;
  try { paused ||= localStorage.getItem(PAUSE) === "1"; } catch (_) {}
  const toggle = document.getElementById("website-measurement-toggle");
  if (toggle && navigator.globalPrivacyControl !== true) {
    const updateToggle = () => { toggle.textContent = paused ? "Resume analytics" : "Pause analytics"; };
    updateToggle();
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      paused = !paused;
      try { localStorage.setItem(PAUSE, paused ? "1" : "0"); } catch (_) {}
      dirty = false;
      updateToggle();
      if (!paused) track("page_view", true);
    });
  }
  const ALLOWED = new Set([
    "page_view", "ticket_open", "form_acknowledged", "payment_link_click",
    "programme_open", "poster_open", "poster_download_click",
    "poster_share_click", "site_share_click", "host_open", "faq_open",
    "registration_form_link", "poster_format_change", "feedback_open", "registration_desk_open",
    "programme_seen", "host_seen", "tickets_seen"
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
  const sameDay = session => session?.startedAt?.slice(0, 10) === DAY();
  let session;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (saved?.id && saved.events && sameDay(saved) && Date.now() - Date.parse(saved.updatedAt) < 30 * 60000) session = saved;
  } catch (_) {}
  function newSession() {
    return {
      version: 2, id: crypto.randomUUID(),
      startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      source, campaign: tidy(query.get("utm_campaign"), "none"),
      device: matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop",
      events: {}
    };
  }
  let dirty = false, timer = null, busy = false;
  let writes = 0, failures = 0;
  const MAX_WRITES_PER_PAGE = 20;
  function saveLocal() {
    try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch (_) {}
  }
  function schedule(delay = 1900) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void flush(); }, delay);
  }
  async function flush() {
    if (paused || !dirty || busy || writes >= MAX_WRITES_PER_PAGE) return;
    busy = true;
    dirty = false;
    writes++;
    // A snapshot is immutable for the duration of this request. Events added
    // during an in-flight request keep dirty=true and trigger another update.
    const pending = session;
    const snapshot = JSON.stringify(pending);
    try {
      const response = await fetch("/api/track", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: snapshot
      });
      if (!response.ok && pending === session) {
        dirty = true;
        failures++;
      } else {
        failures = 0;
      }
    } catch (_) {
      if (pending === session) {
        dirty = true;
        failures++;
      }
    } finally {
      busy = false;
      if (dirty && writes < MAX_WRITES_PER_PAGE && document.visibilityState !== "hidden") {
        // Avoid rapid retry loops on flaky connections.
        schedule(failures ? Math.min(12000, 2500 * Math.pow(2, Math.min(failures, 3))) : 300);
      }
    }
  }
  function track(name, once = false) {
    if (paused || !ALLOWED.has(name)) return;
    if (!sameDay(session) || Date.now() - Date.parse(session.updatedAt) >= 30 * 60000) {
      session = newSession();
      writes = 0;

    }
    if (once && session.events[name]) return;
    const old = Number(session.events[name]) || 0;
    session.events[name] = Math.min(35, old + 1);
    session.updatedAt = new Date().toISOString();
    saveLocal();
    dirty = true;
    schedule(name === "page_view" ? 250 : 1900);
  }
  track("page_view");
  document.addEventListener("click", event => {
    const node = event.target instanceof Element ? event.target : null;
    if (!node) return;
    const mapping = [
      ["[data-registration-trigger]", "ticket_open"],
      ["[data-open-program]", "programme_open"],
      ["[data-open-pass]", "poster_open"],
      ["[data-open-host]", "host_open"],
      [".registration-open-form, .registration-narrow-fallback a", "registration_form_link"],
      ["[data-poster-format][aria-pressed=false]", "poster_format_change"],
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
  document.addEventListener("myc:registration-desk-open", () => track("registration_desk_open"));
  document.querySelectorAll("#faq details, #website-feedback").forEach(details => {
    details.addEventListener("toggle", () => {
      if (details.open) track(details.id === "website-feedback" ? "feedback_open" : "faq_open");
    });
  });
  if ("IntersectionObserver" in window) {
    const sections = { lineup: "programme_seen", host: "host_seen", details: "tickets_seen" };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && document.visibilityState === "visible") track(sections[entry.target.id], true);
      }
    }, { threshold: .25 });
    for (const id of Object.keys(sections)) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
  }

  const feedbackForm = document.getElementById("website-feedback-form");
  let feedbackId = crypto.randomUUID();
  if (feedbackForm) feedbackForm.querySelector("button").disabled = false;
  feedbackForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const button = feedbackForm.querySelector("button");
    if (button.disabled) return;
    const status = document.getElementById("website-feedback-status");
    const data = new FormData(feedbackForm);
    const message = String(data.get("message") || "").trim();
    if (message.length < 5) {
      status.textContent = "Please write at least five characters.";
      return;
    }
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const response = await fetch("/api/track", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "feedback", id: feedbackId, topic: data.get("topic"), rating: Number(data.get("rating")), message })
      });
      if (!response.ok) throw new Error("Feedback request failed");
      feedbackForm.reset();
      feedbackId = crypto.randomUUID();
      status.textContent = "Thanks. Your feedback was sent to the organisers.";
    } catch (_) {
      status.textContent = "Your feedback couldn’t be sent. Your draft is still here. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty) {
      if (timer) clearTimeout(timer);
      timer = null;
      void flush();
    } else if (document.visibilityState === "visible" && dirty && !busy) {
      schedule(300);
    }
  });
  window.addEventListener("pagehide", () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (dirty && !busy) void flush();
  });
})();
