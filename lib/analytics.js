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
async function buildStats(days) {
  const daysNum = days === "30" ? 30 : 7;
  const today = new Date();
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const min = new Date(todayStart - (daysNum - 1) * 86400000).toISOString().slice(0, 10);
  const daily = {};
  for (let i = daysNum - 1; i >= 0; i--) {
    const day = new Date(todayStart - i * 86400000).toISOString().slice(0, 10);
    daily[day] = { day, sessions: 0, pageViews: 0, ticketOpens: 0 };
  }
  const collected = [];
  let cursor, hasMore = false;
  // Blob is intentionally bounded for this low-volume event website.
  // Never present a truncated sample as complete reporting.
  do {
    const page = await list({ prefix: "sessions/", limit: 250, cursor });
    const filtered = (page.blobs || []).filter(item => item.pathname.slice(9, 19) >= min);
    collected.push(...filtered);
    cursor = page.cursor;
    hasMore = Boolean(page.hasMore);
  } while (hasMore && collected.length < MAX_SESSIONS);
  const bounded = collected.slice(0, MAX_SESSIONS);
  const sources = {}, devices = {}, campaigns = {}, events = {};
  let sessions = 0, pageViews = 0, invalid = 0;
  for (let i = 0; i < bounded.length; i += 10) {
    const batch = bounded.slice(i, i + 10);
    const loaded = await Promise.all(batch.map(async item => {
      try { return await readPrivateJSON(item.pathname); }
      catch (_) { return null; }
    }));
    for (const raw of loaded) {
      // Imported organiser data and other arbitrary objects are never counted as sessions.
      if (!raw || typeof raw !== "object" || !raw.events || typeof raw.startedAt !== "string") {
        invalid++; continue;
      }
      const day = raw.startedAt.slice(0, 10);
      if (!daily[day]) continue;
      sessions++;
      const views = Number(raw.events.page_view) || 0;
      pageViews += views;
      daily[day].sessions++;
      daily[day].pageViews += views;
      daily[day].ticketOpens += Number(raw.events.ticket_open) || 0;
      count(sources, cleanText(raw.source, "direct"), 1);
      count(devices, raw.device === "mobile" ? "Mobile" : "Desktop", 1);
      count(campaigns, cleanText(raw.campaign, "none"), 1);
      for (const name of EVENTS) count(events, name, Number(raw.events[name]) || 0);
    }
  }
  const figures = await readOrganiserFigures();
  return {
    windowDays: daysNum, minDate: min,
    coverage: { complete: !hasMore && collected.length <= MAX_SESSIONS, cap: MAX_SESSIONS, unreadable: invalid },
    totals: { sessions, pageViews, ...events },
    daily: Object.values(daily),
    sources: Object.entries(sources).sort((a,b) => b[1] - a[1]).map(([name, value]) => ({ name, value })),
    campaigns: Object.entries(campaigns).sort((a,b) => b[1] - a[1]).map(([name, value]) => ({ name, value })),
    devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
    figures: figures && figures.version === 1 ? figures : null,
    generatedAt: new Date().toISOString()
  };
}
module.exports = { validateSession, saveSession, buildStats, saveOrganiserFigures };
