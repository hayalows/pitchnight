import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../../cloudflare/offscriptgh-site-worker.js", import.meta.url), "utf8");
const { default: worker } = await import("data:text/javascript;base64,"+Buffer.from(src).toString("base64"));
const url = path => "https://offscriptgh.com" + path;
const get = (path, options={}) => worker.fetch(new Request(url(path), options), { }, {});
test("unknown paths show branded HTML but retain an actual HTTP 404", async () => {
  const response = await get("/a-page-that-does-not-exist");
  const html = await response.text();
  assert.equal(response.status, 404);
  assert.match(response.headers.get("Content-Type")||"",/text\/html/);
  assert.match(response.headers.get("X-Robots-Tag")||"",/noindex/);
  assert.match(html, /WELL, THIS/);
  assert.match(html, /WASN'T IN/);
  assert.match(html, /THE SCRIPT/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/events\/"/);
  assert.match(html, /<title>404 \| Page not found \| OffScript Ghana<\/title>/);
  assert.doesNotMatch(html, /\{\{[A-Z_0-9]+\}\}/);
});
test("unknown HEAD response is 404 without sending body bytes", async () => {
  const response = await worker.fetch(new Request(url("/missing"),{method:"HEAD"}),{},{});
  assert.equal(response.status,404);
  assert.equal((await response.text()).length,0);
});
test("known homepage and family pages are unchanged", async () => {
  for (const path of ["/","/about/","/events/","/join/","/privacy/"]){
    const response = await get(path);
    assert.equal(response.status,200,path);
    assert.match(response.headers.get("Content-Type")||"",/text\/html/,path);
  }
});
test("site status endpoint stays a JSON response",async()=>{
  const response=await get("/api/list-status");
  assert.equal(response.status,200);
  assert.match(response.headers.get("Content-Type")||"",/json/);
});
test("analytics routes still reach their own gateway",async()=>{
  const response=await get("/analytics/non-existent");
  assert.equal(response.status,503);
});
test("missing event HTML uses the shared 404 page",async()=>{
  const previous=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response("<html><body>missing archive</body></html>",{status:404,headers:{"Content-Type":"text/html"}});
    const response=await worker.fetch(new Request(url("/events/pitch-night-001/missing.html"),{headers:{Accept:"text/html,application/xhtml+xml"}}),{},{});
    assert.equal(response.status,404);
    assert.match(await response.text(),/WASN'T IN/);
  }finally{globalThis.fetch=previous}
});
test("missing event assets keep upstream 404 payloads",async()=>{
  const previous=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response("not found",{status:404,headers:{"Content-Type":"text/plain"}});
    const response=await worker.fetch(new Request(url("/events/pitch-night-001/missing.png"),{headers:{Accept:"image/png,*/*"}}),{},{});
    assert.equal(response.status,404);
    assert.equal(await response.text(),"not found");
  }finally{globalThis.fetch=previous}
});
