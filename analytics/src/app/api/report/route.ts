import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { parseFilters } from "@/lib/filters";
import { loadReport } from "@/lib/report";

function csvCell(raw:unknown) {
  const value=String(raw??"");
  // Prevent spreadsheet applications from interpreting formula-like values.
  const safe=/^[=+@\-\t\r]/.test(value)?"'"+value:value;
  return '"'+safe.replace(/"/g,'""')+'"';
}
export async function GET(req:NextRequest){
  if(!(await isAdmin()))return NextResponse.json({error:"Unauthorised"},{status:401,headers:{"Cache-Control":"no-store"}});
  const report=await loadReport(parseFilters(req.nextUrl.searchParams));
  if(report.status!=="ready")return NextResponse.json({error:"Report is not available"},{status:503,headers:{"Cache-Control":"no-store"}});
  if(req.nextUrl.searchParams.get("format")!=="csv")return NextResponse.json({error:"Unsupported format"},{status:400});
  const lines=[
    ["Date (UTC)","Visitors","Page views","Actions"].map(csvCell).join(","),
    ...report.trend.map(row=>[row.label,row.visitors,row.pageViews,row.actions].map(csvCell).join(",")),
    "",["Event","Sessions","Total actions"].map(csvCell).join(","),
    ...report.events.map(row=>[row.label,row.sessions,row.total].map(csvCell).join(",")),
    "",["Page","Visitors","Page views"].map(csvCell).join(","),
    ...report.breakdowns.page.map(row=>[row.label,row.visitors,row.views].map(csvCell).join(","))
  ];
  return new NextResponse(lines.join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="offscript-analytics.csv"',"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
