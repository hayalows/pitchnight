import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * The public Offscript Worker is the only allowed entry to this application.
 * Cron calls use their own short-lived execution path and a separate secret.
 * Do not rely on client-supplied Origin or IP headers to authenticate.
 */
function sameSecret(received:string | null, expected:string):boolean {
  if (!received || !expected) return false;
  const x=Buffer.from(received), y=Buffer.from(expected);
  return x.length===y.length && timingSafeEqual(x,y);
}
export function proxy(request:NextRequest) {
  const path=request.nextUrl.pathname;
  const cron=process.env.CRON_SECRET||"";
  const bearer=request.headers.get("authorization");
  if(path.endsWith("/api/maintenance") && cron.length>=32 &&
    sameSecret(bearer,"Bearer "+cron)){
    return NextResponse.next();
  }
  const edge=process.env.OFFSCRIPT_ANALYTICS_EDGE_SECRET||"";
  if(edge.length<32){
    if(process.env.NODE_ENV==="development")return NextResponse.next();
    return new NextResponse("Analytics gateway not configured.",{status:503,headers:{"Cache-Control":"no-store"}});
  }
  if(!sameSecret(request.headers.get("x-offscript-edge-token"),edge))
    return new NextResponse("Forbidden",{status:403,headers:{"Cache-Control":"no-store"}});
  return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
