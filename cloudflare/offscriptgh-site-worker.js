const HOME="<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\"/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n<meta name=\"theme-color\" content=\"#faf4e7\"/>\n<meta name=\"description\" content=\"Offscript creates room for people to meet, exchange ideas, and enjoy memorable experiences. Explore our first event, Pitch Night Edition 001.\"/>\n<meta property=\"og:type\" content=\"website\"/>\n<meta property=\"og:title\" content=\"Offscript Ghana | Beyond the usual. Into connection.\"/>\n<meta property=\"og:description\" content=\"Beyond the usual. Into connection. Meet Offscript and revisit our first Pitch Night.\"/>\n<link rel=\"canonical\" href=\"https://offscriptgh.com/\"/>\n<link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\"/>\n<title>Offscript Ghana | Beyond the usual. Into connection.</title>\n<style>\n@font-face{font-family:Anton;src:url('/assets/fonts/anton-props.woff2') format('woff2');font-display:swap}\n@font-face{font-family:Space;src:url('/assets/fonts/space-grotesk-props.woff2') format('woff2');font-display:swap}\n:root{color-scheme:light;--paper:#faf4e7;--ink:#171717;--blue:#1036af;--yellow:#ffd63b;--mint:#aeef9d;--red:#f03d2f}\n*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:500 1rem/1.55 Space,Arial,sans-serif}\na{color:inherit}a:focus-visible{outline:3px solid var(--red);outline-offset:4px}\na,button{-webkit-tap-highlight-color:transparent}\nheader{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px clamp(19px,5vw,76px);border-bottom:3px solid var(--ink);background:var(--paper)}\n.logo{width:190px;max-width:46vw;height:60px;object-fit:contain;object-position:left center}\nnav{display:flex;gap:clamp(15px,2.1vw,35px);align-items:center}\nnav a{font-size:.71rem;font-weight:800;letter-spacing:.07em;text-decoration:none}\nnav a:hover{text-decoration:underline;text-underline-offset:5px}\nnav .nav-cta{font-size:.7rem;letter-spacing:.035em;text-decoration:none;border:2px solid var(--ink);box-shadow:3px 3px var(--ink);background:var(--yellow);padding:11px 14px;white-space:nowrap}\nmain{overflow:hidden}\n.hero{padding:clamp(42px,7.8vw,105px) clamp(19px,6.2vw,108px) clamp(43px,6vw,86px);border-bottom:3px solid var(--ink);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:clamp(28px,4vw,65px);align-items:center}\n.kicker{display:inline-flex;gap:10px;align-items:center;font-size:.72rem;letter-spacing:.13em;font-weight:800}\n.kicker:before{content:\"\";width:11px;height:11px;background:var(--red);border-radius:50%}\nh1{font:400 clamp(5rem,9.8vw,10rem)/.9 Anton,Impact,sans-serif;letter-spacing:-.035em;margin:23px 0 29px}\nh1 span{color:var(--blue)}\n.hero p{max-width:540px;margin:0;font-size:clamp(1rem,1.55vw,1.3rem);line-height:1.55}\n.hero-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:31px}\n.btn{background:var(--yellow);border:2px solid var(--ink);box-shadow:4px 4px var(--ink);padding:13px 18px;min-height:51px;display:inline-flex;align-items:center;gap:21px;text-decoration:none;font-size:.76rem;font-weight:800;letter-spacing:.05em}\n.btn:hover{transform:translate(-1px,-1px);box-shadow:5px 5px var(--ink)}\n.btn.secondary{background:var(--paper)}\n.hero-art{background:var(--blue);min-height:475px;border:3px solid var(--ink);position:relative;box-shadow:10px 12px var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}\n.hero-art:before{content:\"\";position:absolute;width:125%;aspect-ratio:1;border:2px dashed rgba(255,255,255,.32);border-radius:50%;transform:rotate(-15deg)}\n.hero-art .burst{font:400 clamp(4.5rem,8vw,8.5rem)/.96 Anton,Impact,sans-serif;color:var(--yellow);text-align:center;transform:rotate(-8deg);text-shadow:5px 6px 0 var(--ink);position:relative}\n.hero-art .scribble{position:absolute;right:14%;top:12%;width:92px;height:68px;border:6px solid var(--red);border-radius:46% 57% 45% 60%;transform:rotate(-25deg)}\n.hero-art .stamp{position:absolute;bottom:27px;left:25px;background:var(--mint);border:2px solid var(--ink);padding:8px 14px;font-size:.73rem;font-weight:800;transform:rotate(-6deg)}\n.about{padding:clamp(54px,8vw,115px) clamp(19px,6.2vw,108px);display:grid;grid-template-columns:.8fr 1.2fr;gap:35px;align-items:start;background:var(--paper)}\n.eyebrow{display:block;font-size:.72rem;letter-spacing:.13em;font-weight:800}\n.about h2,.events h2,.next h2{font:400 clamp(3.7rem,7.7vw,8.2rem)/.94 Anton,Impact,sans-serif;letter-spacing:-.018em;margin:15px 0}\n.about p{font-size:clamp(1.1rem,1.8vw,1.55rem);line-height:1.5;max-width:610px;margin:19px 0}\n.about .tag{display:inline-block;background:var(--red);color:white;padding:7px 15px;border:2px solid var(--ink);font-size:.73rem;font-weight:800;transform:rotate(-3deg);margin-top:18px}\n.events{padding:clamp(53px,7vw,100px) clamp(19px,6.2vw,108px);background:var(--mint);border-top:3px solid var(--ink);border-bottom:3px solid var(--ink)}\n.events h2{margin-bottom:30px}.event{display:grid;grid-template-columns:1.3fr .7fr;border:3px solid var(--ink);background:var(--paper);box-shadow:9px 10px var(--ink)}\n.event-copy{padding:clamp(24px,3.5vw,48px)}.event-label{font-size:.71rem;letter-spacing:.11em;font-weight:800;color:var(--blue)}\n.event h3{font:400 clamp(3.4rem,6.2vw,7rem)/.94 Anton,Impact,sans-serif;margin:15px 0 16px}.event h3 span{color:var(--red)}\n.event p{max-width:560px;margin:0 0 16px}.event-details{display:flex;flex-wrap:wrap;gap:12px 26px;font-size:.77rem;font-weight:800;margin-bottom:29px}\n.event-poster{background:var(--yellow);border-left:3px solid var(--ink);padding:30px;display:flex;align-items:center;justify-content:center;overflow:hidden}\n.event-poster div{font:400 clamp(4rem,6.8vw,8rem)/.94 Anton,Impact,sans-serif;text-align:center;color:var(--blue);transform:rotate(-8deg);text-shadow:3px 4px 0 var(--ink)}\n.event-poster small{display:block;background:var(--paper);border:2px solid var(--ink);padding:8px;margin-top:22px;transform:rotate(5deg);color:var(--ink);text-shadow:none;font:800 .7rem Space,Arial,sans-serif;letter-spacing:.06em}\n.next{padding:clamp(56px,8vw,110px) clamp(19px,6.2vw,108px);background:var(--blue);color:var(--paper);display:flex;justify-content:space-between;gap:32px;align-items:end}\n.next h2{max-width:780px;margin:18px 0}.next h2 span{color:var(--yellow)}.next p{max-width:620px;margin:22px 0 0;font-size:1.05rem}\n.next .btn{background:var(--mint);color:var(--ink);flex-shrink:0}\nfooter{background:var(--ink);color:var(--paper);padding:25px clamp(19px,6.2vw,108px);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px 25px;align-items:center;font-size:.75rem;font-weight:800;letter-spacing:.02em}\nfooter a{color:var(--yellow);text-decoration:none}footer a:hover{text-decoration:underline}\n@media(max-width:1000px){.hero{grid-template-columns:1fr}.hero-art{min-height:360px}.hero-art .burst{font-size:clamp(6rem,16vw,10rem)}.about{grid-template-columns:1fr}.event{grid-template-columns:1fr}.event-poster{border-left:0;border-top:3px solid var(--ink);min-height:240px}.next{align-items:start;flex-direction:column}}\n@media(max-width:600px){header{padding:12px 19px}header .logo{height:45px;width:155px}nav{gap:15px}nav .nav-cta{display:none}nav a{font-size:.67rem}.hero{padding:38px 19px 52px;gap:37px}h1{font-size:clamp(5.3rem,17.7vw,7.5rem);margin:25px 0}.hero p{font-size:1.02rem}.hero-art{min-height:305px;margin:0 7px 7px 0}.hero-art .burst{font-size:clamp(5.8rem,18vw,7rem)}.hero-art .scribble{width:60px;height:52px;border-width:4px}.hero-art .stamp{font-size:.62rem}.about,.events,.next{padding:52px 19px}.about h2,.events h2,.next h2{font-size:clamp(4rem,12.7vw,5.3rem)}.about p{font-size:1.04rem}.event-copy{padding:23px 22px 30px}.event h3{font-size:clamp(4rem,13vw,5.5rem)}.event-details{font-size:.74rem}.event-poster{min-height:210px}.event-poster div{font-size:clamp(4.7rem,14vw,6rem)}footer{padding:24px 19px}}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn:hover{transform:none}}\n</style>\n</head>\n<body>\n<header><a href=\"/\" aria-label=\"Offscript homepage\"><img class=\"logo\" src=\"/assets/offscript-logo.png\" alt=\"Offscript\"/></a><nav aria-label=\"Main menu\"><a href=\"#about\">ABOUT</a><a href=\"#events\">EVENTS</a><a class=\"nav-cta\" href=\"/events/pitch-night-001/\">VIEW PITCH NIGHT ↗</a></nav></header>\n<main>\n<section class=\"hero\" aria-labelledby=\"hero-title\">\n<div><span class=\"kicker\">HELLO FROM OFFSCRIPT / GHANA</span><h1 id=\"hero-title\">BEYOND<br/>THE <span>USUAL.</span></h1><p>Into connection. We're here for shared ideas, good company and the moments that happen when people come together.</p><div class=\"hero-links\"><a class=\"btn\" href=\"#events\">SEE OUR EVENTS <span aria-hidden=\"true\">↗</span></a><a class=\"btn secondary\" href=\"#about\">GET TO KNOW US</a></div></div>\n<div class=\"hero-art\" role=\"img\" aria-label=\"Offscript illustrated poster in cobalt blue and yellow, with the words Into Connection\"><div class=\"scribble\" aria-hidden=\"true\"></div><div class=\"burst\">INTO<br/>CON-<br/>NECTION.</div><div class=\"stamp\">BEYOND THE USUAL. ✳</div></div>\n</section>\n<section class=\"about\" id=\"about\"><div><span class=\"eyebrow\">001 / WHO WE ARE</span><h2>THERE'S<br/>ROOM FOR<br/>EVERYONE.</h2></div><div><p>Offscript brings people together through events that make space for conversation, creativity and real connections.</p><p>We began with Pitch Night: Make Your Case, an evening in Accra where people came to speak up for their friends, share a laugh and meet someone new.</p><span class=\"tag\">WE'RE ONLY GETTING STARTED.</span></div></section>\n<section class=\"events\" id=\"events\"><span class=\"eyebrow\">002 / THE EVENTS</span><h2>WHAT WE'VE<br/>BEEN UP TO.</h2><article class=\"event\" aria-labelledby=\"event-title\"><div class=\"event-copy\"><span class=\"event-label\">PAST EVENT / EDITION 001</span><h3 id=\"event-title\">MAKE<br/>YOUR <span>CASE.</span></h3><p>Our first Pitch Night brought people together. The event may be over, but its story is still here. Read our thank-you note, visit the Connection Board and look back at the programme.</p><div class=\"event-details\"><span>13 NOVEMBER 2026</span><span>HAATSO, ACCRA</span></div><a class=\"btn\" href=\"/events/pitch-night-001/\">EXPLORE EDITION 001 <span aria-hidden=\"true\">↗</span></a></div><div class=\"event-poster\" aria-label=\"Make Your Case Edition 001 typographic poster\"><div>MAKE<br/>YOUR<br/>CASE.<small>OFFSCRIPT / PITCH NIGHT 001</small></div></div></article></section>\n<section class=\"next\" id=\"connect\"><div><span class=\"eyebrow\">003 / THE CONVERSATION CONTINUES</span><h2>STAY <span>IN</span><br/>THE ROOM.</h2><p>Were you at Pitch Night? The Connection Board is still open. Tell us what you thought, and help shape what comes next.</p></div><a class=\"btn\" href=\"/events/pitch-night-001/#memories\">GO TO THE CONNECTION BOARD <span aria-hidden=\"true\">↗</span></a></section>\n</main>\n<footer><span>© 2026 OFFSCRIPT · BEYOND THE USUAL. INTO CONNECTION.</span><a href=\"/events/pitch-night-001/\">PITCH NIGHT 001 ↗</a></footer>\n</body>\n</html>";

