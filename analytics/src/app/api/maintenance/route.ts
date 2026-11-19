import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { databaseConfigured, query } from "@/lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";

function authorised(header:string|null,secret:string):boolean{
  if(secret.length<32||!header)return false;
  const provided=Buffer.from(header),expected=Buffer.from("Bearer "+secret);
  return provided.length===expected.length && timingSafeEqual(provided,expected);
}
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET||"";
  if(!authorised(request.headers.get("authorization"),secret))
    return NextResponse.json({error:"Unauthorised"},{status:401,headers:{"Cache-Control":"no-store"}});
  if(!databaseConfigured())
    return NextResponse.json({error:"Database unavailable"},{status:503});
  try{
    // Records have a 90-day retention period. Clear failed login counters after 48h.
    // Deletes only old anonymous analytics records, never Offscript mailing-list data.
    const result=await query<{deleted:unknown}>(
      "WITH removed AS (DELETE FROM offscript_analytics_events "+
      "WHERE created_at < NOW() - interval '90 days' RETURNING id) "+
      "SELECT count(*) AS deleted FROM removed");
    await query("DELETE FROM offscript_analytics_login_attempts "+
      "WHERE window_start < NOW() - interval '48 hours'");
    return NextResponse.json({ok:true,removed:Number(result[0]?.deleted||0)},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Maintenance failed"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
