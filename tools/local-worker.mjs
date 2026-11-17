// Run the OffScript Cloudflare Worker locally, with the event archive served from this checkout.
//   node site/build.mjs && node tools/local-worker.mjs [port]
// Open http://localhost:8787/ . The Worker's upstream (makeyourcase.vercel.app) is replaced by
// the repository root, so event-page changes in this branch are visible without deploying.
import http from "node:http";
import {readFile} from "node:fs/promises";
import {extname,join,normalize} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("..",import.meta.url));
const port=Number(process.argv[2]||8787);
const types={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".jpeg":"image/jpeg",".jpg":"image/jpeg",".woff2":"font/woff2",".json":"application/json",".txt":"text/plain"};
const realFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const req=input instanceof Request?input:new Request(input,init);
  const u=new URL(req.url);
  if(u.origin!=="https://makeyourcase.vercel.app")return realFetch(input,init);
  let p=decodeURIComponent(u.pathname);if(p.endsWith("/"))p+="index.html";
  if(p.startsWith("/api/"))return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json"}});
  const file=normalize(join(root,p));
  if(!file.startsWith(root))return new Response("no",{status:403});
  try{return new Response(await readFile(file),{headers:{"Content-Type":types[extname(file)]||"application/octet-stream"}})}
  catch{return new Response("Not found",{status:404})}
};
const {default:worker}=await import(new URL("../cloudflare/offscriptgh-site-worker.js?"+Date.now(),import.meta.url));
http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);
  const r=new Request("http://localhost:"+port+req.url,{method:req.method,headers:req.headers,body:["GET","HEAD"].includes(req.method)?undefined:Buffer.concat(chunks)});
  const out=await worker.fetch(r,{},{waitUntil(){}});
  res.writeHead(out.status,Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(port,()=>console.log("OffScript local worker on http://localhost:"+port));
