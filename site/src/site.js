/* OffScript shared behaviour: header, menu, list links, reveals, motion control.
   Built into every OffScript page. No dependencies. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  doc.classList.add("js");

  /* Current page in the navigation. */
  var page = document.body.getAttribute("data-page");
  if (page) document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });

  /* Header: compact after the first scroll, hides while reading down on phones, returns on the way up. */
  var header = document.querySelector("[data-site-header]");
  var progress = header && header.querySelector(".scroll-progress");
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, max = doc.scrollHeight - window.innerHeight;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (goingDown && y > 420 && !document.querySelector("dialog[open]") && !header.contains(document.activeElement)) header.classList.add("is-tucked");
      else if (goingUp || y < 120) header.classList.remove("is-tucked");
    }
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    lastY = y;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-tucked"); });

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
      requestAnimationFrame(function () { menu.classList.add("is-open"); });
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
    });
    menu.querySelector(".menu-close").addEventListener("click", function () { closeMenu(); });
    menu.addEventListener("cancel", function (e) { e.preventDefault(); closeMenu(); });
    menu.addEventListener("click", function (e) {
      if (e.target === menu) closeMenu();
      else if (e.target.closest("a")) closeMenu(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) closeMenu(false); });
  }

  /* Every "list" link lands on the sign-up form with the cursor in the field.
     Pages without the form send people to the home page form. */
  var listCard = document.getElementById("list"), email = document.getElementById("email");
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-focus-signup]");
    if (!a || !listCard) return;
    e.preventDefault();
    closeMenu(false);
    listCard.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "center" });
    setTimeout(function () { if (email && !email.disabled) email.focus({ preventScroll: true }); else listCard.focus({ preventScroll: true }); }, reduce.matches ? 0 : 450);
    history.replaceState(null, "", "#list");
  });

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
  }
  toggles.forEach(function (b) { b.addEventListener("click", function () { setPaused(b.getAttribute("aria-pressed") !== "true"); }); });
  try { if (localStorage.getItem("offscript-motion-paused") === "1") setPaused(true); } catch (e) {}
})();
