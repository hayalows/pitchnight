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