import "server-only";
import { databaseConfigured, number, query } from "./db";
import { bounds, labelFor, type Filters, where } from "./filters";

export type Breakdown = { label:string; visitors:number; views:number };
export type TrendPoint = { label:string; visitors:number; pageViews:number; actions:number };
export type ActionRow = { label:string; sessions:number; total:number };
export type EngagementRow = { seconds:number; sessions:number };
export type PageEngagement = {page:string; sessions:number; minimumSeconds:number; engaged60:number};
export type Report = {
  status: "ready"|"unconfigured"|"error";
  filters: Filters; audienceLabel:string; generatedAt:string; latestEventAt:string|null;
  metrics: {visitors:number; sessions:number; pageViews:number; actionSessions:number; actions:number; returning:number; activeNow:number; engaged60:number};
  previous: {visitors:number; pageViews:number; actions:number}|null;
  trend: TrendPoint[]; activity: {date:string;visitors:number}[];
  breakdowns: Record<"country"|"device"|"browser"|"source"|"page"|"edition",Breakdown[]>;
  events:ActionRow[]; engagement: EngagementRow[]; pageEngagement:PageEngagement[];
};
const emptyRows = () => ({country:[],device:[],browser:[],source:[],page:[],edition:[]});
const noMetrics = () => ({visitors:0,sessions:0,pageViews:0,actionSessions:0,actions:0,returning:0,activeNow:0,engaged60:0});
export function emptyReport(filters:Filters,status:"unconfigured"|"error"):Report {
  return {status,filters,audienceLabel:labelFor(filters),generatedAt:new Date().toISOString(),
    latestEventAt:null,metrics:noMetrics(),previous:null,trend:[],activity:[],breakdowns:emptyRows(),
    events:[],engagement:[],pageEngagement:[]};
}
const dimCols = {country:"country",device:"device",browser:"browser",source:"source",page:"page_path",edition:"event_edition"} as const;
async function breakdown(field:string, clause:string, params:unknown[]):Promise<Breakdown[]> {
  const rows = await query<{label:unknown;visitors:unknown;views:unknown}>(
    "SELECT coalesce(nullif(" + field + ",''),'Unknown') label, "+
    "count(DISTINCT visitor_id) FILTER (WHERE event_name='page_view') visitors, "+
    "count(*) FILTER (WHERE event_name='page_view') views "+
    "FROM offscript_analytics_events WHERE " + clause + " AND event_name='page_view' GROUP BY 1 ORDER BY views DESC LIMIT 18",
    params
  );
  return rows.map(r=>({label:String(r.label),visitors:number(r.visitors),views:number(r.views)}));
}
export async function loadReport(filters:Filters):Promise<Report> {
  if(!databaseConfigured()) return emptyReport(filters,"unconfigured");
  const base = emptyReport(filters,"error");
  const period = bounds(filters);
  const scope = where(filters,period.start,period.end);
  const clause = scope.sql, params=scope.params;
  const lastPeriodStart = new Date(period.start.getTime()-(period.end.getTime()-period.start.getTime()));
  try {
    const [totals,trend,actions,engagement,activity,pageTime,presence,...groups] = await Promise.all([
      query<{
        visitors:unknown;sessions:unknown;page_views:unknown;actions:unknown;action_sessions:unknown;
        returning_visitors:unknown;engaged_60:unknown;latest_at:unknown
      }>("SELECT "+
      "count(DISTINCT visitor_id) FILTER(WHERE event_name='page_view') visitors, "+
      "count(DISTINCT session_id) FILTER(WHERE event_name='page_view') sessions, "+
      "count(*) FILTER(WHERE event_name='page_view') page_views, "+
      "count(*) FILTER(WHERE event_name NOT IN ('page_view','presence','engagement')) actions, "+
      "count(DISTINCT session_id) FILTER(WHERE event_name NOT IN ('page_view','presence','engagement')) action_sessions, "+
      "count(DISTINCT visitor_id) FILTER(WHERE event_name='page_view' AND "+
      "EXISTS(SELECT 1 FROM offscript_analytics_events prior WHERE prior.visitor_id=offscript_analytics_events.visitor_id "+
      "AND prior.event_name='page_view' AND prior.created_at < $1::timestamptz)) returning_visitors, "+
      "count(DISTINCT session_id) FILTER(WHERE event_name='engagement' AND metadata->>'milestoneSeconds'='60') engaged_60, "+
      "max(created_at) latest_at "+
      "FROM offscript_analytics_events WHERE "+clause,params),
      query<{label:unknown;visitors:unknown;page_views:unknown;actions:unknown}>(
        "SELECT to_char(date_trunc('day',created_at AT TIME ZONE 'UTC'),'YYYY-MM-DD') label, "+
        "count(DISTINCT visitor_id) FILTER(WHERE event_name='page_view') visitors, "+
        "count(*) FILTER(WHERE event_name='page_view') page_views, "+
        "count(*) FILTER(WHERE event_name NOT IN ('page_view','presence','engagement')) actions "+
        "FROM offscript_analytics_events WHERE "+clause+" GROUP BY 1 ORDER BY 1",params),
      query<{label:unknown;sessions:unknown;total:unknown}>(
        "SELECT event_name label, count(DISTINCT session_id) sessions, count(*) total FROM offscript_analytics_events "+
        "WHERE "+clause+" AND event_name NOT IN ('presence','engagement','page_view') "+
        "GROUP BY event_name ORDER BY total DESC",params),
      query<{seconds:unknown;sessions:unknown}>(
        "SELECT (metadata->>'milestoneSeconds')::int seconds,count(DISTINCT session_id) sessions "+
        "FROM offscript_analytics_events WHERE "+clause+
        " AND event_name='engagement' AND metadata ? 'milestoneSeconds' "+
        "GROUP BY 1 ORDER BY 1",params),
      query<{date:unknown;visitors:unknown}>(
        "SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') date, "+
        "count(DISTINCT visitor_id) visitors FROM offscript_analytics_events "+
        "WHERE "+where(filters,new Date(Date.now()-90*86400000),new Date()).sql+
        " AND event_name='page_view' GROUP BY 1 ORDER BY 1",
        where(filters,new Date(Date.now()-90*86400000),new Date()).params),
      query<{page:unknown;sessions:unknown;minimum_seconds:unknown;engaged_60:unknown}>(
        "WITH session_page AS (SELECT page_path,session_id,max((metadata->>'milestoneSeconds')::int) milestone "+
        "FROM offscript_analytics_events WHERE "+clause+
        " AND event_name='engagement' AND metadata ? 'milestoneSeconds' GROUP BY page_path,session_id) "+
        "SELECT page_path page,count(*) sessions,round(avg(milestone)) minimum_seconds, "+
        "count(*) FILTER(WHERE milestone>=60) engaged_60 FROM session_page GROUP BY page_path "+
        "ORDER BY sessions DESC LIMIT 12",params),
      query<{total:unknown}>(
        "SELECT count(DISTINCT visitor_id) total FROM offscript_analytics_events WHERE event_name='presence' "+
        "AND created_at>=now()-interval '90 seconds'"+
        (filters.dimension!=='all'&&filters.value?" AND "+({country:"country",device:"device",browser:"browser",source:"source",page:"page_path",edition:"event_edition"} as const)[filters.dimension]+" = $1":""),
        filters.dimension!=='all'&&filters.value?[filters.value]:[]),
      ...Object.values(dimCols).map(c=>breakdown(c,clause,params))
    ]);
    const row=totals[0]||{} as typeof totals[number];
    base.metrics = {visitors:number(row.visitors),sessions:number(row.sessions),pageViews:number(row.page_views),
      actions:number(row.actions),actionSessions:number(row.action_sessions),
      returning:number(row.returning_visitors),engaged60:number(row.engaged_60),activeNow:number(presence[0]?.total)};
    base.latestEventAt=row.latest_at ? new Date(String(row.latest_at)).toISOString() : null;
    base.trend=trend.map(r=>({label:String(r.label),visitors:number(r.visitors),pageViews:number(r.page_views),actions:number(r.actions)}));
    base.events=actions.map(r=>({label:String(r.label),sessions:number(r.sessions),total:number(r.total)}));
    base.engagement=engagement.map(r=>({seconds:number(r.seconds),sessions:number(r.sessions)}));
    base.pageEngagement=pageTime.map(r=>({page:String(r.page),sessions:number(r.sessions),
      minimumSeconds:number(r.minimum_seconds),engaged60:number(r.engaged_60)}));
    base.activity=activity.map(r=>({date:String(r.date),visitors:number(r.visitors)}));
    Object.keys(dimCols).forEach((d,i)=>{base.breakdowns[d as keyof typeof dimCols]=groups[i]});
    if(filters.range!=="all"){
      const p=where(filters,lastPeriodStart,period.start);
      const prev=await query<{visitors:unknown;page_views:unknown;actions:unknown}>(
        "SELECT count(DISTINCT visitor_id) FILTER(WHERE event_name='page_view') visitors, "+
        "count(*) FILTER(WHERE event_name='page_view') page_views, "+
        "count(*) FILTER(WHERE event_name NOT IN ('page_view','presence','engagement')) actions "+
        "FROM offscript_analytics_events WHERE "+p.sql,p.params);
      base.previous={visitors:number(prev[0]?.visitors),pageViews:number(prev[0]?.page_views),actions:number(prev[0]?.actions)};
    }
    base.status="ready";
  } catch(error){
    console.error("Offscript analytics report query failed:",error instanceof Error?error.name:"unknown");
  }
  return base;
}
