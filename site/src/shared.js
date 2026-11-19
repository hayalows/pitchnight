/* OffScript shared behaviour: sheets, the email list, the footer logo, back to top.
   Runs on every OffScript page and, through the Worker, on every event page. No dependencies. */
(function () {
  if (window.OffScriptUI) return;
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  doc.classList.add("js");


  /* ---------- Shared sheet and page scroll controller ---------- */
  var closeTimers=new WeakMap(),sheetOpeners=new WeakMap(),lockedY=null,savedStyles=null;
  function syncScrollLock(){
    var modal=!!document.querySelector("dialog[open]"),body=document.body;
    if(modal&&lockedY===null){
      lockedY=window.scrollY;
      savedStyles={htmlOverflow:doc.style.overflow,htmlOverscroll:doc.style.overscrollBehavior,
        position:body.style.position,top:body.style.top,left:body.style.left,
        right:body.style.right,width:body.style.width,overflow:body.style.overflow};
      doc.style.overflow="hidden";doc.style.overscrollBehavior="none";
      body.style.position="fixed";body.style.top="-"+lockedY+"px";
      body.style.left="0";body.style.right="0";body.style.width="100%";
      body.style.overflow="hidden";body.classList.add("os-scroll-locked");
    }else if(!modal&&lockedY!==null){
      var y=lockedY,p=savedStyles;lockedY=null;savedStyles=null;
      doc.style.overflow=p.htmlOverflow;doc.style.overscrollBehavior=p.htmlOverscroll;
      body.style.position=p.position;body.style.top=p.top;body.style.left=p.left;
      body.style.right=p.right;body.style.width=p.width;body.style.overflow=p.overflow;
      body.classList.remove("os-scroll-locked");
      window.scrollTo({top:y,behavior:"instant"});
    }
  }
  new MutationObserver(syncScrollLock).observe(document.body,{subtree:true,attributes:true,attributeFilter:["open"]});
  function cancelClose(d){var t=closeTimers.get(d);if(t){clearTimeout(t);closeTimers.delete(d);}}
  function openSheet(dialog,opener){
    if(!dialog||typeof dialog.showModal!=="function")return false;
    cancelClose(dialog);
    if(dialog.open){dialog.classList.add("is-open");syncScrollLock();return true;}
    [].slice.call(document.querySelectorAll("dialog[open]")).forEach(function(d){
      if(d!==dialog){cancelClose(d);d.classList.remove("is-open");d.close();}
    });
    sheetOpeners.set(dialog,opener||document.activeElement);
    try{dialog.showModal();}catch(e){syncScrollLock();return false;}
    syncScrollLock();
    if(!dialog.hasAttribute("tabindex"))dialog.setAttribute("tabindex","-1");
    dialog.focus({preventScroll:true});document.body.classList.add("os-sheet-open");
    requestAnimationFrame(function(){if(dialog.open)requestAnimationFrame(function(){if(dialog.open)dialog.classList.add("is-open");});});
    dialog.dispatchEvent(new Event("os:open"));return true;
  }
  function closeSheet(dialog){
    if(!dialog||!dialog.open)return;
    cancelClose(dialog);dialog.classList.remove("is-open");
    function finish(){
      closeTimers.delete(dialog);
      if(!dialog.open||dialog.classList.contains("is-open"))return;
      dialog.close();document.body.classList.toggle("os-sheet-open",!!document.querySelector("dialog.os-sheet[open]"));
      syncScrollLock();
      var opener=sheetOpeners.get(dialog);sheetOpeners.delete(dialog);
      if(opener&&opener.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
    }
    if(reduce.matches)finish();else closeTimers.set(dialog,setTimeout(finish,240));
  }
  function wireSheet(dialog){
    if(!dialog||dialog.dataset.wired)return;
    dialog.dataset.wired="1";
    dialog.addEventListener("close",function(){cancelClose(dialog);dialog.classList.remove("is-open");syncScrollLock();});
    dialog.addEventListener("cancel",function(e){e.preventDefault();closeSheet(dialog);});
    dialog.addEventListener("click",function(e){if(e.target===dialog||e.target.closest("[data-os-close]"))closeSheet(dialog);});
    /* Only the grip may dismiss a phone sheet. Form contents remain scrollable. */
    var card=dialog.querySelector(".os-sheet-card"),grip=card&&card.querySelector(".os-sheet-grip"),y0=null,dy=0;
    if(grip){
      grip.addEventListener("touchstart",function(e){if(innerWidth<=640&&e.touches.length===1){y0=e.touches[0].clientY;dy=0;}},{passive:true});
      grip.addEventListener("touchmove",function(e){
        if(y0===null||e.touches.length!==1)return;
        dy=Math.max(0,e.touches[0].clientY-y0);
        if(dy>8){e.preventDefault();card.style.transition="none";card.style.transform="translateY("+dy+"px)";}
      },{passive:false});
      function finishDrag(){
        if(y0===null)return;
        card.style.transition="";card.style.transform="";
        if(dy>110)closeSheet(dialog);y0=null;dy=0;
      }
      grip.addEventListener("touchend",finishDrag);
      grip.addEventListener("touchcancel",finishDrag);
    }
  }

  /* ---------- The email list ---------- */
  var listSheet = document.getElementById("os-list");
  wireSheet(listSheet);
  var status = null;
  function listStatus() {
    if (!status) status = fetch("/api/list-status", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { open: false }; })
      .then(function (d) { return !!d.open; }, function () { return false; });
    return status;
  }
  function bindSignup(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = "1";
    var email = form.querySelector('[name="email"]'), consent = form.querySelector('[name="consent"]');
    var trap = form.querySelector('[name="company"]'), msg = form.querySelector(".os-msg,.form-msg");
    var submit = form.querySelector('button[type="submit"]'), label = submit && (submit.querySelector("span") || submit.firstChild);
    function say(text, kind) { if (!msg) return; msg.textContent = text; msg.className = msg.className.split(" ")[0] + (kind ? " is-" + kind : ""); }
    listStatus().then(function (open) {
      if (open) return;
      email.disabled = true; submit.disabled = true; if (consent) consent.disabled = true;
      form.classList.add("is-closed");
      say("The list isn't open just yet. Please check back soon.", "note");
    });
    email.addEventListener("input", function () { if (email.getAttribute("aria-invalid")) { email.removeAttribute("aria-invalid"); say(""); } });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (trap && trap.value) return;
      var value = email.value.trim();
      if (!value || !email.checkValidity()) {
        email.setAttribute("aria-invalid", "true");
        say(value ? "That email does not look right. Try name@example.com." : "Enter your email to get on the list.", "error");
        email.focus(); return;
      }
      if (consent && !consent.checked) { say("Tick the box if you'd like to receive event emails.", "error"); consent.focus(); return; }
      submit.disabled = true;
      var original = label.textContent; label.textContent = "Saving";
      say("");
      fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: form.getAttribute("data-source") || "offscriptgh-home", consent: !!(consent && consent.checked), company: trap ? trap.value : "" })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (reply) {
          if (r.ok) {
            form.classList.add("is-done");
            say(reply.message || "Check your inbox to confirm your email.", "ok");
            stamp(form);
            /* Every other copy of the form on the page shows the same result. */
            [].slice.call(document.querySelectorAll("form[data-signup]")).forEach(function (f) { if (f !== form) { f.classList.add("is-done"); var m = f.querySelector(".os-msg,.form-msg"); if (m) { m.textContent = reply.message || "Check your inbox to confirm your email."; m.className = m.className.split(" ")[0] + " is-ok"; } } });
          } else if (r.status === 429) say(reply.error || "Too many attempts. Try later.", "error");
          else say(reply.error || "We couldn't save your email right now. Please try again.", "error");
        });
      }).catch(function () { say("You seem to be offline. Check your connection and try again.", "error"); })
        .then(function () { submit.disabled = false; label.textContent = original; });
    });
  }
  /* "Pitch accepted." — prop 07 from the night — lands on the card. Only where the prop is on the page. */
  function stamp(form) {
    if (!document.getElementById("prop-7")) return;
    var host = form.closest(".os-sheet-card,.next-card");
    if (!host || host.querySelector(".os-stamp")) return;
    var s = document.createElement("span");
    s.className = "os-stamp"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<svg viewBox="0 0 720 480" focusable="false"><use href="#prop-7"/></svg>';
    if (host.classList.contains("next-card")) host.appendChild(s); else form.appendChild(s);
  }
  [].slice.call(document.querySelectorAll("form[data-signup]")).forEach(bindSignup);

  /* Every "get on the list" link opens the list where you are. On the home page, when the sign-up card
     is already on screen, the card itself takes focus instead of a sheet covering it. */
  function cardInView(card) {
    if (!card) return false;
    var r = card.getBoundingClientRect();
    return r.top >= 40 && r.bottom <= window.innerHeight + 4 && r.width > 0;
  }
  function openList(opener) {
    var card = document.getElementById("list"), field = card && card.querySelector('[name="email"]');
    if (card && cardInView(card)) {
      /* An open modal menu makes the inline form inert. Close it before moving focus. */
      var activeMenu = document.getElementById("site-menu");
      if (activeMenu && activeMenu.open) activeMenu.close();
      card.classList.remove("is-nudged"); void card.offsetWidth; card.classList.add("is-nudged");
      if (field && !field.disabled) field.focus({ preventScroll: true }); else card.focus({ preventScroll: true });
      return true;
    }
    if (!listSheet) return false;
    var ok = openSheet(listSheet, opener);
    if (ok) setTimeout(function () {
      var f = listSheet.querySelector('[name="email"]');
      /* Phones: no keyboard jump on open; the sheet is the cue. Larger screens: ready to type. */
      if (window.innerWidth > 640 && f && !f.disabled) f.focus({ preventScroll: true });
      else listSheet.focus({ preventScroll: true });
    }, reduce.matches ? 0 : 60);
    return ok;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('[data-os-list],[data-focus-signup],a[href="/#list"],a[href="#list"]');
    if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (openList(a)) e.preventDefault();
  });


  /* Keep deliberate section navigation smooth without animating browser history restoration.
     Modal-menu links stay with their own close-and-navigate logic. */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute("data-os-top")) return;
    var hash = a.getAttribute("href");
    if (!hash || hash.length < 2) return;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (location.hash !== hash) history.pushState(null, "", hash);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduce.matches ? "instant" : "smooth", block: "start" });
  });

  /* ---------- Back to top ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-os-top]");
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    var target = document.querySelector("main,#main") || document.body;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    setTimeout(function () { target.focus({ preventScroll: true }); }, reduce.matches ? 0 : 500);
  });

  /* ---------- The footer logo ---------- */
  [].slice.call(document.querySelectorAll("[data-osf-logo]")).forEach(function (logo) {
    var glyphs = [].slice.call(logo.querySelectorAll(".osf-g"));
    var centres = [], raf = 0, px = 0, py = 0, flipped = false;
    function settle() { logo.classList.add("is-settled"); }
    if ("IntersectionObserver" in window && !reduce.matches) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        logo.classList.add("is-in"); io.disconnect();
        setTimeout(settle, 1300);
      }, { threshold: 0.4 });
      io.observe(logo);
    } else { logo.classList.add("is-in"); settle(); }
    if (reduce.matches) return;
    function measure() {
      centres = glyphs.map(function (g) { var b = g.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, Math.max(b.width, b.height)]; });
    }
    function paint() {
      raf = 0;
      var size = logo.getBoundingClientRect().height || 1;
      glyphs.forEach(function (g, i) {
        var c = centres[i], dx = px - c[0], dy = py - c[1], d = Math.sqrt(dx * dx + dy * dy);
        var pull = Math.max(0, 1 - d / (size * 0.42));
        g.style.setProperty("--ty", (-pull * size * 0.07).toFixed(2) + "px");
        g.style.setProperty("--rot", (pull * (dx > 0 ? -6 : 6)).toFixed(2) + "deg");
        g.style.setProperty("--sc", (1 + pull * 0.08).toFixed(3));
        g.classList.toggle("is-hot", pull > 0.55);
        g.classList.toggle("is-warm", pull > 0.2 && pull <= 0.55);
      });
    }
    function reset() {
      glyphs.forEach(function (g) { g.style.removeProperty("--ty"); g.style.removeProperty("--rot"); g.style.removeProperty("--sc"); g.classList.remove("is-hot", "is-warm"); });
      flipped = false;
    }
    logo.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      measure();
      if (!flipped) { flipped = true; logo.classList.remove("is-flip"); void logo.offsetWidth; logo.classList.add("is-flip"); }
    });
    logo.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !logo.classList.contains("is-settled")) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    logo.addEventListener("pointerleave", reset);
    /* Touch: a tap sends a wave through the letters. A second tap goes home. */
    var armed = 0;
    logo.addEventListener("click", function (e) {
      if (window.matchMedia("(hover: hover)").matches) return;
      if (Date.now() - armed < 1600) return;
      e.preventDefault(); armed = Date.now();
      logo.classList.remove("is-wave"); void logo.offsetWidth; logo.classList.add("is-wave");
    });
    logo.addEventListener("animationend", function (e) {
      if (e.target === glyphs[glyphs.length - 1]) logo.classList.remove("is-wave");
      if (e.target === glyphs[2]) logo.classList.remove("is-flip");
    });
  });

  window.OffScriptUI = { openSheet: openSheet, closeSheet: closeSheet, wireSheet: wireSheet, openList: openList, bindSignup: bindSignup };
})();
