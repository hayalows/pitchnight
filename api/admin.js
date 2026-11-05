"use strict";
const { buildStats, saveOrganiserFigures } = require("../lib/analytics");
const { secret, safeEqual, authorised, matchingOrigin, commonHeaders, setAdminCookie, clearAdminCookie } = require("../lib/admin-auth");
module.exports = async function handler(req, res) {
  commonHeaders(res);
  if (!secret() || !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Admin setup incomplete" });
  }
  if (req.method === "POST") {
    if (!matchingOrigin(req)) return res.status(403).json({ error: "Origin refused" });
    if (!(req.headers["content-type"] || "").startsWith("application/json")) return res.status(415).json({ error: "JSON required" });
    const password = req.body && req.body.password;
    if (typeof password !== "string" || password.length > 200 || !safeEqual(password, secret())) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    setAdminCookie(res);
    return res.status(200).json({ authenticated: true });
  }
  if (req.method === "DELETE") {
    if (!matchingOrigin(req)) return res.status(403).json({ error: "Origin refused" });
    clearAdminCookie(res);
    return res.status(200).json({ authenticated: false });
  }
  if (!authorised(req)) return res.status(401).json({ error: "Sign in required" });
  if (req.method === "GET") {
    try { return res.status(200).json(await buildStats(String(req.query.days || "7"))); }
    catch (_) { return res.status(503).json({ error: "Analytics service temporarily unavailable" }); }
  }
  if (req.method === "PUT") {
    if (!matchingOrigin(req)) return res.status(403).json({ error: "Origin refused" });
    if (!(req.headers["content-type"] || "").startsWith("application/json")) return res.status(415).json({ error: "JSON required" });
    const d = req.body || {};
    if (![d.formResponses, d.paidTickets].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 100000) ||
        typeof d.grossCedis !== "number" || !Number.isFinite(d.grossCedis) || d.grossCedis < 0 ||
        d.grossCedis > 10000000 || Math.abs(d.grossCedis * 100 - Math.round(d.grossCedis * 100)) > 0.0000001) {
      return res.status(400).json({ error: "Enter valid whole-number counts and a valid amount" });
    }
    const data = {
      version: 1, formResponses: d.formResponses, paidTickets: d.paidTickets,
      grossCedis: d.grossCedis, source: "organiser_entered",
      updatedAt: new Date().toISOString()
    };
    try {
      await saveOrganiserFigures(data);
      return res.status(200).json({ stored: true, figures: data });
    } catch (_) { return res.status(503).json({ error: "Unable to save figures" }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
};
