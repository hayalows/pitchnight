import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { databaseConfigured, number, query } from "./db";

export const COOKIE = "offscript_analytics_session";
const HOURS = 8;
export function authConfigured() {
  return databaseConfigured() &&
    (process.env.OFFSCRIPT_ANALYTICS_ADMIN_PASSWORD?.length || 0) >= 24 &&
    (process.env.OFFSCRIPT_ANALYTICS_SESSION_SECRET?.length || 0) >= 32;
}
function signed(value: string) {
  return createHmac("sha256", process.env.OFFSCRIPT_ANALYTICS_SESSION_SECRET || "disabled")
    .update("offscript-admin-v1:" + value).digest("hex");
}
function equal(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function token(): string {
  const expires = String(Date.now() + HOURS * 3600000);
  return expires + "." + signed(expires);
}
export function validToken(value?: string): boolean {
  if (!authConfigured() || !value) return false;
  const [expires, signature, extra] = value.split(".");
  if (extra !== undefined || !/^\d{13}$/.test(expires || "") ||
      !/^[0-9a-f]{64}$/.test(signature || "")) return false;
  if (Number(expires) <= Date.now()) return false;
  return equal(signature, signed(expires));
}
export async function isAdmin() {
  return validToken((await cookies()).get(COOKIE)?.value);
}
export function correctPassword(submitted: string) {
  return authConfigured() &&
    equal(signed(submitted), signed(process.env.OFFSCRIPT_ANALYTICS_ADMIN_PASSWORD || ""));
}
export async function permittedLoginAttempt(ip: string): Promise<boolean> {
  const secret = process.env.OFFSCRIPT_ANALYTICS_SESSION_SECRET || "disabled";
  const fingerprint = createHmac("sha256",secret).update(ip.slice(0,150)).digest("hex");
  const globalFingerprint=createHmac("sha256",secret).update("all-login-attempts").digest("hex");
  const bucket = new Date(Math.floor(Date.now()/900000)*900000).toISOString();
  const statement="INSERT INTO offscript_analytics_login_attempts(fingerprint,window_start,attempts) VALUES($1,$2,1) " +
    "ON CONFLICT (fingerprint,window_start) DO UPDATE SET attempts=offscript_analytics_login_attempts.attempts+1 " +
    "RETURNING attempts";
  const [local,global]=await Promise.all([
    query<{attempts:unknown}>(statement,[fingerprint,bucket]),
    query<{attempts:unknown}>(statement,[globalFingerprint,bucket])
  ]);
  return number(local[0]?.attempts)<=8 && number(global[0]?.attempts)<=80;
}
export function sameOrigin(origin: string | null, requestOrigin: string) {
  const expected = process.env.OFFSCRIPT_ANALYTICS_PUBLIC_ORIGIN || "https://offscriptgh.com";
  return origin === expected || (process.env.NODE_ENV === "development" && origin === requestOrigin);
}
