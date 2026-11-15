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
  let navigateToFullNote = false;

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
  const siteMenu = document.getElementById("site-menu");
  thanksOpeners.forEach(button => button.addEventListener("click", () => {
    // The mobile menu is a native dialog. Close it before opening another.
    if (siteMenu?.open) {
      siteMenu.addEventListener("close", () => {
        window.requestAnimationFrame(() => openThanks(false));
      }, { once: true });
      siteMenu.close();
    } else {
      openThanks(false);
    }
  }));
  thanksClosers.forEach(button => button.addEventListener("click", closeThanks));
  thanks?.addEventListener("click", event => {
    // Native dialog: only a click on the backdrop surface closes it.
    if (event.target === thanks) closeThanks();
  });
  thanks?.addEventListener("close", () => {
    markSeen();
    document.body.classList.toggle("dialog-is-open", !!document.querySelector("dialog[open]"));
    const goToFullNote = navigateToFullNote;
    navigateToFullNote = false;
    if (goToFullNote && note) {
      // Native close() can restore focus. Move it after that restoration so
      // keyboard/screen-reader visitors land on the actual note.
      window.requestAnimationFrame(() => {
        note.setAttribute("tabindex", "-1");
        note.focus({ preventScroll: true });
        note.scrollIntoView({
          block: "start",
          behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth"
        });
      });
    } else if (!automaticOpen && previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
    previousFocus = null;
    automaticOpen = false;
  });
  readFull?.addEventListener("click", event => {
    event.preventDefault();
    if (!note) return;
    navigateToFullNote = true;
    const fullLetter = document.getElementById("team-letter-details");
    if (fullLetter) fullLetter.open = true;
    history.replaceState(null, "", "#thank-you");
    closeThanks();
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

  // One-tap share for the paper thank-you card. No download, name,
  // profile, or server-side rendering. The entire card remains HTML.
  const noteShare = document.getElementById("share-thank-you-note");
  const noteShareStatus = document.getElementById("thank-you-share-status");
  noteShare?.addEventListener("click", async () => {
    const shareUrl = new URL("./#thank-you-card", window.location.href).href;
    const payload = {
      title: "A little note from OffScript",
      text: "Thank you for being part of Pitch Night Edition 001. Beyond the usual. Into connection.",
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        if (noteShareStatus) noteShareStatus.textContent = "Thanks for sharing the note.";
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        if (noteShareStatus) noteShareStatus.textContent = "Link copied. Share it with someone.";
        return;
      }
      const helper = document.createElement("textarea");
      helper.value = shareUrl;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      const copied = document.execCommand?.("copy");
      helper.remove();
      if (noteShareStatus) noteShareStatus.textContent =
        copied ? "Link copied. Share it with someone." : "Use your browser's Share option to send this note.";
    } catch (error) {
      if (error?.name !== "AbortError" && noteShareStatus) {
        noteShareStatus.textContent = "Use your browser's Share option to send this note.";
      }
    }
  });

  // The OffScript Google Form is loaded on a visitor's intent (hover, focus,
  // touch or click). It stays mounted after closing so partial answers survive.
  // Native form submission is still handled by Google's own page.
  const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfELz5R4U2M3oAgBrB2YeeW9jjnyBiV5WQn1IZBV4-_3CA0zg/viewform";
  const boardTriggers = [...document.querySelectorAll("[data-open-board]")];
  const dialog = document.getElementById("event-feedback-dialog");
  const close = document.getElementById("close-event-feedback");
  const iframe = document.getElementById("event-feedback-frame");
  const status = document.getElementById("event-feedback-status");
  const loading = document.getElementById("event-feedback-loading");
  let formUrl = null;
  try {
    const parsed = new URL(FEEDBACK_FORM_URL);
    if (parsed.protocol === "https:" && parsed.hostname === "docs.google.com" &&
        /^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(parsed.pathname)) {
      parsed.searchParams.set("embedded", "true");
      formUrl = parsed.href;
    }
  } catch (_) { /* Keep original external form links working. */ }

  if (formUrl && iframe && dialog && boardTriggers.length) {
    let requested = false;
    let ready = false;
    let lastTrigger = null;
    let slowMessage = 0;

    function setLoading(show) {
      if (loading) loading.hidden = !show;
      if (show && status) status.textContent = "Preparing your Connection Board…";
      else if (status) status.textContent = "";
    }

    function prepareForm() {
      if (requested) return;
      requested = true;
      ready = false;
      // Eager is important: the iframe can be inside a not-yet-open <dialog>.
      // A 'lazy' iframe may wait until after the user opens the dialog.
      iframe.loading = "eager";
      iframe.hidden = false;
      setLoading(true);
      iframe.src = formUrl;
      slowMessage = window.setTimeout(() => {
        if (!ready && status) status.textContent =
          "Still loading? Use Open Full Screen to fill in the form on Google.";
      }, 11000);
    }

    function openBoard(trigger) {
      if (dialog.open) return true;
      if (document.querySelector("dialog[open]")) return false;
      try {
        dialog.showModal();
      } catch (_) {
        return false;
      }
      lastTrigger = trigger;
      document.body.classList.add("dialog-is-open");
      // Show the dialog immediately, without waiting for the iframe network.
      setLoading(!ready);
      prepareForm();
      close?.focus({ preventScroll: true });
      return true;
    }

    // Start loading only once visitors express interest, without requiring the
    // whole third-party form to load with the main page.
    for (const link of boardTriggers) {
      link.addEventListener("pointerenter", prepareForm, { passive: true });
      link.addEventListener("focus", prepareForm);
      link.addEventListener("pointerdown", prepareForm, { passive: true });
      link.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey) return;
        if (siteMenu?.open) {
          event.preventDefault();
          siteMenu.addEventListener("close", () => {
            window.requestAnimationFrame(() => {
              if (!openBoard(link)) window.location.assign(link.href);
            });
          }, { once: true });
          siteMenu.close();
          return;
        }
        if (openBoard(link)) event.preventDefault();
        // If native dialogs are unavailable, the original external link works.
      });
    }

    iframe.addEventListener("load", () => {
      ready = true;
      if (slowMessage) window.clearTimeout(slowMessage);
      setLoading(false);
    });
    iframe.addEventListener("error", () => {
      if (status) status.textContent = "Couldn't load here. Open the form full screen instead.";
      if (loading) loading.hidden = true;
    });
    close?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      // Do not clear iframe.src: that previously erased partially typed answers
      // and caused a full network reload every time the dialog was reopened.
      document.body.classList.toggle("dialog-is-open", !!document.querySelector("dialog[open]"));
      if (lastTrigger?.isConnected && lastTrigger.getClientRects().length) {
        lastTrigger.focus({ preventScroll: true });
      } else {
        boardTriggers.find(link => link.getClientRects().length)?.focus({ preventScroll: true });
      }
    });
  }
})();
