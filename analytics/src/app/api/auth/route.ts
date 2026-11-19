import { NextRequest, NextResponse } from "next/server";
import { authConfigured, COOKIE, correctPassword, permittedLoginAttempt, sameOrigin, token } from "@/lib/auth";

const publicOrigin = process.env.OFFSCRIPT_ANALYTICS_PUBLIC_ORIGIN || "https://offscriptgh.com";
function redirect(req:NextRequest,path:string){
  const origin=process.env.NODE_ENV==="development"?req.nextUrl.origin:publicOrigin;
  return NextResponse.redirect(new URL(path,origin),{status:303});
}
export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  if(!sameOrigin(origin,req.nextUrl.origin)) return new NextResponse("Forbidden",{status:403});
  if(!authConfigured())return new NextResponse("Analytics access is not configured.",{status:503});
  if(Number(req.headers.get("content-length")||0)>4096)return new NextResponse("Request too large",{status:413});
  const form=await req.formData().catch(()=>null);
  const password=form?.get("password");
  if(typeof password!=="string"||password.length>512)return redirect(req,"/analytics/login?reason=invalid");
  try{
    const address=req.headers.get("x-offscript-client-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
    if(!(await permittedLoginAttempt(address)))return redirect(req,"/analytics/login?reason=rate");
  }catch{return new NextResponse("Login service unavailable",{status:503})}
  if(!correctPassword(password))return redirect(req,"/analytics/login?reason=invalid");
  const response=redirect(req,"/analytics");
  response.cookies.set(COOKIE,token(),{httpOnly:true,secure:process.env.NODE_ENV!=="development",
    sameSite:"strict",path:"/analytics",maxAge:8*60*60});
  return response;
}
export async function DELETE(req:NextRequest){
  if(!sameOrigin(req.headers.get("origin"),req.nextUrl.origin)) return new NextResponse("Forbidden",{status:403});
  const response=NextResponse.json({ok:true});
  response.cookies.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV!=="development",
    sameSite:"strict",path:"/analytics",maxAge:0});
  return response;
}
