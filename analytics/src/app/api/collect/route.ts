import { NextRequest, NextResponse } from "next/server";
import { databaseConfigured, query } from "@/lib/db";

export const runtime = "nodejs";
const EVENTS = new Set(["page_view","presence","engagement","event_open","signup_open","signup_submit",
  "signup_success","board_open","prop_open","venue_open","nav_click","share_click"]);
const MILESTONES = new Set([10,30,60,180,300,600]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(value:unknown,max=80):string {
  return typeof value==="string" ? value.replace(/[^a-zA-Z0-9_ .:/-]/g,"").slice(0,max) : "";
}
function bad(status:number){return NextResponse.json({error:"Invalid analytics event"},{status,headers:{"Cache-Control":"no-store"}})}
function browserType(ua:string){
  return /firefox/i.test(ua)?"Firefox":/edg\//i.test(ua)?"Edge":/chrome|crios/i.test(ua)?"Chrome":/safari/i.test(ua)?"Safari":"Other";
}
function deviceType(ua:string){return /tablet|ipad/i.test(ua)?"Tablet":/mobile|iphone|android/i.test(ua)?"Mobile":"Desktop"}
function allowedPage(path:string){
  return path==="/"||/^\/(?:about|events|join|privacy)(?:\/|$)/.test(path)||path==="/site-feedback.html";
}
export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  const expected=process.env.OFFSCRIPT_ANALYTICS_PUBLIC_ORIGIN || "https://offscriptgh.com";
  if(origin!==expected && !(process.env.NODE_ENV==="development"&&origin===req.nextUrl.origin)) return bad(403);
  if(!(req.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) return bad(415);
  const size=Number(req.headers.get("content-length")||0);
  if(size>4096) return bad(413);
  let body:Record<string,unknown>;
  try{
    const raw=await req.text();
    if(raw.length>4096) return bad(413);
    body=JSON.parse(raw);
  }catch{return bad(400)}
  if(!body||typeof body!=="object"||Array.isArray(body))return bad(400);
  const eventName=body.eventName, path=body.pagePath;
  if(typeof eventName!=="string"||!EVENTS.has(eventName)||typeof path!=="string"||path.length>180||!allowedPage(path))return bad(400);
  if(![body.eventId,body.visitorId,body.sessionId].every(v=>typeof v==="string"&&UUID.test(v)))return bad(400);
  const attr=body.attribution && typeof body.attribution==="object" && !Array.isArray(body.attribution)
    ? body.attribution as Record<string,unknown>: {};
  const ms=body.milestoneSeconds;
  if(eventName==="engagement" && (typeof ms!=="number"||!MILESTONES.has(ms))) return bad(400);
  const source=clean(attr.source,80)||"Direct / unknown";
  const campaign=clean(attr.campaign,80)||"None";
  const metadata=eventName==="engagement"?{milestoneSeconds:ms}:{};
  if(!databaseConfigured())return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}});
  const ua=req.headers.get("user-agent")||"";
  const countryHeader=req.headers.get("x-offscript-country")||"";
  const country=/^[A-Z]{2}$/.test(countryHeader)?countryHeader:"Unknown";
  const edition=path.startsWith("/events/")?(path.split("/")[2]||"main"):"main";
  try{
    await query(
      "INSERT INTO offscript_analytics_events "+
      "(event_id,visitor_id,session_id,event_name,page_path,event_edition,country,device,browser,source,campaign,metadata) "+
      "SELECT $1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb "+
      "WHERE (SELECT count(*) FROM offscript_analytics_events WHERE session_id=$3::uuid "+
      "AND created_at>=now()-interval '10 minutes') < 180 "+
      "ON CONFLICT(event_id) DO NOTHING",
      [body.eventId,body.visitorId,body.sessionId,eventName,path,edition,country,deviceType(ua),
      browserType(ua),source,campaign,JSON.stringify(metadata)]);
  }catch(err){
    console.error("Offscript collector storage error:",err instanceof Error?err.name:"unknown");
    return new NextResponse(null,{status:503,headers:{"Cache-Control":"no-store"}});
  }
  return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}});
}
