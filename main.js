/* Pitch Night v1 — small, accessible interactions without a framework. */
(() => {
  "use strict";

  const programmeDialog = document.getElementById("programme-dialog");
  const openers = document.querySelectorAll("[data-open-program]");
  const closer = document.querySelector("[data-close-program]");
  let previousFocus = null;

  function openProgramme() {
    if (!programmeDialog) return;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
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

  // Both displays derive from the same absolute Ghana event time.
  // Resync from Date.now() near each second boundary; never count ticks.
  const showtime = Date.parse("2026-11-13T18:30:00Z"); // Ghana: GMT.
  const dayEl = document.getElementById("days");
  const hourEl = document.getElementById("hours");
  const minEl = document.getElementById("mins");
  const secEl = document.getElementById("secs");
  const heroDayEl = document.getElementById("hero-days");
  const heroHourEl = document.getElementById("hero-hours");
  const heroMinEl = document.getElementById("hero-mins");
  const heroSecEl = document.getElementById("hero-secs");
  const heroTimerEl = document.getElementById("hero-countdown");
  const countdownEl = document.querySelector(".countdown");
  const endedEl = document.getElementById("countdown-ended");
  const pad = n => String(n).padStart(2, "0");
  let countdownTimeout = null;

  function updateCountdown() {
    const totalSeconds = Math.max(0, Math.ceil((showtime - Date.now()) / 1000));
    if (totalSeconds === 0) {
      if (countdownEl) countdownEl.hidden = true;
      if (endedEl) endedEl.hidden = false;
      if (heroTimerEl) {
        heroTimerEl.textContent = "THE NIGHT IS HERE";
        heroTimerEl.setAttribute("aria-label", "Pitch Night has arrived");
      }
      return false;
    }
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const values = [
      [dayEl, days], [hourEl, hours], [minEl, minutes], [secEl, seconds],
      [heroDayEl, days], [heroHourEl, hours], [heroMinEl, minutes], [heroSecEl, seconds]
    ];
    for (const [element, value] of values) {
      if (element) element.textContent = pad(value);
    }
    // Screen readers can query the complete value without hearing every tick.
    const description = days + " days, " + hours + " hours, " +
      minutes + " minutes and " + seconds + " seconds until Pitch Night";
    if (heroTimerEl) heroTimerEl.setAttribute("aria-label", description);
    if (countdownEl) countdownEl.setAttribute("aria-label", description);
    return true;
  }

  function scheduleCountdown() {
    if (countdownTimeout !== null) window.clearTimeout(countdownTimeout);
    countdownTimeout = null;
    if (!updateCountdown() || document.hidden) return;
    countdownTimeout = window.setTimeout(scheduleCountdown, 1015 - (Date.now() % 1000));
  }
  scheduleCountdown();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (countdownTimeout !== null) window.clearTimeout(countdownTimeout);
      countdownTimeout = null;
    } else {
      scheduleCountdown();
    }
  });

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

  if (brandSeal) {
    brandSeal.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const rect = brandSeal.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      brandSeal.style.setProperty("--seal-lean", ((ratio - .5) * 18).toFixed(2) + "deg");
    });
    brandSeal.addEventListener("pointerleave", () => brandSeal.style.removeProperty("--seal-lean"));
    brandSeal.addEventListener("click", () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
      brandSeal.classList.remove("is-popping");
      void brandSeal.offsetWidth;
      brandSeal.classList.add("is-popping");
    });
    brandSeal.addEventListener("animationend", (event) => {
      if (event.animationName === "offscript-pop") brandSeal.classList.remove("is-popping");
    });
  }

  const interactiveStickers = document.querySelectorAll(".sticker[data-open-program]");
  if (window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches) {
    interactiveStickers.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty("--card-x", (x * 8).toFixed(1) + "px");
        card.style.setProperty("--card-y", (y * 5 - 7).toFixed(1) + "px");
        card.style.setProperty("--card-r", (x * 3).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--card-x");
        card.style.removeProperty("--card-y");
        card.style.removeProperty("--card-r");
      });
    });
  }

  // Gentle one-time section reveals. Visible by default if JS or IO is unavailable.
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const entranceTargets = document.querySelectorAll(
      "#about .section-heading, #about .about-copy, #about .sticker, " +
      "#lineup .section-heading, #lineup .programme-teaser, " +
      "#host .host-visual, #host .host-copy, " +
      "#details .ticket-shell, #faq .faq-list, .last-call-copy, .last-call-action"
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
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
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

  // Lightweight cursor accent: native pointer remains visible. Never track
  // on touch, over forms, in dialogs, or for people requesting reduced motion.
  const cursor = document.getElementById("pitch-cursor");
  const cursorMedia = window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (cursor && cursorMedia?.matches) {
    let pendingFrame = 0;
    let latestX = 0;
    let latestY = 0;
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("dialog, input, textarea, select, [contenteditable]")) {
        cursor.classList.remove("is-visible");
        return;
      }
      latestX = event.clientX;
      latestY = event.clientY;
      cursor.classList.add("is-visible");
      cursor.classList.toggle("is-over-action", Boolean(target?.closest("a, button, summary")));
      if (!pendingFrame) pendingFrame = requestAnimationFrame(() => {
        cursor.style.setProperty("--cursor-x", latestX + "px");
        cursor.style.setProperty("--cursor-y", latestY + "px");
        pendingFrame = 0;
      });
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
    window.addEventListener("blur", () => cursor.classList.remove("is-visible"));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cursor.classList.remove("is-visible");
    });
  }

})();