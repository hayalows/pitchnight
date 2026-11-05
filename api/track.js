"use strict";
const { validateSession, saveSession } = require("../lib/analytics");
const { matchingOrigin, commonHeaders } = require("../lib/admin-auth");
module.exports = async function handler(req, res) {
  commonHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!matchingOrigin(req)) return res.status(403).json({ error: "Origin refused" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: "Tracking unavailable" });
  if (!(req.headers["content-type"] || "").startsWith("application/json")) return res.status(415).json({ error: "JSON required" });
  if (Number(req.headers["content-length"] || 0) > 2400) return res.status(413).json({ error: "Payload too large" });
  const payload = validateSession(req.body);
  if (!payload) return res.status(400).json({ error: "Invalid event" });
  try {
    await saveSession(payload);
    return res.status(202).json({ stored: true });
  } catch (_) {
    return res.status(503).json({ error: "Tracking unavailable" });
  }
};
