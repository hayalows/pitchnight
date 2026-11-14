/* OffScript Pitch Night Edition 001, post-event notes.
   First visit shows a dismissible thank-you once per browser.
   Future feedback is gated until the organisers provide a real Google Forms URL.
   No automatic requests to the feedback provider, and no booking flow. */
(() => {
  "use strict";
  const thanks = document.getElementById("thank-you-dialog");
  const thanksOpeners = [...document.querySelectorAll("[data-open-thanks]")];
  const thanksClosers = [...document.querySelectorAll("[data-close-thanks]")];
  const readFull = document.querySelector("[data-read-full-thanks]");
  const note = document.getElementById("thank-you");
  const storageKey = "offscript-pitch-night-001-thanks-seen";
  let previousFocus = null;
  let automaticOpen = false;
  let closedOnce = false;

  function hasSeen() {
    try { return window.localStorage.getItem(storageKey) === "yes"; }
    catch (_) { return closedOnce; }
  }
  function markSeen() {
    closedOnce = true;
    try { window.localStorage.setItem(storageKey, "yes"); }
    catch (_) { /* private browsing may block storage; still works in this page */ }
  }
  function openThanks(auto = false) {
    if (!thanks || thanks.open || typeof thanks.showModal !== "function") return;
    // Never overlay another open dialog or interrupt a deep link.
    if (document.querySelector("dialog[open]")) return;
    automaticOpen = auto;
    previousFocus = auto ? null : document.activeElement;
    try {
      thanks.showModal();
    } catch (_) {
      return;
    }
    document.body.classList.add("dialog-is-open");
    thanks.querySelector("[data-close-thanks]")?.focus();
  }
  function closeThanks() {
    if (thanks?.open) thanks.close();
  }
  thanksOpeners.forEach(button => button.addEventListener("click", () => openThanks()));
  thanksClosers.forEach(button => button.addEventListener("click", closeThanks));
  thanks?.addEventListener("click", event => {
    // Native dialog: only a click on the backdrop surface closes it.
    if (event.target === thanks) closeThanks();
  });
  thanks?.addEventListener("close", () => {
    markSeen();
    document.body.classList.toggle("dialog-is-open", !!document.querySelector("dialog[open]"));
    if (!automaticOpen && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
    automaticOpen = false;
  });
  readFull?.addEventListener("click", event => {
    event.preventDefault();
    if (!note) return;
    closeThanks();
    history.replaceState(null, "", "#thank-you");
    note.setAttribute("tabindex", "-1");
    note.focus({ preventScroll: true });
    note.scrollIntoView({
      block: "start",
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth"
    });
  });
  function maybeShowWelcome() {
    if (!thanks || hasSeen() || window.location.hash || window.location.search) return;
    if (document.visibilityState !== "visible") return;
    if (document.querySelector("dialog[open]")) return;
    openThanks(true);
  }
  if (thanks) {
    // Let the first page render and settle before showing a one-time welcome.
    if (document.readyState === "complete") window.setTimeout(maybeShowWelcome, 650);
    else window.addEventListener("load", () => window.setTimeout(maybeShowWelcome, 650), { once: true });
  }

  // Future Connection Board integration: set this to a real published Google
  // Forms viewform URL after the team provides one. Until then there is no
  // visible feedback action, iframe request or invented completion state.
  const FEEDBACK_FORM_URL = "";
  const trigger = document.getElementById("open-event-feedback");
  const soon = document.getElementById("event-feedback-soon");
  const dialog = document.getElementById("event-feedback-dialog");
  const close = document.getElementById("close-event-feedback");
  const iframe = document.getElementById("event-feedback-frame");
  const status = document.getElementById("event-feedback-status");
  let formUrl = null;
  try {
    if (FEEDBACK_FORM_URL) {
      const parsed = new URL(FEEDBACK_FORM_URL);
      if (parsed.protocol === "https:" && parsed.hostname === "docs.google.com" &&
          /^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(parsed.pathname)) {
        parsed.searchParams.set("embedded", "true");
        formUrl = parsed.href;
      }
    }
  } catch (_) { /* Never expose an invalid or unapproved link. */ }
  if (formUrl && trigger && dialog && iframe) {
    trigger.hidden = false;
    if (soon) soon.hidden = true;
    trigger.addEventListener("click", () => {
      if (document.querySelector("dialog[open]")) return;
      status.textContent = "Loading the Connection Board…";
      iframe.src = formUrl;
      iframe.hidden = false;
      dialog.showModal();
      document.body.classList.add("dialog-is-open");
      close?.focus();
    });
    iframe.addEventListener("load", () => { if (dialog.open) status.textContent = ""; });
    close?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      iframe.removeAttribute("src");
      iframe.hidden = true;
      status.textContent = "";
      document.body.classList.toggle("dialog-is-open", !!document.querySelector("dialog[open]"));
      trigger.focus({ preventScroll: true });
    });
  }
})();
