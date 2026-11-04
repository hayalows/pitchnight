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

  const showtime = new Date("2026-11-13T18:30:00Z").getTime(); // Ghana is UTC+0.
  const dayEl = document.getElementById("days");
  const hourEl = document.getElementById("hours");
  const minEl = document.getElementById("mins");
  const heroDayEl = document.getElementById("hero-days");
  const heroHourEl = document.getElementById("hero-hours");
  const heroMinEl = document.getElementById("hero-mins");
  const heroTimerEl = document.getElementById("hero-countdown");
  const countdownEl = document.querySelector(".countdown");
  const endedEl = document.getElementById("countdown-ended");

  function updateCountdown() {
    let remaining = showtime - Date.now();
    if (remaining <= 0) {
      if (countdownEl) countdownEl.hidden = true;
      if (endedEl) endedEl.hidden = false;
      if (heroTimerEl) {
        heroTimerEl.textContent = "THE NIGHT IS HERE";
        heroTimerEl.setAttribute("aria-label", "The Pitch Night event date has arrived");
      }
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
    if (heroDayEl) heroDayEl.textContent = String(day).padStart(2, "0");
    if (heroHourEl) heroHourEl.textContent = String(hours).padStart(2, "0");
    if (heroMinEl) heroMinEl.textContent = String(minutes).padStart(2, "0");
    if (heroTimerEl) heroTimerEl.setAttribute("aria-label", day + " days, " + hours + " hours and " + minutes + " minutes until Pitch Night");
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

  // Personal poster maker: local canvas only. It is intentionally not wired to
  // the registration form, so it cannot impersonate a confirmed paid ticket.
  const passDialog = document.getElementById("pass-dialog");
  const passOpeners = document.querySelectorAll("[data-open-pass]");
  const passClose = document.querySelector("[data-close-pass]");
  const passName = document.getElementById("pass-name");
  const passCanvas = document.getElementById("pass-canvas");
  const passDownload = document.getElementById("pass-download");
  const passShare = document.getElementById("pass-share");
  const passFeedback = document.getElementById("pass-feedback");
  const passCtx = passCanvas?.getContext("2d");
  let passPreviousFocus = null;
  let passDrawFrame = 0;

  function passNameText() {
    return (passName?.value || "").trim().replace(/\s+/g, " ").slice(0, 40);
  }

  function showPassFeedback(message) {
    if (passFeedback) passFeedback.textContent = message;
  }

  function drawPassPoster() {
    if (!passCtx || !passCanvas) return;
    const ctx = passCtx;
    const name = passNameText().toLocaleUpperCase() || "YOUR NAME";
    const nameEntered = Boolean(passNameText());
    const W = 1080, H = 1350;
    const ink = "#171717", blue = "#1036af", red = "#f03d2f";
    const cream = "#faf4e7", yellow = "#ffd63b", mint = "#aeef9d";
    const display = '"Anton", Impact, "Arial Narrow", sans-serif';
    const body = '"Space Grotesk", Arial, sans-serif';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cream;
    ctx.fillRect(0, 0, W, H);

    // Printed paper, border, and tiny registration marks.
    ctx.strokeStyle = "rgba(16,54,175,.07)";
    ctx.lineWidth = 1;
    for (let x = 60; x < W; x += 34) {
      ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x, H - 50); ctx.stroke();
    }
    for (let y = 50; y < H; y += 34) {
      ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 50, y); ctx.stroke();
    }
    ctx.fillStyle = ink; ctx.fillRect(49, 50, 996, 1268);
    ctx.fillStyle = cream; ctx.fillRect(36, 36, 996, 1268);
    ctx.lineWidth = 8; ctx.strokeStyle = ink; ctx.strokeRect(36, 36, 996, 1268);

    ctx.save();
    ctx.translate(106, 103);
    ctx.rotate(-.07);
    ctx.fillStyle = ink;
    ctx.font = '900 62px ' + body;
    ctx.fillText("off!", 0, 0);
    ctx.font = '44px Georgia, serif';
    ctx.fillText("Script", 3, 44);
    ctx.restore();

    ctx.fillStyle = ink;
    ctx.font = '800 22px ' + body;
    ctx.fillText("PRESENTS", 327, 128);
    ctx.fillText("PITCH NIGHT", 327, 164);
    ctx.fillStyle = yellow;
    ctx.fillRect(776, 78, 213, 106);
    ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.strokeRect(776, 78, 213, 106);
    ctx.fillStyle = ink;
    ctx.font = '800 25px ' + body;
    ctx.fillText("EDITION 001", 793, 121);
    ctx.fillText("13 NOV 2026", 793, 158);
    ctx.lineWidth = 5; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.moveTo(86, 216); ctx.lineTo(984, 216); ctx.stroke();

    ctx.fillStyle = blue;
    ctx.font = '218px ' + display;
    ctx.fillText("MAKE", 82, 436);
    ctx.fillStyle = ink;
    ctx.fillText("YOUR", 82, 648);

    // Hand-drawn red circle, intentionally imperfect.
    ctx.save();
    ctx.translate(388, 565);
    ctx.rotate(-.11);
    ctx.strokeStyle = red; ctx.lineWidth = 16; ctx.lineCap = "round";
    ctx.beginPath(); ctx.ellipse(0, 0, 331, 95, 0, .08, Math.PI * 2.02); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(-4, 4, 339, 98, -.03, 2.5, 5.2); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = blue; ctx.font = '244px ' + display;
    ctx.fillText("CASE", 82, 869);
    ctx.fillStyle = red; ctx.fillRect(845, 824, 45, 45);

    // Small mint speech sticker to keep the flyer personality.
    ctx.save();
    ctx.translate(753, 355); ctx.rotate(.09);
    ctx.fillStyle = ink; ctx.fillRect(9, 10, 240, 132);
    ctx.fillStyle = mint; ctx.fillRect(0, 0, 240, 132);
    ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.strokeRect(0, 0, 240, 132);
    ctx.fillStyle = ink; ctx.font = '800 20px ' + body;
    ctx.fillText("GOT A FRIEND?", 17, 45);
    ctx.font = '38px ' + display;
    ctx.fillText("TELL THE", 17, 88);
    ctx.fillText("ROOM!", 17, 123);
    ctx.restore();

    // Name plate with adjustable type and a two-line fallback.
    const boxX = 84, boxY = 913, boxWidth = 912, boxHeight = 246;
    ctx.fillStyle = ink; ctx.fillRect(boxX + 11, boxY + 11, boxWidth, boxHeight);
    ctx.fillStyle = yellow; ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.lineWidth = 6; ctx.strokeStyle = ink;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = ink; ctx.font = '800 26px ' + body;
    ctx.fillText("THIS NIGHT HAS A NAME", boxX + 35, boxY + 49);
    const words = name.split(" ");
    let lines = [name];
    if (words.length > 1) {
      // Choose the most balanced two-line split if one line would get too small.
      ctx.font = '93px ' + display;
      if (ctx.measureText(name).width > boxWidth - 70) {
        let best = null;
        for (let i = 1; i < words.length; i++) {
          const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
          const score = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
          if (!best || score < best.score) best = {lines:[a,b],score};
        }
        if (best) lines = best.lines;
      }
    }
    const maxWidth = boxWidth - 75;
    let fontSize = lines.length === 1 ? 118 : 88;
    while (fontSize > 44) {
      ctx.font = fontSize + 'px ' + display;
      if (lines.every(line => ctx.measureText(line).width <= maxWidth)) break;
      fontSize -= 2;
    }
    ctx.fillStyle = nameEntered ? blue : "rgba(16,54,175,.43)";
    ctx.font = fontSize + 'px ' + display;
    if (lines.length === 1) {
      ctx.fillText(lines[0], boxX + 36, boxY + 177, maxWidth);
    } else {
      ctx.fillText(lines[0], boxX + 36, boxY + 133, maxWidth);
      ctx.fillText(lines[1], boxX + 36, boxY + 221, maxWidth);
    }

    ctx.fillStyle = ink;
    ctx.font = '800 27px ' + body;
    ctx.fillText("FRI 13 NOV 2026", 85, 1225);
    ctx.fillText("6:30 PM GMT", 84, 1265);
    ctx.fillStyle = blue;
    ctx.fillRect(640, 1190, 350, 95);
    ctx.fillStyle = "#fff";
    ctx.font = '800 22px ' + body;
    ctx.fillText("PITCH  •  FUN  •  GAMES", 664, 1228);
    ctx.font = '800 17px ' + body;
    ctx.fillText("SHARE CARD · NOT VALID FOR ENTRY", 652, 1261);

    if (passDownload) passDownload.disabled = !nameEntered;
    if (passShare) passShare.disabled = !nameEntered;
  }

  function queuePassDraw() {
    if (passDrawFrame) window.cancelAnimationFrame(passDrawFrame);
    passDrawFrame = window.requestAnimationFrame(() => {
      passDrawFrame = 0;
      drawPassPoster();
    });
  }

  function openPassMaker(trigger) {
    if (!passDialog || typeof passDialog.showModal !== "function") return;
    passPreviousFocus = trigger || document.activeElement;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
    if (programmeDialog?.open) programmeDialog.close();
    if (registrationDialog?.open) registrationDialog.close();
    passDialog.showModal();
    document.body.classList.add("dialog-is-open");
    drawPassPoster();
    passName?.focus();
    if (document.fonts?.load) {
      Promise.all([document.fonts.load('218px Anton'), document.fonts.load('26px "Space Grotesk"')])
        .then(queuePassDraw).catch(() => {});
    }
  }

  passOpeners.forEach(button => button.addEventListener("click", () => openPassMaker(button)));
  passClose?.addEventListener("click", () => passDialog?.close());
  passDialog?.addEventListener("click", (event) => {
    if (event.target === passDialog) passDialog.close();
  });
  passDialog?.addEventListener("close", () => {
    document.body.classList.toggle("dialog-is-open", Boolean(registrationDialog?.open || programmeDialog?.open));
    passPreviousFocus?.focus?.();
    showPassFeedback("");
  });
  passName?.addEventListener("input", () => {
    showPassFeedback("");
    queuePassDraw();
  });

  function posterBlob() {
    return new Promise(resolve => {
      if (!passCanvas?.toBlob) { resolve(null); return; }
      passCanvas.toBlob(resolve, "image/png");
    });
  }

  passDownload?.addEventListener("click", async () => {
    if (!passNameText() || !passCanvas) return;
    drawPassPoster();
    const blob = await posterBlob();
    if (!blob) {
      showPassFeedback("Could not create the image. Try another browser.");
      return;
    }
    const filename = "pitch-night-" + passNameText().toLowerCase()
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + ".png";
    const objectURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectURL; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectURL), 30000);
    showPassFeedback("PNG prepared. Check Downloads or your browser's save menu.");
  });
  if (passShare && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
    passShare.hidden = false;
    passShare.addEventListener("click", async () => {
      if (!passNameText()) return;
      const blob = await posterBlob();
      if (!blob) return;
      const file = new File([blob], "pitch-night-poster.png", {type:"image/png"});
      if (!navigator.canShare({files:[file]})) {
        showPassFeedback("Use Save My Poster to download the image.");
        return;
      }
      try { await navigator.share({files:[file],title:"Pitch Night: My Poster"}); }
      catch (error) {
        if (error?.name !== "AbortError") showPassFeedback("Sharing was unavailable. Try saving the poster instead.");
      }
    });
  }

  // A direct, shareable route into the studio; name remains local to this page.
  if (new URLSearchParams(window.location.search).get("poster") === "1") {
    openPassMaker(document.querySelector("[data-open-pass]"));
  }

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