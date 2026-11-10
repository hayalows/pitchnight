"use strict";
const { put, list, get, BlobNotFoundError, BlobPreconditionFailedError } = require("@vercel/blob");

const EVENTS = [
  "page_view", "ticket_open", "form_acknowledged", "payment_link_click",
  "programme_open", "poster_open", "poster_download_click",
  "poster_share_click", "site_share_click", "host_open", "faq_open",
  "registration_form_link", "poster_format_change", "feedback_open", "registration_desk_open",
  "programme_seen", "host_seen", "tickets_seen"
];
const EVENT_SET = new Set(EVENTS);
const MAX_SESSIONS = 400;
const MAX_FEEDBACK = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FEEDBACK_TOPICS = new Set(["registration", "programme", "poster", "other"]);
const blobOptions = { access: "private", contentType: "application/json", cacheControlMaxAge: 60 };
const countryCode = value => typeof value === "string" && /^[A-Z]{2}$/.test(value) && !["XX", "ZZ"].includes(value) ? value : "unknown";

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
function validateSession(data, country) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (typeof data.id !== "string" || !UUID.test(data.id)) return null;
  if (!isReasonableDate(data.startedAt) || !isReasonableDate(data.updatedAt)) return null;
  if (Date.parse(data.updatedAt) < Date.parse(data.startedAt)) return null;
  if (data.device !== "mobile" && data.device !== "desktop") return null;
  if (!data.events || typeof data.events !== "object" || Array.isArray(data.events)) return null;
  const events = {};
  for (const [name, value] of Object.entries(data.events)) {
    if (!EVENT_SET.has(name) || !Number.isInteger(value) || value < 0 || value > 35) return null;
    events[name] = value;
  }
  if (!Object.values(events).some(Boolean) || (data.version !== 2 && !events.page_view)) return null;
  return {
    version: 2,
    id: data.id.toLowerCase(),
    startedAt: new Date(data.startedAt).toISOString(),
    updatedAt: new Date(Math.min(Date.now(), Date.parse(data.updatedAt))).toISOString(),
    country: countryCode(country),
    source: cleanText(data.source, "direct"),
    campaign: cleanText(data.campaign, "none"),
    device: data.device,
    events
  };
}
async function saveSession(session) {
  const path = "sessions/" + session.startedAt.slice(0, 10) + "/" + session.id + ".json";
  for (let attempt = 0; attempt < 3; attempt++) {
    const blob = await privateBlob(path);
    const prior = blob ? validatedStoredSession(await new Response(blob.stream).json()) : null;
    const next = { ...session, events: { ...session.events } };
    if (prior) {
      for (const [event, count] of Object.entries(prior.events)) {
        next.events[event] = Math.max(next.events[event] || 0, count);
      }
      for (const key of ["startedAt", "source", "campaign", "device"]) next[key] = prior[key];
      next.country = prior.country === "unknown" ? next.country : prior.country;
      next.updatedAt = prior.updatedAt > next.updatedAt ? prior.updatedAt : next.updatedAt;
      if (next.country === prior.country && Object.keys(next.events).every(key => next.events[key] === prior.events[key])) return;
    }
    try {
      await put(path, JSON.stringify(next), { ...blobOptions, ...(blob ? { ifMatch: blob.blob.etag } : { allowOverwrite: false }) });
      return;
    } catch (error) {
      // An initial write can race with another tab or an in-flight page exit.
      if (!(error instanceof BlobPreconditionFailedError) && (blob || !/already exists/i.test(error.message))) throw error;
    }
  }
  throw new Error("Concurrent tracking update");
}

