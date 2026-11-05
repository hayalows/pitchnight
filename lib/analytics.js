"use strict";
const { put, list, get } = require("@vercel/blob");

const EVENTS = [
  "page_view", "ticket_open", "form_acknowledged", "payment_link_click",
  "programme_open", "poster_open", "poster_download_click",
  "poster_share_click", "site_share_click"
];
const EVENT_SET = new Set(EVENTS);
const MAX_SESSIONS = 400;

function cleanText(input, fallback) {
  if (typeof input !== "string") return fallback;
  const result = input.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 32);
  return result || fallback;
}
function isReasonableDate(input) {
  if (typeof input !== "string") return false;
  const n = Date.parse(input);
  return Number.isFinite(n) && Math.abs(Date.now() - n) < 3 * 86400000;
}
function validateSession(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id || "")) return null;
  if (!isReasonableDate(data.startedAt) || !isReasonableDate(data.updatedAt)) return null;
  if (Date.parse(data.updatedAt) < Date.parse(data.startedAt)) return null;
  if (data.device !== "mobile" && data.device !== "desktop") return null;
  if (!data.events || typeof data.events !== "object" || Array.isArray(data.events)) return null;
  const events = {};
  for (const [name, value] of Object.entries(data.events)) {
    if (!EVENT_SET.has(name) || !Number.isInteger(value) || value < 0 || value > 35) return null;
    events[name] = value;
  }
  if (!events.page_view) return null;
  return {
    version: 1,
    id: data.id.toLowerCase(),
    startedAt: data.startedAt,
    updatedAt: data.updatedAt,
    source: cleanText(data.source, "direct"),
    campaign: cleanText(data.campaign, "none"),
    device: data.device,
    events
  };
}
async function saveSession(session) {
  const date = session.startedAt.slice(0, 10);
  const path = "sessions/" + date + "/" + session.id + ".json";
  await put(path, JSON.stringify(session), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
}
async function readPrivateJSON(path) {
  const blob = await get(path, { access: "private", useCache: false });
  if (!blob || !blob.stream) return null;
  return new Response(blob.stream).json();
}
async function readOrganiserFigures() {
  try { return await readPrivateJSON("organiser/figures.json"); }
  catch (error) {
    if (error && (error.status === 404 || error.statusCode === 404)) return null;
    throw error;
  }
}
async function saveOrganiserFigures(figures) {
  await put("organiser/figures.json", JSON.stringify(figures), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
}
function count(map, name, amount) {
  map[name] = (map[name] || 0) + amount;
}
function validatedStoredSession(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.id || "")) return null;
  if (raw.device !== "mobile" && raw.device !== "desktop") return null;
  if (typeof raw.startedAt !== "string" || !Number.isFinite(Date.parse(raw.startedAt))) return null;
  if (!raw.events || typeof raw.events !== "object" || Array.isArray(raw.events)) return null;
  if (!Number.isInteger(raw.events.page_view) || raw.events.page_view < 1 || raw.events.page_view > 35) return null;
  const events = {};
  for (const [key, value] of Object.entries(raw.events)) {
    if (!EVENT_SET.has(key) || !Number.isInteger(value) || value < 0 || value > 35) return null;
    events[key] = value;
  }
  return {
    startedAt: raw.startedAt,
    updatedAt: typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : raw.startedAt,
    source: cleanText(raw.source, "direct"),
    campaign: cleanText(raw.campaign, "none"),
    device: raw.device,
    events
  };
}