const ORIGIN="https://makeyourcase.vercel.app";
const EVENT="/events/pitch-night-001";
const PUBLIC="https://offscriptgh.com";
addEventListener("fetch",event=>event.respondWith(handle(event.request)));
function isPreview(url){return url.hostname.endsWith(".workers.dev")}
function headersBase(){return {"X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"}}
function htmlResponse(page,request){
 const u=new URL(request.url);
 const headers={"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=120",...headersBase()};
 if(isPreview(u))headers["X-Robots-Tag"]="noindex";
 return new Response(page,{status:200,headers});
}
async function handle(request){
 const url=new URL(request.url);
 const path=url.pathname;
 if(url.hostname==="www.offscriptgh.com") return Response.redirect("https://offscriptgh.com"+path+url.search+url.hash,308);
 if(path==="/"){
  if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method not allowed",{status:405});
  return htmlResponse(HOME,request);
 }
 if(path===EVENT) return Response.redirect(url.origin+EVENT+"/"+url.search,308);
 if(path.startsWith(EVENT+"/")) return forward(request,path.slice(EVENT.length)||"/",true);
 if(path==="/site-feedback.html")return Response.redirect(url.origin+EVENT+"/site-feedback.html",308);
 if(path.startsWith("/api/")||path.startsWith("/admin/"))return forward(request,path,false);
 if(path.startsWith("/assets/")||path==="/favicon.svg")return forward(request,path,false);
 return new Response("Page not found",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8",...headersBase()}});
}
async function forward(request,path,eventPage){
 const incoming=new URL(request.url),target=new URL(ORIGIN);
 target.pathname=path;
 target.search=incoming.search;
 const method=request.method;
 const allowed=["GET","HEAD","POST","PUT","DELETE","OPTIONS"];
 if(!allowed.includes(method))return new Response("Method not allowed",{status:405});
 const upstreamHeaders=new Headers(request.headers);
 upstreamHeaders.delete("host");
 upstreamHeaders.delete("x-forwarded-host");
 upstreamHeaders.delete("x-forwarded-proto");
 upstreamHeaders.delete("cf-connecting-ip");
 upstreamHeaders.delete("cf-ipcountry");
 upstreamHeaders.delete("cf-ray");
 // Only the publicly served Offscript origin can send cross-origin-protected writes.
 if(!["GET","HEAD","OPTIONS"].includes(method)&&path.startsWith("/api/")){
  if(upstreamHeaders.get("origin")!==incoming.origin) return new Response("Origin refused",{status:403});
  upstreamHeaders.set("origin",ORIGIN);
 }
 let upstream;
 try{
  upstream=await fetch(new Request(target.toString(),{
   method,headers:upstreamHeaders,body:["GET","HEAD"].includes(method)?undefined:request.body,redirect:"manual"
  }));
 }catch(e){return new Response("Event page temporarily unavailable",{status:502,headers:{"Cache-Control":"no-store"}})}
 const responseHeaders=new Headers(upstream.headers);
 responseHeaders.set("X-Content-Type-Options","nosniff");
 if(isPreview(incoming))responseHeaders.set("X-Robots-Tag","noindex");
 const loc=responseHeaders.get("Location");
 if(loc){
   const dest=new URL(loc,target);
   if(dest.origin===ORIGIN){
     responseHeaders.set("Location",incoming.origin+(eventPage?EVENT:"")+dest.pathname+dest.search+dest.hash);
   }
 }
 const ct=(responseHeaders.get("Content-Type")||"").toLowerCase();
 if(eventPage&&ct.includes("text/html")&&method==="GET"&&upstream.status===200){
  let html=await upstream.text();
  // Absolute-root resources in the archive must continue resolving inside the archive.
  html=html.replace(/(href|src)=(["'])\/(?!\/)/gi,(full,attr,q)=>attr+"="+q+EVENT+"/");
  html=html.replace(/href=(["'])\/events\/pitch-night-001\/\1/g,'href="/"');
  html=html.replaceAll(ORIGIN,PUBLIC+EVENT);
  if(path==="/"||path==="/index.html"){
    html=html.replace("</head>",'<link rel="canonical" href="'+PUBLIC+EVENT+'/"/></head>');
  }
  for(const h of ["Content-Length","Content-Encoding","ETag"])responseHeaders.delete(h);
  return new Response(html,{status:upstream.status,headers:responseHeaders});
 }
 return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
}
