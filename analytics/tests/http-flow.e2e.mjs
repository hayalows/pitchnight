// Tests run through HTTP entry points before an authorised release.
import assert from "node:assert/strict";
import { test } from "node:test";
const base = process.env.E2E_BASE_URL || "http://localhost:3000";
const edge = process.env.E2E_EDGE_SECRET || "";
const allowed = edge ? {"x-offscript-edge-token":edge} : {};
const withHeaders = (extra={})=>({...allowed,...extra});
test("private overview cannot be read without an organiser session", async()=>{
 const r=await fetch(base+"/analytics",{redirect:"manual",headers:withHeaders()});
 assert.equal(r.status,307);assert.match(r.headers.get("location")||"",/\/analytics\/login/);
});
test("login page explains missing credentials when access is not configured",async()=>{
 const r=await fetch(base+"/analytics/login",{headers:withHeaders()});
 assert.equal(r.status,200);assert.match(await r.text(),/Organiser sign in/);
});
test("collector ignores unprovisioned storage without exposing errors to visitors",async()=>{
 const payload={eventId:"b1b377de-c6d2-4ac7-bd1e-aa4f93eb4c10",visitorId:"2f2dd17c-35b8-46f2-9776-50ab409a3210",
 sessionId:"47d7c735-0e3f-472c-ae1d-5d1e39ff7b43",eventName:"page_view",pagePath:"/",attribution:{source:"Direct / unknown"}};
 const r=await fetch(base+"/analytics/api/collect",{method:"POST",
 headers:withHeaders({"content-type":"application/json",origin:base}),body:JSON.stringify(payload)});
 assert.equal(r.status,204);
});
test("collector refuses invalid events even without a database",async()=>{
 const r=await fetch(base+"/analytics/api/collect",{method:"POST",
 headers:withHeaders({"content-type":"application/json",origin:base}),
 body:JSON.stringify({eventName:"payment_details",pagePath:"/"})});
 assert.equal(r.status,400);
});
test("CSV export requires organiser authentication",async()=>{
 const r=await fetch(base+"/analytics/api/report?format=csv",{redirect:"manual",headers:withHeaders()});
 assert.equal(r.status,401);
});
test("unconfigured organiser login fails closed",async()=>{
 const r=await fetch(base+"/analytics/api/auth",{method:"POST",redirect:"manual",
 headers:withHeaders({origin:base,"content-type":"application/x-www-form-urlencoded"}),body:"password=dont-accept-me"});
 assert.equal(r.status,503);
});
test("maintenance requires its own cron secret",async()=>{
 const r=await fetch(base+"/analytics/api/maintenance",{headers:withHeaders()});
 assert.equal(r.status,401);
});
test("direct requests without the edge credential are denied",async()=>{
 if(!edge)return;
 const r=await fetch(base+"/analytics/login",{redirect:"manual"});
 assert.equal(r.status,403);
});
test("wrong edge credential is denied",async()=>{
 if(!edge)return;
 const r=await fetch(base+"/analytics/api/report",{headers:{"x-offscript-edge-token":"invalid"}});
 assert.equal(r.status,403);
});