async function privateBlob(path) {
  try {
    const blob = await get(path, { access: "private", useCache: false });
    return blob?.statusCode === 200 && blob.stream ? blob : null;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

async function readPrivateJSON(path) {
  const blob = await privateBlob(path);
  return blob ? new Response(blob.stream).json() : null;
}

function validateFeedback(data) {
  if (!data || typeof data.id !== "string" || !UUID.test(data.id) || !FEEDBACK_TOPICS.has(data.topic) ||
      typeof data.message !== "string" || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) return null;
  const message = data.message.trim();
  if (message.length < 5 || message.length > 500) return null;
  return { version: 1, id: data.id.toLowerCase(), topic: data.topic, rating: data.rating, message };
}

async function saveFeedback(note) {
  const submittedAt = new Date().toISOString();
  const path = "feedback/" + submittedAt.slice(0, 10) + "/" + note.id + ".json";
  try {
    await put(path, JSON.stringify({ ...note, submittedAt }), { ...blobOptions, allowOverwrite: false });
  } catch (error) {
    if (!/already exists/i.test(error.message)) throw error;
  }
}

async function listInWindow(prefix, dates, cap) {
  const records = [];
  for (const day of [...dates].reverse()) {
    let cursor;
    do {
      const page = await list({ prefix: prefix + "/" + day + "/", limit: Math.min(100, cap + 1 - records.length), cursor });
      records.push(...page.blobs);
      if (records.length > cap || (records.length === cap && page.hasMore)) {
        return { records: records.slice(0, cap), truncated: true };
      }
      cursor = page.hasMore ? page.cursor : undefined;
      if (page.hasMore && !cursor) return { records, truncated: true };
    } while (cursor);
  }
  return { records, truncated: false };
}

async function readFeedback(dates) {
  const { records, truncated } = await listInWindow("feedback", dates, MAX_FEEDBACK);
  const notes = [];
  let unreadable = 0;
  for (let i = 0; i < records.length; i += 10) {
    const batch = await Promise.all(records.slice(i, i + 10).map(async ({ pathname }) => {
      try {
        const data = await readPrivateJSON(pathname);
        if (!validateFeedback(data) || !dates.includes(data.submittedAt?.slice(0, 10))) return null;
        return { topic: data.topic, rating: data.rating, message: data.message, submittedAt: data.submittedAt };
      } catch (_) { return null; }
    }));
    for (const note of batch) {
      if (note) notes.push(note);
      else unreadable++;
    }
  }
  notes.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return { notes, truncated, unreadable };
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
  const events = {};
  for (const [key, value] of Object.entries(raw.events)) {
    if (!EVENT_SET.has(key) || !Number.isInteger(value) || value < 0 || value > 35) return null;
    events[key] = value;
  }
  if (!Object.values(events).some(Boolean) || (raw.version !== 2 && !events.page_view)) return null;
  return {
    id: raw.id.toLowerCase(),
    country: countryCode(raw.country),
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
  const dates = Object.keys(daily);
  const [{ records: bounded, truncated }, feedbackResult, figuresResult] = await Promise.all([
    listInWindow("sessions", dates, MAX_SESSIONS),
    readFeedback(dates).catch(() => ({ unavailable: true })),
    readOrganiserFigures().then(figures => ({ figures }), () => ({ unavailable: true }))
  ]);
  const sources = Object.create(null), campaigns = Object.create(null);
  const devices = Object.create(null), countries = Object.create(null);
  const seen = new Set();
  let duplicates = 0;
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
      if (seen.has(item.id)) { duplicates++; continue; }
      seen.add(item.id);
      sessions++;
      const views = item.events.page_view || 0;
      pageViews += views;
      daily[day].sessions++;
      daily[day].pageViews += views;
      if (item.events.ticket_open > 0) daily[day].ticketSessions++;
      if (item.events.poster_open > 0) daily[day].posterSessions++;
      if (EVENTS.some(name => name !== "page_view" && item.events[name] > 0)) engagedSessions++;
      count(sources, item.source, 1);
      count(campaigns, item.campaign, 1);
      count(devices, item.device, 1);
      count(countries, item.country, 1);
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
    countrySessions: sum(countries),
    dailySessions: Object.values(daily).reduce((a, b) => a + b.sessions, 0),
    untaggedSessions: campaigns.none || 0,
    taggedSessions: sessions - (campaigns.none || 0),
    reconciled: [sum(sources), sum(campaigns), sum(devices), sum(countries),
      Object.values(daily).reduce((a, b) => a + b.sessions, 0)].every(n => n === sessions)
  };
  const figures = figuresResult.figures;
  return {
    version: 3,
    windowDays, minDate, maxDate,
    coverage: {
      complete: !truncated && unreadable === 0 && duplicates === 0,
      cap: MAX_SESSIONS,
      shown: sessions,
      unreadable,
      duplicates,
      truncated
    },
    totals,
    actionSessions,
    quality,
    daily: Object.values(daily),
    sources: asRows(sources),
    campaigns: asRows(campaigns),
    devices: asRows(devices),
    countries: asRows(countries),
    feedback: feedbackResult,
    figuresUnavailable: Boolean(figuresResult.unavailable),
    figures: figures && figures.version === 1 ? figures : null,
    lastActivityAt,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { validateSession, saveSession, buildStats, saveOrganiserFigures, validateFeedback, saveFeedback };
