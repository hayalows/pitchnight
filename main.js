/* Pitch Night v1 — small, accessible interactions without a framework. */
(() => {
  "use strict";

  const programmeDialog = document.getElementById("programme-dialog");
  const openers = document.querySelectorAll("[data-open-program]");
  const closer = document.querySelector("[data-close-program]");
  let previousFocus = null;

  function openProgramme() {
    if (!programmeDialog) return;
    previousFocus = document.activeElement;
    if (typeof programmeDialog.showModal === "function") {
      if (!programmeDialog.open) programmeDialog.showModal();
    } else {
      programmeDialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-is-open");
    closer?.focus();
  }

  function closeProgramme() {
    if (!programmeDialog) return;
    if (typeof programmeDialog.close === "function" && programmeDialog.open) {
      programmeDialog.close();
    } else {
      programmeDialog.removeAttribute("open");
      restoreFocus();
    }
  }

  function restoreFocus() {
    // The ticket desk may already be opening after the programme closes.
    if (registrationDialog?.open) return;
    document.body.classList.remove("dialog-is-open");
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  openers.forEach((el) => el.addEventListener("click", openProgramme));
  closer?.addEventListener("click", closeProgramme);
  programmeDialog?.addEventListener("close", restoreFocus);

  // Clicking the area outside the printed programme closes it.
  programmeDialog?.addEventListener("click", (event) => {
    if (event.target === programmeDialog) closeProgramme();
  });

  const showtime = new Date("2026-11-13T18:30:00Z").getTime(); // Ghana is UTC+0.
  const dayEl = document.getElementById("days");
  const hourEl = document.getElementById("hours");
  const minEl = document.getElementById("mins");
  const countdownEl = document.querySelector(".countdown");
  const endedEl = document.getElementById("countdown-ended");

  function updateCountdown() {
    let remaining = showtime - Date.now();
    if (remaining <= 0) {
      if (countdownEl) countdownEl.hidden = true;
      if (endedEl) endedEl.hidden = false;
      return false;
    }
    const day = Math.floor(remaining / 86400000);
    remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000);

    if (dayEl) dayEl.textContent = String(day).padStart(2, "0");
    if (hourEl) hourEl.textContent = String(hours).padStart(2, "0");
    if (minEl) minEl.textContent = String(minutes).padStart(2, "0");
    if (countdownEl) countdownEl.setAttribute("aria-label", day + " days, " + hours + " hours and " + minutes + " minutes until Pitch Night");
    return true;
  }

  if (updateCountdown()) {
    const timer = window.setInterval(() => {
      if (!updateCountdown()) window.clearInterval(timer);
    }, 30000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateCountdown();
    });
  }


  // Animate the single Off Script brand seal only when it becomes visible.
  const brandSeal = document.querySelector(".about-brand-stamp");
  if (brandSeal) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            brandSeal.classList.add("is-visible");
            observer.disconnect();
            break;
          }
        }
      }, { threshold: 0.35 });
      observer.observe(brandSeal);
    } else {
      brandSeal.classList.add("is-visible");
    }
  }

  // Gentle one-time section reveals. Visible by default if JS or IO is unavailable.
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const entranceTargets = document.querySelectorAll(
      "#about .section-heading, #about .about-copy, #about .sticker, " +
      "#lineup .section-heading, #lineup .programme-teaser, " +
      "#host .host-visual, #host .host-copy, " +
      "#details .ticket-shell, #faq .faq-list"
    );
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -4% 0px" });
    entranceTargets.forEach((node) => {
      // Never conceal content that is already in the first viewport.
      if (node.getBoundingClientRect().top < window.innerHeight * 0.94) return;
      node.classList.add("scroll-lift");
      revealObserver.observe(node);
    });
  }

  // A small interactive pitch rehearsal. Sample copy, not event claims.
  const sampleLines = [
    "“I KNOW SOMEONE YOU SHOULD MEET.”",
    "“HEAR ME OUT. THIS FRIEND IS A CATCH.”",
    "“OKAY, SO HERE'S MY CASE…”"
  ];
  const sampleLine = document.getElementById("v2-speech-text");
  const sampleCounter = document.getElementById("v2-quip-index");
  const sampleButton = document.querySelector("[data-next-quip]");
  let sampleIndex = 0;

  sampleButton?.addEventListener("click", () => {
    sampleIndex = (sampleIndex + 1) % sampleLines.length;
    if (sampleLine) sampleLine.textContent = sampleLines[sampleIndex];
    if (sampleCounter) sampleCounter.textContent = String(sampleIndex + 1).padStart(2, "0") + "/03";
  });


  // Registration ticket desk: same-page Google Forms embed with explicit
  // second-stage Paystack handoff. No attempt is made to inspect the contents
  // of the cross-origin form or to infer payment success.
  const registrationDialog = document.getElementById("registration-dialog");
  const registrationOpeners = document.querySelectorAll("[data-registration-trigger]");
  const registrationCloser = document.querySelector("[data-close-registration]");
  const registrationSubmitted = document.getElementById("registration-submitted");
  const registrationPay = document.getElementById("registration-pay");
  let registrationPreviousFocus = null;
  const registrationFrame = document.querySelector("#registration-dialog .registration-form");
  const registrationFormWrap = document.getElementById("registration-form-wrap");
  const registrationLoading = document.getElementById("registration-loading");
  const registrationLoadingCopy = document.getElementById("registration-loading-copy");
  let formLoadStarted = false;
  let formLoadFinished = false;
  let formSlowNoticeTimer;

  function isNarrowFormScreen() {
    return window.matchMedia?.("(max-width: 355px)")?.matches === true;
  }

  function prepareRegistrationForm() {
    // The native Google Form becomes awkward below 356px; keep its direct-link fallback.
    if (!registrationFrame || formLoadStarted || isNarrowFormScreen()) {
      if (isNarrowFormScreen()) registrationFormWrap?.setAttribute("aria-busy", "false");
      return;
    }
    formLoadStarted = true;
    registrationFrame.addEventListener("load", () => {
      formLoadFinished = true;
      window.clearTimeout(formSlowNoticeTimer);
      if (registrationLoading) registrationLoading.hidden = true;
      registrationFormWrap?.setAttribute("aria-busy", "false");
    }, { once: true });
    registrationFrame.src = registrationFrame.dataset.src;
    // An iframe load event cannot verify that Google's inner form is usable.
    formSlowNoticeTimer = window.setTimeout(() => {
      if (!formLoadFinished && registrationLoadingCopy) {
        registrationLoadingCopy.textContent = "Google is taking longer than usual. You can also open the form directly.";
      }
    }, 8000);
  }

  // Warm up the iframe AFTER the homepage has painted, and only if data saving is off.
  // The form is then often ready before someone taps a ticket button.
  function scheduleFormWarmup() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn?.saveData || /(^|slow-)2g/i.test(conn?.effectiveType || "") || isNarrowFormScreen()) return;
    window.setTimeout(() => {
      if (document.visibilityState === "hidden" || formLoadStarted) return;
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(prepareRegistrationForm, { timeout: 4500 });
      } else {
        prepareRegistrationForm();
      }
    }, 1400);
  }
  if (document.readyState === "complete") scheduleFormWarmup();
  else window.addEventListener("load", scheduleFormWarmup, { once: true });

  function registrationLockScroll() {
    document.body.classList.toggle(
      "dialog-is-open",
      Boolean(registrationDialog?.open || programmeDialog?.open)
    );
  }
  function openRegistration(trigger) {
    if (!registrationDialog || typeof registrationDialog.showModal !== "function") return false;
    registrationPreviousFocus = trigger?.closest?.("#programme-dialog")
      ? document.querySelector(".nav-ticket")
      : (trigger || document.activeElement);
    if (programmeDialog?.open) programmeDialog.close();
    prepareRegistrationForm();
    if (!registrationDialog.open) registrationDialog.showModal();
    registrationLockScroll();
    registrationCloser?.focus();
    return true;
  }
  function closeRegistration() {
    if (registrationDialog?.open) registrationDialog.close();
  }
  registrationOpeners.forEach((link) => {
    link.addEventListener("pointerenter", prepareRegistrationForm, { passive: true });
    link.addEventListener("focus", prepareRegistrationForm, { passive: true });
    link.addEventListener("pointerdown", prepareRegistrationForm, { passive: true });
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!registrationDialog || typeof registrationDialog.showModal !== "function") return;
      event.preventDefault();
      openRegistration(link);
    });
  });
  registrationCloser?.addEventListener("click", closeRegistration);
  registrationDialog?.addEventListener("close", () => {
    registrationLockScroll();
    registrationPreviousFocus?.focus?.();
  });
  registrationDialog?.addEventListener("click", (event) => {
    if (event.target === registrationDialog) closeRegistration();
  });
  const registrationAmountWarning = document.getElementById("registration-amount-warning");
  const registrationStepOne = document.getElementById("registration-step-one");
  const registrationStepTwo = document.getElementById("registration-step-two");

  function syncRegistrationSteps() {
    const submittedByVisitor = Boolean(registrationSubmitted?.checked);
    if (registrationPay) {
      registrationPay.setAttribute("aria-disabled", String(!submittedByVisitor));
      registrationPay.tabIndex = submittedByVisitor ? 0 : -1;
    }
    if (registrationAmountWarning) registrationAmountWarning.hidden = !submittedByVisitor;
    registrationStepOne?.classList.toggle("registration-step--complete", submittedByVisitor);
    registrationStepOne?.classList.toggle("registration-step--current", !submittedByVisitor);
    registrationStepTwo?.classList.toggle("registration-step--current", submittedByVisitor);
    // A checked box means only that the visitor says they submitted the form.
    // Neither Google Forms nor Paystack provides verified status to this site.
  }
  registrationSubmitted?.addEventListener("change", syncRegistrationSteps);
  syncRegistrationSteps();
  registrationPay?.addEventListener("click", (event) => {
    if (!registrationSubmitted?.checked) event.preventDefault();
    // This native Paystack link does not imply a verified payment.
  });

  // A shareable same-site URL can open the ticket desk without a new route.
  if (new URLSearchParams(window.location.search).get("register") === "1") {
    openRegistration(document.querySelector(".nav-ticket"));
  }

  const shareButton = document.getElementById("share-button");
  const shareToast = document.getElementById("share-toast");
  let toastTimer = 0;

  function toast(message) {
    if (!shareToast) return;
    window.clearTimeout(toastTimer);
    shareToast.textContent = message;
    shareToast.classList.add("visible");
    toastTimer = window.setTimeout(() => shareToast.classList.remove("visible"), 3200);
  }

  shareButton?.addEventListener("click", async () => {
    const shareData = {
      title: "Pitch Night: Make Your Case",
      text: "Pitch Night is on Friday 13 November 2026 at 6:30 PM. Entry: GHC 70. Come through!",
      url: window.location.href.split("#")[0],
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
        toast("LINK COPIED. SEND IT TO YOUR PEOPLE!");
        return;
      } catch (_) {
        // Manual share fallback below.
      }
    }
    const link = document.createElement("a");
    link.href = "https://wa.me/?text=" + encodeURIComponent(shareData.text + " " + shareData.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
})();