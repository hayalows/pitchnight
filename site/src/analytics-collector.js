/* First-party, privacy-conscious Offscript measurements. No personal form data. */
(() => {
  "use strict";
  if (!globalThis.crypto || !crypto.randomUUID || !globalThis.document) return;
  if (location.pathname.startsWith("/analytics")) return;
  const BASE = "/analytics/api/collect";
  const VISITOR = "offscript-visitor-v1";
  const SESSION = "offscript-session-v1";
  const PAUSE = "offscript-analytics-paused";
  const LEGACY_PAUSE = "myc-analytics-paused";
  const MILESTONES = [10, 30, 60, 180, 300, 600];
  const DAY = () => new Date().toISOString().slice(0, 10);
  const pagePath = location.pathname;
  const safe = value => String(value || "").replace(/[^a-zA-Z0-9_ .:/-]/g,"").slice(0, 80);
  const storage = (kind) => { try {return window[kind]} catch{return null} };
  const local = storage("localStorage"), temporary = storage("sessionStorage");
  const paused = () => navigator.globalPrivacyControl === true ||
    local?.getItem(PAUSE) === "1" || local?.getItem(LEGACY_PAUSE) === "1";
  let visitorId, session;
  function ids() {
    if (paused()) return false;
    if (!visitorId) {
      visitorId = local?.getItem(VISITOR);
      if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        try {local?.setItem(VISITOR,visitorId)} catch {}
      }
    }
    const now = Date.now();
    if (!session || now - Number(session.updatedAt || 0) > 1800000 || session.day !== DAY()) {
      try {session = JSON.parse(temporary?.getItem(SESSION) || "null")} catch {session = null}
      if (!session?.id || session.day !== DAY() || now - Number(session.updatedAt || 0) > 1800000) {
        session = { id: crypto.randomUUID(),day:DAY(),updatedAt:now };
      }
    }
    session.updatedAt = now;
    try {temporary?.setItem(SESSION,JSON.stringify(session))} catch {}
    return true;
  }
  function attribution() {
    let saved = null;
    try {saved=JSON.parse(temporary?.getItem("offscript-attribution-v1") || "null")} catch {}
    if (saved && typeof saved.source === "string") return saved;
    const url=new URLSearchParams(location.search);
    let referral="";
    try {
      const ref=new URL(document.referrer);
      if (ref.hostname !== location.hostname) referral = ref.hostname;
    } catch {}
    const details = {
      source:safe(url.get("utm_source") || referral || "Direct / unknown"),
      campaign:safe(url.get("utm_campaign") || "None")
    };
    try {temporary?.setItem("offscript-attribution-v1",JSON.stringify(details))} catch {}
    return details;
  }
  function track(eventName, milestoneSeconds) {
    if (!ids()) return;
    const payload={eventId:crypto.randomUUID(),visitorId,sessionId:session.id,
      eventName,pagePath,attribution:attribution()};
    if (eventName === "engagement") payload.milestoneSeconds = milestoneSeconds;
    try {
      void fetch(BASE,{method:"POST",headers:{"Content-Type":"application/json"},
        keepalive:true,credentials:"omit",body:JSON.stringify(payload)}).catch(()=>{});
    }catch{}
  }
  const toggle=document.querySelector("[data-offscript-analytics-toggle]");
  if (toggle) {
    const update=()=>{
      toggle.textContent = navigator.globalPrivacyControl === true ? "Tracking paused by your browser" :
        paused() ? "Resume anonymous analytics" : "Pause anonymous analytics";
      toggle.disabled = navigator.globalPrivacyControl === true;
      toggle.setAttribute("aria-pressed",paused()?"true":"false");
    };
    toggle.addEventListener("click",()=>{
      const next=paused()?"0":"1";
      try {local?.setItem(PAUSE,next);local?.setItem(LEGACY_PAUSE,next)} catch {}
      update();
      location.reload();
    });
    update();
  }
  if(paused())return;
  track("page_view");
  if(document.visibilityState === "visible") track("presence");
  let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
  let totalVisible = 0;
  const fired = new Set();
  function progress() {
    const current=totalVisible + (visibleSince===null?0:Math.max(0,performance.now()-visibleSince));
    for (const second of MILESTONES) {
      if (current >= second * 1000 && !fired.has(second)) {
        fired.add(second);track("engagement",second);
      }
    }
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="hidden"){
      if(visibleSince!==null) totalVisible += Math.max(0,performance.now()-visibleSince);
      visibleSince=null;progress();
    }else{
      visibleSince=performance.now();track("presence");
    }
  });
  const milestoneInterval=setInterval(()=>{if(visibleSince!==null&&!paused())progress()},1000);
  const presenceInterval=setInterval(()=>{if(document.visibilityState==="visible"&&!paused())track("presence")},30000);
  window.addEventListener("pagehide",()=>{if(visibleSince!==null)totalVisible += Math.max(0,performance.now()-visibleSince);
    visibleSince=null;progress();clearInterval(milestoneInterval);clearInterval(presenceInterval)});
  document.addEventListener("offscript:signup-success",()=>track("signup_success"));
  document.addEventListener("submit",e=>{
    if(e.target?.matches?.("form[data-signup]") && e.target.checkValidity())track("signup_submit");
  },true);
  document.addEventListener("click",e=>{
    const link=e.target?.closest?.("a,button");
    if(!link)return;
    const href=link.getAttribute("href")||"";
    const action=link.hasAttribute("data-os-list")||link.hasAttribute("data-focus-signup")||href==="#list" ? "signup_open" :
      /forms\.gle|connection.board/i.test(href) ? "board_open" :
      /props\.html|prop.studio/i.test(href) ? "prop_open" :
      /venue-explore\.html/.test(href) ? "venue_open" :
      /\/events\//.test(href) ? "event_open" :
      /share/i.test(link.getAttribute("data-action")||"") ? "share_click" :
      link.closest("header,nav,footer") && href ? "nav_click" : "";
    if(action)track(action);
  },true);
})();
