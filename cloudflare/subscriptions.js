// OffScript email signup backend. D1 + Resend, no secrets in source control.
const MAIL_FROM="OffScript <hello@offscriptgh.com>";
const MAIL_REPLY="offscript.beyondtheusual@gmail.com";
const MAIL_SITE="https://offscriptgh.com";
const enc=new TextEncoder();
function dataOut(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
function dbtime(d=new Date()){return d.toISOString().slice(0,19).replace("T"," ")}
function b64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function sha256(s){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function signature(env,text){let k=await crypto.subtle.importKey("raw",enc.encode(env.SUBSCRIBE_SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return b64url(new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(text))))}
async function validSig(env,id,sig){if(!/^[0-9a-f-]{36}$/.test(id)||!/^[A-Za-z0-9_-]{43}$/.test(sig))return false;let expect=await signature(env,id),x=0;for(let i=0;i<expect.length;i++)x|=expect.charCodeAt(i)^sig.charCodeAt(i);return x===0}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function mailHtml(title,paras,label,url,footer){
 let ps=paras.map(p=>'<p style="margin:0 0 19px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#24211e">'+esc(p)+'</p>').join("");
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>'+esc(title)+'</title></head><body style="margin:0;background-color:#faf4e7"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#faf4e7" style="background-color:#faf4e7"><tr><td align="center" style="padding-top:30px;padding-right:14px;padding-bottom:30px;padding-left:14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border:2px solid #171717;background-color:#fffdf5"><tr><td bgcolor="#fffdf5" style="background-color:#fffdf5;border-bottom:5px solid #1036af;padding-top:16px;padding-right:30px;padding-bottom:16px;padding-left:30px"><a href="https://offscriptgh.com/" style="display:inline-block;text-decoration:none"><img src="https://offscriptgh.com/events/pitch-night-001/assets/offscript-logo.png" alt="OffScript" width="126" height="126" style="display:block;width:126px;height:126px;max-width:100%;border:0;outline:none;text-decoration:none"></a></td></tr><tr><td style="padding-top:35px;padding-right:30px;padding-bottom:35px;padding-left:30px"><p style="margin:0 0 13px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;font-weight:bold;letter-spacing:1.5px;color:#1036af">BEYOND THE USUAL. INTO CONNECTION.</p><h1 style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:37px;line-height:42px;letter-spacing:-1px;color:#171717">'+esc(title)+'</h1>'+ps+'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:23px;margin-bottom:27px"><tr><td bgcolor="#ffd63b" style="background-color:#ffd63b;border:2px solid #171717;padding-top:16px;padding-right:22px;padding-bottom:16px;padding-left:22px"><a href="'+esc(url)+'" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:bold;letter-spacing:1px;text-decoration:none;color:#171717">'+esc(label)+' ↗</a></td></tr></table><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#171717">With care,<br><strong>The OffScript team</strong></p></td></tr><tr><td bgcolor="#141414" style="background-color:#141414;padding-top:20px;padding-right:30px;padding-bottom:20px;padding-left:30px"><p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#faf4e7">'+footer+'</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#faf4e7">OffScript · Ghana · <a href="https://offscriptgh.com/" style="color:#ffd63b">offscriptgh.com</a></p></td></tr></table></td></tr></table></body></html>'
}
async function sendOffscript(env,email,subject,title,paras,label,url,footer,plainFooter,idempotency){
 let html=mailHtml(title,paras,label,url,footer),text=[title,...paras,label+": "+url,"With care, The OffScript team",plainFooter].join("\n\n");
 let r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":idempotency},body:JSON.stringify({from:MAIL_FROM,to:[email],reply_to:MAIL_REPLY,subject,html,text})});
 if(!r.ok)throw Error("Email provider returned status "+r.status);
 return r.json();
}
function responsePage(title,msg,ok=true){
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/offscript.css"><title>'+esc(title)+' | OffScript</title></head><body><main class="confirmation-page"><div class="confirmation-card"><a class="label back-home" href="/">← OFFSCRIPT HOME</a><span class="label confirmation-kicker">'+(ok?"WELCOME TO OFFSCRIPT":"A QUICK NOTE")+'</span><h1>'+esc(title)+'</h1><p>'+esc(msg)+'</p><a class="btn" href="/events/">EXPLORE THE EVENTS ↗</a></div></main></body></html>';
 return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer"}});
}
async function signup(request,env){
 if(request.method!=="POST")return dataOut({error:"Method not allowed"},405);
 const u=new URL(request.url);
 if(request.headers.get("Origin")!==u.origin)return dataOut({error:"Request not allowed"},403);
 if(!/application\/json/i.test(request.headers.get("Content-Type")||""))return dataOut({error:"Use JSON"},415);
 if(Number(request.headers.get("Content-Length")||0)>4096)return dataOut({error:"Request too large"},413);
 let body;try{let raw=await request.text();if(raw.length>4096)throw Error("large");body=JSON.parse(raw)}catch{return dataOut({error:"Enter a valid email address."},400)}
 if(body.company)return dataOut({message:"If this address needs confirmation, an email will arrive."});
 let email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
 if(email.length>254||email.length<6||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email))return dataOut({error:"Enter a valid email address."},400);
 if(body.consent!==true)return dataOut({error:"Please agree to receive event emails first."},400);
 if(!env.OFFSCRIPT_DB||!env.RESEND_API_KEY||!env.SUBSCRIBE_SIGNING_SECRET)return dataOut({error:"The list is temporarily unavailable."},503);
 let source=body.source==="offscriptgh-join"?"offscriptgh-join":"offscriptgh-home";
 try{
  let ip=request.headers.get("CF-Connecting-IP")||"unknown",identity=await signature(env,"ip:"+ip);
  let now=Math.floor(Date.now()/1000),win=now-now%3600;
  let count=await env.OFFSCRIPT_DB.prepare("INSERT INTO signup_rates(identity_hash,attempts,window_start) VALUES (?1,1,?2) ON CONFLICT(identity_hash) DO UPDATE SET attempts=CASE WHEN window_start=?2 THEN attempts+1 ELSE 1 END,window_start=?2 RETURNING attempts").bind(identity,win).first();
  if(count&&count.attempts>6)return dataOut({error:"Too many attempts. Try again in an hour."},429);
  let row=await env.OFFSCRIPT_DB.prepare("SELECT id,status,verification_sent_at FROM subscribers WHERE email=?1").bind(email).first();
  if(row?.status==="active"||(row?.status==="pending"&&Date.parse(String(row.verification_sent_at).replace(" ","T")+"Z")>Date.now()-120000))return dataOut({message:"If you've already confirmed this address, you're on the list. Otherwise, check your inbox for the confirmation link."});
  let token=b64url(crypto.getRandomValues(new Uint8Array(32))),hash=await sha256(token),id=row?.id||crypto.randomUUID(),current=dbtime(),expiry=dbtime(new Date(Date.now()+172800000));
  await env.OFFSCRIPT_DB.prepare("INSERT INTO subscribers(id,email,status,source,consent_at,created_at,updated_at,verify_token_hash,verify_expires,verification_sent_at,unsubscribed_at) VALUES (?1,?2,'pending',?3,?4,?4,?4,?5,?6,?4,NULL) ON CONFLICT(email) DO UPDATE SET status='pending',source=excluded.source,consent_at=excluded.consent_at,updated_at=excluded.updated_at,verify_token_hash=excluded.verify_token_hash,verify_expires=excluded.verify_expires,verification_sent_at=excluded.verification_sent_at,unsubscribed_at=NULL").bind(id,email,source,current,hash,expiry).run();
  let url=MAIL_SITE+"/confirm?token="+encodeURIComponent(token);
  let paras=["Thanks for finding your way to OffScript. Our first Pitch Night gave people a reason to come together, speak up for their friends and meet someone new.","You asked to hear what comes next. Please confirm your email so we know it was really you. After that, we'll send you a short welcome and share news when there is something to tell you."];
  try { await sendOffscript(env,email,"One quick step with OffScript","One more step.",paras,"CONFIRM MY EMAIL",url,"If you did not request this, you can ignore the message. This link expires in 48 hours.","If you did not request this, please ignore it.","offscript-confirm-"+id+"-"+token.slice(0,10)); }
  catch(e){try{await env.OFFSCRIPT_DB.prepare("UPDATE subscribers SET verification_sent_at=NULL WHERE id=?1 AND verify_token_hash=?2").bind(id,hash).run()}catch{}throw e}
  return dataOut({message:"If you've already confirmed this address, you're on the list. Otherwise, check your inbox for the confirmation link."});
 }catch(e){console.error("OffScript signup failed:",String(e).slice(0,100));return dataOut({error:"We couldn't send that email right now. Please try again."},503)}
}
async function confirmEmail(request,env){
 if(!["GET","POST"].includes(request.method))return new Response("Method not allowed",{status:405});
 const requestUrl=new URL(request.url);
 let token=requestUrl.searchParams.get("token")||"";
 if(request.method==="POST"){
   // The random single-use email token authorizes this POST. A no-referrer page may omit the Origin header.
   try { const form=await request.formData(); token=String(form.get("token")||"") }catch{return responsePage("Link not found","This confirmation request isn't valid.",false)}
 }
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return responsePage("Link not found","This confirmation link is invalid.",false);
 // Mail scanners can open GET links. Only a deliberate POST may confirm a subscription.
 if(request.method==="GET"){
   const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/offscript.css"><title>Confirm your email | OffScript</title></head><body><main class="confirmation-page"><div class="confirmation-card"><a href="/" class="label back-home">← OFFSCRIPT HOME</a><span class="label confirmation-kicker">ONE MORE STEP</span><h1>Is this your email?</h1><p>Confirm that you want updates about future OffScript events. We will send a short welcome note after this.</p><form method="post" action="/confirm"><input type="hidden" name="token" value="'+token+'"><button type="submit" class="btn">YES, CONFIRM MY EMAIL ↗</button></form><p><a href="/" class="text-link">NOT NOW</a></p></div></main></body></html>';
   return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
 }
 if(!env.OFFSCRIPT_DB||!env.RESEND_API_KEY||!env.SUBSCRIBE_SIGNING_SECRET)return responsePage("Try again shortly","We cannot confirm emails just now. Please try again later.",false);
 try{
  let hash=await sha256(token);
  let row=await env.OFFSCRIPT_DB.prepare("SELECT id,email,status,verify_expires,welcome_sent_at FROM subscribers WHERE verify_token_hash=?1").bind(hash).first();
  if(!row)return responsePage("Link no longer active","That link may already have been used. You can join again from the homepage.",false);
  if(Date.parse(row.verify_expires.replace(" ","T")+"Z")<Date.now())return responsePage("Link expired","Go to the homepage and request a new confirmation email.",false);
  if(row.status==="unsubscribed")return responsePage("Not on the list","You can subscribe again from the homepage.",false);
  if(row.status==="pending")await env.OFFSCRIPT_DB.prepare("UPDATE subscribers SET status='active',verified_at=datetime('now'),updated_at=datetime('now') WHERE id=?1 AND status='pending'").bind(row.id).run();
  if(!row.welcome_sent_at){
   let sig=await signature(env,row.id),leave=MAIL_SITE+"/unsubscribe?sid="+row.id+"&sig="+sig;
   let paras=["You're on the OffScript list. It's good to have you here.","We began with Pitch Night because we wanted to make room for people to meet and share a good night together. There is more we'd like to do, and we're glad you want to hear about it.","We'll write when we have real news to share. In the meantime, you can look back at Edition 001."];
   try{
    await sendOffscript(env,row.email,"You're in. A note from OffScript","You're in.",paras,"SEE PITCH NIGHT 001",MAIL_SITE+"/events/pitch-night-001/","You can <a href=\""+leave+"\" style=\"color:#ffd63b\">leave the list</a> at any time.","Unsubscribe: "+leave,"offscript-welcome-"+row.id);
    await env.OFFSCRIPT_DB.prepare("UPDATE subscribers SET welcome_sent_at=datetime('now'),verify_token_hash=NULL,verify_expires=NULL,updated_at=datetime('now') WHERE id=?1").bind(row.id).run();
   }catch(e){console.error("OffScript welcome email failed:",String(e).slice(0,100));return responsePage("You're on the list","Your email is confirmed. The welcome message may take a little longer. You can open the confirmation link again to retry.")}
  }
  return responsePage("You're in.","Thanks for confirming your email. We'll be in touch when there's news from OffScript.");
 }catch(e){console.error("OffScript confirmation failed:",String(e).slice(0,100));return responsePage("Try again later","We couldn't confirm your email right now.",false)}
}
async function unsubscribeEmail(request,env){
 if(!["GET","POST"].includes(request.method))return new Response("Method not allowed",{status:405});
 let u=new URL(request.url),sid=u.searchParams.get("sid")||"",sig=u.searchParams.get("sig")||"";
 if(request.method==="POST"){
  // The signed unsubscribe link authorizes this POST even when the browser omits Origin.
  let d=await request.formData();sid=String(d.get("sid")||"");sig=String(d.get("sig")||"")
 }
 if(!env.OFFSCRIPT_DB||!env.SUBSCRIBE_SIGNING_SECRET||!(await validSig(env,sid,sig)))return responsePage("Link not found","That unsubscribe link is invalid.",false);
 if(request.method==="GET"){
  let html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/offscript.css"><title>Unsubscribe | OffScript</title></head><body><main class="confirmation-page"><div class="confirmation-card"><a class="label back-home" href="/">← OFFSCRIPT HOME</a><h1>Leave the list?</h1><p>We will stop sending you news about future OffScript events.</p><form method="post" action="/unsubscribe"><input type="hidden" name="sid" value="'+sid+'"><input type="hidden" name="sig" value="'+sig+'"><button type="submit" class="btn">YES, UNSUBSCRIBE</button></form><p><a href="/" class="text-link">KEEP ME ON THE LIST</a></p></div></main></body></html>';
  return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow"}});
 }
 try{await env.OFFSCRIPT_DB.prepare("UPDATE subscribers SET status='unsubscribed',unsubscribed_at=datetime('now'),updated_at=datetime('now'),verify_token_hash=NULL,verify_expires=NULL WHERE id=?1").bind(sid).run();return responsePage("You're off the list.","You won't get future OffScript event updates. Thanks for being here.")}
 catch{return responsePage("Try again later","We couldn't update your preference right now.",false)}
}
