"use strict";
const crypto = require("node:crypto");
const COOKIE = "myc_admin";
const LIFE_MS = 8 * 3600 * 1000;
function secret() {
  const s = process.env.MYC_ADMIN_PASSWORD || "";
  return s.length >= 24 ? s : null;
}
function safeEqual(a,b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x,y);
}
function signature(exp) {
  return crypto.createHmac("sha256", secret()).update("offscript-session-v1:" + exp).digest("hex");
}
function authorised(req) {
  if (!secret()) return false;
  const cookie = (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="));
  if (!cookie) return false;
  const value = cookie.slice(COOKIE.length + 1).split(".");
  if (value.length !== 2 || !/^[0-9]{13}$/.test(value[0]) || !/^[0-9a-f]{64}$/.test(value[1])) return false;
  const exp = Number(value[0]);
  return exp > Date.now() && exp < Date.now() + LIFE_MS + 60000 && safeEqual(signature(value[0]), value[1]);
}
function setAdminCookie(res) {
  const expiry = String(Date.now() + LIFE_MS);
  res.setHeader("Set-Cookie", COOKIE + "=" + expiry + "." + signature(expiry) + "; Max-Age=28800; Path=/api/admin; HttpOnly; Secure; SameSite=Strict");
}
function clearAdminCookie(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; Max-Age=0; Path=/api/admin; HttpOnly; Secure; SameSite=Strict");
}
function matchingOrigin(req) {
  const origin = req.headers.origin;
  const hostname = req.headers["x-forwarded-host"] || req.headers.host || "";
  // Disallow cross-site writes and requests without a browser Origin header.
  return typeof origin === "string" && origin === "https://" + hostname;
}
function commonHeaders(res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}
module.exports = { secret, safeEqual, authorised, matchingOrigin, commonHeaders, setAdminCookie, clearAdminCookie };
