// HTTP journey checks, authored before implementation. No database and no live services.
import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.E2E_BASE_URL || "http://localhost:3000";

test("private overview cannot be read without a session", async () => {
  const response = await fetch(base + "/analytics", { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") || "", /\/analytics\/login/);
});

test("login page clearly explains when organiser access is unconfigured", async () => {
  const response = await fetch(base + "/analytics/login");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Organiser sign in/);
  assert.match(await (await fetch(base + "/analytics/login")).text(), /not configured yet/);
});

test("collector ignores unprovisioned storage without exposing errors to visitors", async () => {
  const payload = {
    eventId: "b1b377de-c6d2-4ac7-bd1e-aa4f93eb4c10",
    visitorId: "2f2dd17c-35b8-46f2-9776-50ab409a3210",
    sessionId: "47d7c735-0e3f-472c-ae1d-5d1e39ff7b43",
    eventName: "page_view", pagePath: "/", attribution: { source: "Direct / unknown" }
  };
  const response = await fetch(base + "/analytics/api/collect", {
    method: "POST", headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify(payload)
  });
  assert.equal(response.status, 204);
});

test("collector refuses invalid action names even without a database", async () => {
  const response = await fetch(base + "/analytics/api/collect", {
    method: "POST", headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ eventName: "payment_details", pagePath: "/" })
  });
  assert.equal(response.status, 400);
});

test("private CSV export cannot be downloaded without an organiser session", async () => {
  const response = await fetch(base + "/analytics/api/report?format=csv", { redirect: "manual" });
  assert.equal(response.status, 401);
});

test("unconfigured organiser login stays closed", async () => {
  const response = await fetch(base + "/analytics/api/auth", {
    method: "POST", headers: { origin: base, "content-type": "application/x-www-form-urlencoded" },
    body: "password=dont-accept-me", redirect: "manual"
  });
  assert.equal(response.status, 503);
});
