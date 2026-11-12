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
    if (hostDialog?.open) return;
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

  // The host profile follows the programme's native modal pattern.
  // Name and short bio stay on the page even if JavaScript is unavailable.
  const hostDialog = document.getElementById("host-dialog");
  const hostOpeners = document.querySelectorAll("[data-open-host]");
  const hostCloser = document.querySelector("[data-close-host]");
  let hostPreviousFocus = null;

  function openHost() {
    if (!hostDialog) return;
    hostPreviousFocus = document.activeElement;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
    if (typeof hostDialog.showModal === "function") {
      if (!hostDialog.open) hostDialog.showModal();
    } else {
      hostDialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-is-open");
    hostCloser?.focus();
  }

  function closeHost() {
    if (!hostDialog) return;
    if (typeof hostDialog.close === "function" && hostDialog.open) {
      hostDialog.close();
    } else {
      hostDialog.removeAttribute("open");
      restoreHostFocus();
    }
  }

  function restoreHostFocus() {
    document.body.classList.toggle("dialog-is-open", Boolean(programmeDialog?.open));
    hostPreviousFocus?.focus?.();
  }

  hostOpeners.forEach(button => button.addEventListener("click", openHost));
  hostCloser?.addEventListener("click", closeHost);
  hostDialog?.addEventListener("close", restoreHostFocus);
  hostDialog?.addEventListener("click", event => {
    if (event.target === hostDialog) closeHost();
  });

  // The compact menu uses the same native dialog pattern as the event sheets.
  const siteMenu = document.getElementById("site-menu");
  const menuTrigger = document.querySelector(".menu-trigger");
  const menuClose = document.querySelector(".site-menu-close");
  if (siteMenu && menuTrigger && typeof siteMenu.showModal === "function") {
    menuTrigger.hidden = false;
    menuTrigger.addEventListener("click", () => {
      document.getElementById("pitch-cursor")?.classList.remove("is-visible");
      siteMenu.showModal();
      document.body.classList.add("dialog-is-open");
      menuTrigger.setAttribute("aria-expanded", "true");
      menuClose?.focus();
    });
    menuClose?.addEventListener("click", () => siteMenu.close());
    let menuDestination = null;
    siteMenu.addEventListener("click", (event) => {
      if (event.target === siteMenu) siteMenu.close();
      const link = event.target.closest("a[href^='#']");
      if (link) {
        event.preventDefault();
        menuDestination = document.getElementById(link.hash.slice(1));
        history.replaceState(null, "", link.hash);
        siteMenu.close();
      }
    });
    siteMenu.addEventListener("close", () => {
      menuTrigger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("dialog-is-open");
      if (menuDestination) {
        const target = menuDestination;
        menuDestination = null;
        requestAnimationFrame(() => {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          window.scrollTo({ top: Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY)), behavior: "instant" });
        });
      } else {
        menuTrigger.focus({ preventScroll: true });
      }
    });
    // Show the current area without changing what the button does.
    const menuContext = menuTrigger.querySelector(".menu-context");
    const areas = [
      ["top", "PITCH NIGHT"], ["venue", "VENUE"], ["about", "THE IDEA"],
      ["lineup", "PROGRAMME"], ["host", "THE HOST"],
      ["details", "DETAILS"], ["faq", "FAQ"],
      ["last-call", "THE FINALE"], ["site-footer", ""]
    ].map(([id, label]) => ({ element: document.getElementById(id) || document.querySelector("." + id), label }))
     .filter(area => area.element);
    let menuUpdatePending = false;
    function updateMenuContext() {
      menuUpdatePending = false;
      const readingLine = window.innerHeight * 0.35;
      let current = areas[0];
      for (const area of areas) {
        if (area.element.getBoundingClientRect().top <= readingLine) current = area;
      }
      // At the bottom the footer may be too short to reach the reading line.
      // Keep the button useful there without mislabelling it as tickets.
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      const label = atBottom ? "" : (current?.label || "");
      if (menuContext && menuContext.textContent !== label) menuContext.textContent = label;
      menuTrigger.classList.toggle("menu-no-context", !label);
      siteMenu.querySelectorAll("nav a[href^='#']").forEach(link => {
        if (current && link.hash === "#" + current.element.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    function scheduleMenuContext() {
      if (!menuUpdatePending) {
        menuUpdatePending = true;
        requestAnimationFrame(updateMenuContext);
      }
    }
    updateMenuContext();
    window.addEventListener("scroll", scheduleMenuContext, { passive: true });
    window.addEventListener("resize", scheduleMenuContext);

    // A small movement threshold avoids flicker from touch jitter and trackpads.
    let directionAnchor = Math.max(0, window.scrollY);
    window.addEventListener("scroll", () => {
      const y = Math.max(0, window.scrollY);
      if (!menuTrigger.classList.contains("menu-trigger-floating") || siteMenu.open) {
        directionAnchor = y;
        menuTrigger.classList.remove("menu-scroll-hidden");
        return;
      }
      const delta = y - directionAnchor;
      if (Math.abs(delta) < 24) return;
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 12;
      const focused = document.activeElement === menuTrigger;
      menuTrigger.classList.toggle("menu-scroll-hidden", delta > 0 && !atBottom && !focused);
      directionAnchor = y;
    }, { passive: true });
    menuTrigger.addEventListener("focus", () => menuTrigger.classList.remove("menu-scroll-hidden"));

    // Keep the labelled menu within reach after the original header leaves view.
    const header = document.querySelector(".site-header");
    if (header && "IntersectionObserver" in window) {
      const marker = document.createElement("div");
      marker.setAttribute("aria-hidden", "true");
      header.after(marker);
      new IntersectionObserver(entries => {
        const floating = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        menuTrigger.classList.toggle("menu-trigger-floating", floating);
        if (!floating) menuTrigger.classList.remove("menu-scroll-hidden");
      }).observe(marker);
    }

  }

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
      "#host .host-copy, " +
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


  // The website's registration and checkout are closed for this event.
  // Old shared ?register=1 links now show the closed booking status in event details.
  if (new URLSearchParams(window.location.search).get("register") === "1") {
    const details = document.getElementById("details");
    history.replaceState(null, "", window.location.pathname + "#details");
    const showStatus = () => {
      if (!details) return;
      details.setAttribute("tabindex", "-1");
      details.focus({ preventScroll: true });
      details.scrollIntoView({ block: "start", behavior: "instant" });
    };
    if (document.readyState === "complete") showStatus();
    else window.addEventListener("load", showStatus, { once: true });
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
      text: "Pitch Night: Friday 13 November 2026, 6:30 PM at Digital 360 Studio, Haatso, Accra. Online registration is closed.",
      url: window.location.origin + window.location.pathname + "#venue",
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
