import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, validToken } from "@/lib/auth";
import { parseFilters } from "@/lib/filters";
import { loadReport } from "@/lib/report";
import { Dashboard } from "@/components/dashboard";
export const dynamic="force-dynamic";
export const revalidate=0;
type Params={ [key:string]:string|string[]|undefined };
export default async function Analytics({searchParams}:{searchParams:Promise<Params>}) {
  const session=(await cookies()).get(COOKIE)?.value;
  if(!validToken(session)) redirect("/login");
  const raw=await searchParams;
  const entries=new URLSearchParams();
  for(const [key,value] of Object.entries(raw))if(typeof value==="string")entries.set(key,value);
  const filters=parseFilters(entries);
  const [report,unscoped]=await Promise.all([
    loadReport(filters),
    filters.dimension==="all"?Promise.resolve(null):loadReport({...filters,dimension:"all",value:""})
  ]);
  return <Dashboard report={report} filterOptions={(unscoped||report).breakdowns}/>;
}
