/* OffScript shared behaviour: header, menu, list links, reveals, motion control.
   Built into every OffScript page. No dependencies. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  doc.classList.add("js");

  /* Current page in the navigation. */
  var page = document.body.getAttribute("data-page");
  if (page) document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });

  /* Header: always there (it never hides while you read), a little more compact after the first scroll,
     with a thin red line that shows how far down the page you are. */
  var header = document.querySelector("[data-site-header]");
  var progress = header && header.querySelector(".scroll-progress");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, max = doc.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  /* Coming back with the browser's Back button restores the page from memory: refresh its state. */
  window.addEventListener("pageshow", function () { onScroll(); window.dispatchEvent(new Event("offscript:return")); });
  onScroll();

  /* Menu sheet: a native modal dialog, so focus stays inside and Escape closes it. */
  var menuBtn = document.querySelector(".menu-btn"), menu = document.getElementById("site-menu");
  function closeMenu(restore) {
    if (!menu || !menu.open) return;
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    var done = function () { if (menu.open) menu.close(); if (restore !== false) menuBtn.focus(); };
    if (reduce.matches) done(); else setTimeout(done, 180);
  }
  if (menuBtn && menu && typeof menu.showModal === "function") {
    menuBtn.addEventListener("click", function () {
      if (menu.open) { closeMenu(); return; }
      menu.showModal();
      /* Focus the sheet itself, not the first link, so no focus ring is drawn around the logo on open.
         Tab still moves straight into the links. */
      menu.focus({ preventScroll: true });
      requestAnimationFrame(function () { menu.classList.add("is-open"); });
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
    });
    menu.querySelector(".menu-close").addEventListener("click", function () { closeMenu(); });
    /* Another sheet can close the menu; keep the button and page in step. */
    menu.addEventListener("close", function () { menu.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); });
    menu.addEventListener("cancel", function (e) { e.preventDefault(); closeMenu(); });
    menu.addEventListener("click", function (e) {
      if (e.target === menu) closeMenu();
      else if (e.target.closest("a") && !e.target.closest("[data-os-list],[data-os-board]")) closeMenu(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) closeMenu(false); });
  }

  var UI = window.OffScriptUI;

  /* Connection Board: opens right here. The form starts loading the moment you show interest
     (hover, focus, touch) or when a board button scrolls near, so it is usually ready on open. */
  var board = document.getElementById("os-board");
  if (UI && board) {
    UI.wireSheet(board);
    var frame = board.querySelector("iframe"), started = false;
    function warm() {
      if (started) return;
      started = true;
      frame.addEventListener("load", function () { board.classList.add("is-ready"); });
      frame.src = frame.getAttribute("data-src");
    }
    var triggers = [].slice.call(document.querySelectorAll("[data-os-board]"));
    triggers.forEach(function (t) {
      ["pointerenter", "focus", "touchstart"].forEach(function (ev) { t.addEventListener(ev, warm, { passive: true }); });
    });
    if ("IntersectionObserver" in window) {
      var near = new IntersectionObserver(function (en) {
        if (en.some(function (x) { return x.isIntersecting; })) { near.disconnect(); (window.requestIdleCallback || setTimeout)(warm); }
      }, { rootMargin: "500px 0px" });
      triggers.forEach(function (t) { if (!t.closest("dialog")) near.observe(t); });
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-os-board]");
      if (!t || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      warm();
      if (UI.openSheet(board, t)) e.preventDefault();
    });
    if (location.hash === "#board") { warm(); UI.openSheet(board); }
  }

  /* Prop viewer: tap a prop to see it large, flip through the rest, then take it to the Prop Studio. */
  var viewer = document.getElementById("os-viewer");
  if (UI && viewer) {
    UI.wireSheet(viewer);
    var names = ["Hear me out.", "I'm the friend.", "Who's pitching me?", "My friend is a catch.", "Show me the green flags.", "I brought receipts.", "Pitch accepted.", "The jury is still out.", "I rest my case.", "Make your case."];
    var stage = viewer.querySelector("[data-viewer-stage]"), use = stage.querySelector("use");
    var nameEl = viewer.querySelector(".os-viewer-name"), countEl = viewer.querySelector("[data-viewer-count]"), go = viewer.querySelector("[data-viewer-go]");
    var list = [], at = 0;
    function propOf(a) { var m = /[?&]prop=(\d+)/.exec(a.getAttribute("href") || ""); return m ? Number(m[1]) : 0; }
    function show(i, dir) {
      at = (i + list.length) % list.length;
      var n = list[at];
      var apply = function () {
        use.setAttribute("href", "#prop-" + n);
        nameEl.textContent = names[n - 1];
        countEl.textContent = String(at + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
        go.href = "/events/pitch-night-001/props.html?prop=" + n;
        stage.classList.remove("is-swapping");
      };
      if (!dir || reduce.matches) { apply(); return; }
      stage.style.setProperty("--dir", dir);
      stage.classList.add("is-swapping");
      setTimeout(apply, 160);
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href*="props.html?prop="]');
      if (!a || a.closest("dialog") || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.defaultPrevented) return;
      var n = propOf(a);
      if (!n || !document.getElementById("prop-" + n)) return;
      list = [];
      document.querySelectorAll('a[href*="props.html?prop="]').forEach(function (x) { var k = propOf(x); if (k && list.indexOf(k) < 0 && document.getElementById("prop-" + k)) list.push(k); });
      list.sort(function (p, q) { return p - q; });
      e.preventDefault();
      show(list.indexOf(n));
      UI.openSheet(viewer, a);
    });
    viewer.querySelectorAll("[data-viewer-step]").forEach(function (b) {
      b.addEventListener("click", function () { var d = Number(b.getAttribute("data-viewer-step")); show(at + d, d); });
    });
    viewer.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(at + 1, 1); else if (e.key === "ArrowLeft") show(at - 1, -1);
    });
    var sx = null;
    stage.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    stage.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  }

  /* Gentle entrances. Content is visible without JavaScript and with reduced motion. */
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-in"); });

  /* Looping rails: duplicate the items once so the loop is seamless. The copy is hidden from assistive tech. */
  if (!reduce.matches) document.querySelectorAll("[data-loop]").forEach(function (track) {
    [].slice.call(track.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.querySelectorAll("a,button").forEach(function (el) { el.tabIndex = -1; });
      track.appendChild(copy);
    });
    track.classList.add("is-looping");
  });

  /* One switch pauses every looping animation on the page (WCAG 2.2.2). */
  var toggles = document.querySelectorAll("[data-motion-toggle]");
  function setPaused(paused) {
    doc.classList.toggle("motion-paused", paused);
    toggles.forEach(function (b) {
      b.setAttribute("aria-pressed", String(paused));
      b.querySelector("use").setAttribute("href", paused ? "#i-play" : "#i-pause");
      b.querySelector(".visually-hidden").textContent = paused ? "Play moving text" : "Pause moving text";
    });
    try { localStorage.setItem("offscript-motion-paused", paused ? "1" : "0"); } catch (e) {}
    document.dispatchEvent(new Event("offscript:motionchange"));
  }
  toggles.forEach(function (b) { b.addEventListener("click", function () { setPaused(b.getAttribute("aria-pressed") !== "true"); }); });
  try { if (localStorage.getItem("offscript-motion-paused") === "1") setPaused(true); } catch (e) {}

  /* Only warm Pitch Night when a visitor shows navigation intent and data saving is off. */
  (function(){
    var warmed=false,target="/events/pitch-night-001/";
    function warm(){
      var net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
      if(warmed||location.pathname.indexOf(target)===0||document.hidden||net&&(net.saveData||/2g/.test(net.effectiveType||"")))return;
      warmed=true;
      var link=document.createElement("link");link.rel="prefetch";link.as="document";link.href=target;document.head.appendChild(link);
    }
    function intent(e){
      if(e.target.closest&&e.target.closest('a[href="/events/pitch-night-001/"]'))warm();
    }
    document.addEventListener("pointerover",intent,{passive:true});
    document.addEventListener("focusin",intent);
    document.addEventListener("touchstart",intent,{passive:true});
  })();

})();
