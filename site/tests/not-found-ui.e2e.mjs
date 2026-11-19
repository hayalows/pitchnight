// Browser E2E for the Offscript 404 page. Run with node site/tests/not-found-ui.e2e.mjs
import {readFileSync,mkdtempSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {spawn} from "node:child_process";
import http from "node:http";
import assert from "node:assert/strict";
const root=new URL("../../",import.meta.url);
const source=readFileSync(new URL("cloudflare/offscriptgh-site-worker.js",root),"utf8");
const {default:worker}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const port=34468,chromePort=9371;
const server=http.createServer(async(req,res)=>{
 try{const r=await worker.fetch(new Request("https://offscriptgh.com"+req.url,{method:req.method,headers:req.headers}),{},{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}
 catch(err){res.writeHead(500);res.end(String(err))}
});
await new Promise(ok=>server.listen(port,"127.0.0.1",ok));
const chrome=spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",[
 "--headless=new","--disable-gpu","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port="+chromePort,"--user-data-dir="+mkdtempSync(join(tmpdir(),"os404-e2e-"))
],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try{
 let ready=false;for(let i=0;i<65;i++){try{const r=await fetch("http://127.0.0.1:"+chromePort+"/json/version");if(r.ok){ready=true;break}}catch{}await sleep(180)}
 assert.ok(ready,"isolated Chrome is ready");
 const tab=await(await fetch("http://127.0.0.1:"+chromePort+"/json/new?about:blank",{method:"PUT"})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 let seq=0;const pending=new Map();
 ws.addEventListener("message",ev=>{const o=JSON.parse(ev.data);if(!o.id)return;const p=pending.get(o.id);if(!p)return;pending.delete(o.id);o.error?p.reject(Error(o.error.message)):p.resolve(o.result)});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error("timeout "+method))}},15000).unref()});
 async function evaluate(expression){const r=await cmd("Runtime.evaluate",{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result?.value}
 async function until(expression){for(let i=0;i<70;i++){if(await evaluate(expression))return;await sleep(100)}throw Error("DOM did not load")}
 await cmd("Page.enable");await cmd("Runtime.enable");await cmd("Network.enable");
 const response=await fetch("http://127.0.0.1:"+port+"/some-missing-link");
 assert.equal(response.status,404);
 const html=await response.text();
 assert.match(html,/You went a little too/i);
 assert.match(html,/data-sticker-board/);
 assert.match(html,/href="\/events\/pitch-night-001\/"/);
 console.log("PASS copy, HTTP 404 and recovery links");
 for(const width of [320,360,768,1280]){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height:850,deviceScaleFactor:1,mobile:width<800});
  await cmd("Page.navigate",{url:"http://127.0.0.1:"+port+"/gone"});
  await until("document.querySelector('[data-sticker-board]') !== null");
  const view=JSON.parse(await evaluate("JSON.stringify({width:innerWidth,documentWidth:document.documentElement.scrollWidth,stickers:document.querySelectorAll('[data-sticker]').length,links:[...document.querySelectorAll('.os404-cta a')].map(a=>a.getAttribute('href'))})"));
  assert.equal(view.stickers,4);
  assert.ok(view.documentWidth<=width+2,"no overflow "+JSON.stringify(view));
  assert.equal(view.links.length,2);
  const snap=await cmd("Page.captureScreenshot",{format:"jpeg",quality:72,captureBeyondViewport:false});
  writeFileSync(join(tmpdir(),"offscript-404-review-"+width+".jpg"),Buffer.from(snap.data,"base64"));
  console.log("PASS viewport "+width+" "+JSON.stringify(view));
 }
 await cmd("Emulation.setDeviceMetricsOverride",{width:768,height:850,deviceScaleFactor:1,mobile:false});
 await cmd("Page.navigate",{url:"http://127.0.0.1:"+port+"/gone"});
 await until("document.querySelectorAll('[data-sticker]').length === 4");
 await evaluate("document.querySelector('[data-sticker]').focus()");
 const before=JSON.parse(await evaluate("JSON.stringify({left:parseFloat(document.querySelector('[data-sticker]').style.left),counter:document.querySelector('[data-sticker-moves]').textContent})"));
 await cmd("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"ArrowRight",code:"ArrowRight",windowsVirtualKeyCode:39});
 await cmd("Input.dispatchKeyEvent",{type:"keyUp",key:"ArrowRight",code:"ArrowRight",windowsVirtualKeyCode:39});
 const after=JSON.parse(await evaluate("JSON.stringify({left:parseFloat(document.querySelector('[data-sticker]').style.left),counter:document.querySelector('[data-sticker-moves]').textContent})"));
 assert.ok(after.left>before.left,"arrow key moves focused sticker");
 assert.notEqual(after.counter,before.counter);
 await evaluate("document.querySelector('[data-reset-stickers]').click()");
 const reset=JSON.parse(await evaluate("JSON.stringify({left:parseFloat(document.querySelector('[data-sticker]').style.left),counter:document.querySelector('[data-sticker-moves]').textContent})"));
 assert.equal(reset.left,before.left);
 assert.equal(reset.counter,"0");
 console.log("PASS keyboard movement and reset");
 const pos=JSON.parse(await evaluate("JSON.stringify((()=>{const s=document.querySelectorAll('[data-sticker]')[1],r=s.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,left:parseFloat(s.style.left)}})())"));
 await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",x:pos.x,y:pos.y});
 await cmd("Input.dispatchMouseEvent",{type:"mousePressed",x:pos.x,y:pos.y,button:"left",clickCount:1});
 await cmd("Input.dispatchMouseEvent",{type:"mouseMoved",x:pos.x+38,y:pos.y+20,button:"left",buttons:1});
 await cmd("Input.dispatchMouseEvent",{type:"mouseReleased",x:pos.x+38,y:pos.y+20,button:"left",clickCount:1});
 const shifted=Number(await evaluate("parseFloat(document.querySelectorAll('[data-sticker]')[1].style.left)"));
 assert.ok(shifted>pos.left,"pointer drag moves second sticker");
 console.log("PASS pointer movement");
 console.log("PASS all 404 browser E2E scenarios");
}catch(e){console.error("FAIL "+(e.stack||String(e)));process.exitCode=1}
finally{ws?.close();chrome.kill("SIGTERM");server.close()}