async function buildStats(days) {
  const windowDays = days === "30" ? 30 : 7;
  const now = new Date();
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const minDate = new Date(todayStart - (windowDays - 1) * 86400000).toISOString().slice(0, 10);
  const maxDate = new Date(todayStart).toISOString().slice(0, 10);

  const daily = {};
  for (let i = windowDays - 1; i >= 0; i--) {
    const day = new Date(todayStart - i * 86400000).toISOString().slice(0, 10);
    daily[day] = { day, sessions: 0, pageViews: 0, ticketSessions: 0, posterSessions: 0 };
  }
  // One private file represents one anonymous tab session. We do not report
  // click counts as unique visitors or silently discard untagged campaigns.
  const collected = [];
  let cursor;
  let hasMore = false;
  do {
    const page = await list({ prefix: "sessions/", limit: 250, cursor });
    for (const blob of page.blobs || []) {
      const day = blob.pathname.slice(9, 19);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= minDate && day <= maxDate) {
        collected.push(blob);
      }
    }
    cursor = page.cursor;
    hasMore = Boolean(page.hasMore);
    // Continue over unrelated file dates only while the scan remains bounded.
  } while (hasMore && collected.length < MAX_SESSIONS);

  const bounded = collected.slice(0, MAX_SESSIONS);
  const sources = {}, campaigns = {}, devices = {};
  const eventCounts = {}, actionSessions = {};
  let sessions = 0, pageViews = 0, engagedSessions = 0, unreadable = 0;
  let lastActivityAt = null;
  for (let i = 0; i < bounded.length; i += 10) {
    const loaded = await Promise.all(bounded.slice(i, i + 10).map(async blob => {
      try { return validatedStoredSession(await readPrivateJSON(blob.pathname)); }
      catch (_) { return null; }
    }));
    for (const item of loaded) {
      if (!item) { unreadable++; continue; }
      const day = item.startedAt.slice(0, 10);
      if (!daily[day]) { unreadable++; continue; }
      sessions++;
      const views = item.events.page_view;
      pageViews += views;
      daily[day].sessions++;
      daily[day].pageViews += views;
      if (item.events.ticket_open > 0) daily[day].ticketSessions++;
      if (item.events.poster_open > 0) daily[day].posterSessions++;
      if (EVENTS.some(name => name !== "page_view" && item.events[name] > 0)) engagedSessions++;
      count(sources, item.source, 1);
      count(campaigns, item.campaign, 1);
      count(devices, item.device, 1);
      if (!lastActivityAt || item.updatedAt > lastActivityAt) lastActivityAt = item.updatedAt;
      for (const name of EVENTS) {
        const n = item.events[name] || 0;
        count(eventCounts, name, n);
        if (n > 0) count(actionSessions, name, 1);
      }
    }
  }
  const asRows = (map) => Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value }));
  const totals = {
    sessions,
    pageViews,
    engagedSessions,
    ticketSessions: actionSessions.ticket_open || 0,
    posterSessions: actionSessions.poster_open || 0,
    paymentSessions: actionSessions.payment_link_click || 0,
    ...eventCounts
  };
  const sum = map => Object.values(map).reduce((a, b) => a + b, 0);
  const quality = {
    sourceSessions: sum(sources),
    campaignSessions: sum(campaigns),
    deviceSessions: sum(devices),
    dailySessions: Object.values(daily).reduce((a, b) => a + b.sessions, 0),
    untaggedSessions: campaigns.none || 0,
    taggedSessions: sessions - (campaigns.none || 0),
    reconciled: [sum(sources), sum(campaigns), sum(devices),
      Object.values(daily).reduce((a, b) => a + b.sessions, 0)].every(n => n === sessions)
  };
  const figures = await readOrganiserFigures();
  return {
    version: 2,
    windowDays, minDate, maxDate,
    coverage: {
      complete: !hasMore && collected.length <= MAX_SESSIONS && unreadable === 0,
      cap: MAX_SESSIONS,
      shown: sessions,
      unreadable,
      truncated: hasMore || collected.length > MAX_SESSIONS
    },
    totals,
    actionSessions,
    quality,
    daily: Object.values(daily),
    sources: asRows(sources),
    campaigns: asRows(campaigns),
    devices: asRows(devices),
    figures: figures && figures.version === 1 ? figures : null,
    lastActivityAt,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { validateSession, saveSession, buildStats, saveOrganiserFigures };
