"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChartLineUp as Activity, ArrowClockwise, ArrowRight, ArrowUpRight, CalendarBlank, CaretDown,
  Check, ChartLineUp, Clock, DownloadSimple, FunnelSimple, Globe, House, Info, List,
  LockKey, SignOut, Users, X } from "@phosphor-icons/react";
import { DIMENSIONS, RANGE_OPTIONS, type Dimension, type Filters, type Range } from "@/lib/filters";
import type { Breakdown, Report, TrendPoint } from "@/lib/report";

type DashboardProps={report:Report;filterOptions:Report["breakdowns"]};
type Metric="visitors"|"pageViews"|"actions";
const metricLabels:Record<Metric,string>={visitors:"Visitors",pageViews:"Page views",actions:"Actions"};
const METRIC_COLORS:Record<Metric,string>={visitors:"#e8382b",pageViews:"#177c73",actions:"#b07315"};
function integer(value:number){return value.toLocaleString("en-GB")}
function delta(current:number,previous:number|null) {
  if(previous===null)return null;
  if(previous===0)return current===0?"0%":"New";
  const amount=Math.round(((current-previous)/previous)*100);
  return (amount>0?"+":"")+amount+"%";
}
function dateLabel(value:string) {
  const d=new Date(value+"T00:00:00Z");
  return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}).format(d);
}
function queryUrl(filters:Filters,updates:Partial<Filters>) {
  const next={...filters,...updates};
  const params=new URLSearchParams({range:next.range});
  if(next.range==="custom"&&next.from&&next.to){params.set("from",next.from);params.set("to",next.to);}
  if(next.dimension!=="all"&&next.value){params.set("dimension",next.dimension);params.set("value",next.value);}
  return "/?"+params.toString();
}
function rangeLabel(filters:Filters) {
  if(filters.range==="custom"&&filters.from&&filters.to)return dateLabel(filters.from)+" – "+dateLabel(filters.to);
  return RANGE_OPTIONS.find(x=>x[0]===filters.range)?.[1]||"Last 30 days";
}
function Disclosure({title,children}:{title:string;children:React.ReactNode}) {
  return <details className="disclosure"><summary>{title}<CaretDown size={15} aria-hidden="true"/></summary>{children}</details>;
}
function DashboardFilters({filters,options}:{filters:Filters;options:Report["breakdowns"]}) {
  const router=useRouter();
  const [open,setOpen]=useState<"date"|"audience"|null>(null);
  const [mobile,setMobile]=useState<"date"|"audience"|null>(null);
  const [dimension,setDimension]=useState<Dimension>(filters.dimension==="all"?"country":filters.dimension);
  const [from,setFrom]=useState(filters.from);
  const [to,setTo]=useState(filters.to);
  const dateBox=useRef<HTMLDivElement>(null),audienceBox=useRef<HTMLDivElement>(null),sheet=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const onClick=(e:PointerEvent)=>{
      if(dateBox.current&&!dateBox.current.contains(e.target as Node)&&audienceBox.current&&!audienceBox.current.contains(e.target as Node))setOpen(null);
    };
    const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(null)};
    document.addEventListener("pointerdown",onClick);document.addEventListener("keydown",onKey);
    return()=>{document.removeEventListener("pointerdown",onClick);document.removeEventListener("keydown",onKey)};
  },[]);
  useEffect(()=>{const dialog=sheet.current;if(!dialog)return;if(mobile&&!dialog.open)dialog.showModal();if(!mobile&&dialog.open)dialog.close()},[mobile]);
  const chooseDate=(range:Range,start="",end="")=>{
    router.push(queryUrl(filters,{range,from:start,to:end}));setOpen(null);setMobile(null);
  };
  const chooseAudience=(d:Dimension,value:string)=>{
    router.push(queryUrl(filters,{dimension:d,value}));setOpen(null);setMobile(null);
  };
  const selectors = <div className="selectorFields">
    <div className="selectorCategories" role="group" aria-label="Audience filter categories">
      {DIMENSIONS.slice(1).map(([kind,label])=><button type="button" key={kind}
        className={dimension===kind?"category active":"category"} aria-pressed={dimension===kind}
        onClick={()=>setDimension(kind)}>{label}<ArrowRight size={14} aria-hidden="true"/></button>)}
    </div>
    <div className="selectorValues" role="group" aria-label={dimension+" values"}>
      <button type="button" className="optionRow" onClick={()=>chooseAudience("all","")}><span>All traffic</span>{filters.dimension==="all"&&<Check size={18}/>}</button>
      {options[dimension==="all"?"country":dimension].map(row=><button type="button" key={row.label} className="optionRow"
        onClick={()=>chooseAudience(dimension,row.label)}><span>{row.label}</span><small>{integer(row.visitors)}</small>{filters.dimension===dimension&&filters.value===row.label&&<Check size={17}/>}</button>)}
      {options[dimension==="all"?"country":dimension].length===0&&<p className="emptySmall">No values recorded for this filter yet.</p>}
    </div>
  </div>;
  const dateControls=<div className="dateOptions">
    <div className="presetGrid">{RANGE_OPTIONS.filter(x=>x[0]!=="custom").map(([id,label])=><button
      key={id} type="button" className={filters.range===id?"preset selected":"preset"} onClick={()=>chooseDate(id)}>
      {label}{filters.range===id&&<Check size={15} aria-hidden="true"/>}</button>)}</div>
    <div className="customDate"><p className="smallLabel">Custom dates · Ghana time (GMT)</p>
      <div className="customInputs"><label>From<input aria-label="From date" type="date" value={from} max={to||new Date().toISOString().slice(0,10)} onChange={e=>setFrom(e.target.value)}/></label>
      <label>To<input aria-label="To date" type="date" value={to} min={from||undefined} max={new Date().toISOString().slice(0,10)} onChange={e=>setTo(e.target.value)}/></label></div>
      <button className="applyButton" type="button" disabled={!from||!to||from>to||to>new Date().toISOString().slice(0,10)} onClick={()=>chooseDate("custom",from,to)}>Apply dates</button>
    </div>
  </div>;
  return <section className="reportFilters" aria-label="Report filters">
    <div className="desktopFilters">
      <div className="popupAnchor" ref={dateBox}>
        <button className="filterTrigger" type="button" aria-expanded={open==="date"} aria-haspopup="dialog"
          onClick={()=>setOpen(open==="date"?null:"date")}><CalendarBlank size={18}/><span>{rangeLabel(filters)}</span><CaretDown size={15}/></button>
        {open==="date"&&<div className="popover datePopover" role="dialog" aria-label="Choose report date range">{dateControls}</div>}
      </div>
      <div className="popupAnchor" ref={audienceBox}>
        <button className="filterTrigger" type="button" aria-expanded={open==="audience"} aria-haspopup="dialog"
          onClick={()=>setOpen(open==="audience"?null:"audience")}><FunnelSimple size={18}/><span>{filters.dimension==="all"?"All traffic":filters.dimension+": "+filters.value}</span><CaretDown size={15}/></button>
        {open==="audience"&&<div className="popover audiencePopover" role="dialog" aria-label="Choose audience filter">{selectors}</div>}
      </div>
    </div>
    <div className="mobileFilters">
      <button className="filterTrigger" type="button" onClick={()=>setMobile("date")}><CalendarBlank size={18}/>{rangeLabel(filters)}<CaretDown size={15}/></button>
      <button className="filterTrigger" type="button" onClick={()=>setMobile("audience")}><FunnelSimple size={18}/>{filters.dimension==="all"?"Audience":filters.value}<CaretDown size={15}/></button>
    </div>
    {(filters.dimension!=="all"&&filters.value)&&<button className="clearFilter" onClick={()=>chooseAudience("all","")} type="button">Clear audience <X size={14}/></button>}
    <dialog ref={sheet} className="filterSheet" onClose={()=>setMobile(null)}
      onClick={e=>{if(e.target===sheet.current)setMobile(null)}}>
      <div className="sheetHeader"><strong>{mobile==="date"?"Date range":"Audience"}</strong><button type="button" aria-label="Close filters" onClick={()=>setMobile(null)}><X size={22}/></button></div>
      <div className="sheetBody">{mobile==="date"?dateControls:selectors}</div>
      <div className="sheetFooter"><button type="button" onClick={()=>setMobile(null)}>Done</button></div>
    </dialog>
    <p className="reportScope">Showing {rangeLabel(filters).toLowerCase()} · {filters.dimension==="all"?"all traffic":filters.dimension+": "+filters.value} · Ghana time (GMT)</p>
  </section>;
}
function Kpi({name,value,detail,change,live=false}:{name:string;value:string;detail:string;change?:string|null;live?:boolean}){
  return <article className="kpi"><div className="kpiLabel"><span>{live&&<i className="liveDot"/>}{name}</span>{change&&<span className="kpiChange">{change}</span>}</div>
    <strong>{value}</strong><small>{detail}</small></article>;
}
function Trend({data,previous}:{data:TrendPoint[];previous:Report["previous"]}){
  const [metric,setMetric]=useState<Metric>("visitors");
  const points=useMemo(()=>{
    const vals=data.map(x=>x[metric]);const max=Math.max(1,...vals),n=Math.max(data.length,2);
    return data.map((x,i)=>({x:10+i*880/(n-1),y:185-(x[metric]/max)*155,label:x.label,value:x[metric]}));
  },[data,metric]);
  const line=points.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+" "+p.y.toFixed(1)).join(" ");
  const area=points.length?line+" L "+points[points.length-1].x+" 185 L "+points[0].x+" 185 Z":"";
  return <section className="panel trendPanel" aria-labelledby="trendTitle">
    <div className="panelHeader"><div><p className="eyebrow">01 / OVERVIEW</p><h2 id="trendTitle">Activity over time</h2><p>Understand how attention changes across the selected period.</p></div>
      <ChartLineUp size={24} weight="thin" aria-hidden="true"/></div>
    <div className="metricSwitch" role="group" aria-label="Trend metric">{(Object.keys(metricLabels) as Metric[]).map(k=><button type="button" key={k} aria-pressed={metric===k}
      className={metric===k?"active":""} onClick={()=>setMetric(k)}>{metricLabels[k]}</button>)}</div>
    {data.length?<><svg className="trendSvg" viewBox="0 0 900 220" role="img" aria-label={metricLabels[metric]+" over time; exact figures available below"} preserveAspectRatio="none">
      {[30,82,134,185].map(y=><line key={y} x1="10" y1={y} x2="890" y2={y} stroke="#302820" strokeOpacity=".10" strokeDasharray="4 6"/>)}
      <path d={area} fill={METRIC_COLORS[metric]} fillOpacity=".08"/>
      <path d={line} fill="none" stroke={METRIC_COLORS[metric]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      {points.length<30&&points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill={METRIC_COLORS[metric]}><title>{dateLabel(p.label)}: {integer(p.value)}</title></circle>)}
    </svg><div className="chartAxis"><span>{dateLabel(data[0].label)}</span><span>{dateLabel(data[data.length-1].label)}</span></div>
      <Disclosure title={"Explore exact "+metricLabels[metric].toLowerCase()+" figures"}><div className="tableScroll"><table><thead><tr><th>Date (GMT)</th><th>Visitors</th><th>Page views</th><th>Actions</th></tr></thead><tbody>{data.map(row=><tr key={row.label}><td>{row.label}</td><td>{integer(row.visitors)}</td><td>{integer(row.pageViews)}</td><td>{integer(row.actions)}</td></tr>)}</tbody></table></div></Disclosure>
    </>:<div className="emptyChart"><Activity size={28}/><strong>No activity in this period</strong><span>Try a longer date range. Recorded visits will appear here automatically.</span></div>}
    <p className="panelFootnote">Period comparisons {previous?"use the immediately preceding equal-length period.":"are unavailable for all-time reports."}</p>
  </section>;
}
function BreakdownCard({title,description,items}:{title:string;description:string;items:Breakdown[]}) {
  const total=items.reduce((sum,r)=>sum+r.visitors,0);
  return <article className="panel smallPanel"><div className="panelHeader"><div><h3>{title}</h3><p>{description}</p></div></div>
    {items.length?<div className="breakdownRows">{items.slice(0,7).map((r,i)=><div className="breakdownItem" key={r.label}>
      <div><span>{r.label}</span><strong>{integer(r.visitors)}</strong></div>
      <div className="barTrack"><span style={{width:(total?Math.max(2,r.visitors/total*100):0)+"%",background:i===0?"#e8382b":"#177c73"}}/></div>
    </div>)}</div>:<p className="emptySmall">No recorded data yet.</p>}
  </article>;
}
function SourceComposition({items}:{items:Breakdown[]}) {
  const palette=["#e8382b","#ffd63b","#177c73","#bf8e75","#999186","#dfd6c9"];
  const total=items.reduce((n,r)=>n+r.views,0);
  const remainder=items.slice(5).reduce((sum,r)=>({label:"Other",views:sum.views+r.views,visitors:sum.visitors+r.visitors}),{label:"Other",views:0,visitors:0});
  const rows=items.slice(0,5).concat(remainder.views ? [remainder] : []);
  let soFar=0;
  const stops=rows.map((r,i)=>{
    const start=soFar;soFar+=total?r.views/total*100:0;
    return palette[i]+" "+start+"% "+soFar+"%";
  }).join(",");
  return <article className="panel smallPanel"><div className="panelHeader"><div><h3>Where visitors arrive from</h3><p>Traffic sources by recorded page views.</p></div><Globe size={22}/></div>
    {total?<div className="composition"><div className="donut" role="img" aria-label={"Traffic source breakdown, "+integer(total)+" page views"} style={{background:"conic-gradient("+stops+")"}}>
      <div className="donutInner"><strong>{integer(total)}</strong><span>views</span></div></div>
      <div className="donutLegend">{rows.map((row,i)=><div key={row.label}><i style={{background:palette[i]}}/><span>{row.label}</span><strong>{Math.round(row.views/total*100)}%</strong></div>)}</div></div>:<p className="emptySmall">Sources will appear after the first page view.</p>}
  </article>;
}
function Heatmap({activity}:{activity:Report["activity"]}) {
  const map=new Map(activity.map(row=>[row.date,row.visitors]));
  const today=new Date(),max=Math.max(1,...activity.map(r=>r.visitors));
  const days=Array.from({length:91},(_,index)=>{
    const d=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-90+index));
    const key=d.toISOString().slice(0,10);
    return {date:key,count:map.get(key)||0};
  });
  return <section className="panel heatmapPanel" aria-labelledby="heatmapTitle"><div className="panelHeader"><div><p className="eyebrow">04 / ACTIVITY</p><h2 id="heatmapTitle">Activity calendar</h2><p>Unique anonymous visitors per day, last 91 days.</p></div></div>
    <div className="heatmap" role="img" aria-label="Daily unique visitor activity over the last 91 days">
      {days.map(day=><span key={day.date} title={day.date+": "+day.count+" visitors"}
        style={{background:day.count===0?"#e9e0d4":"rgba(232,56,43,"+(0.18+day.count/max*0.82)+")"}}/>)}</div>
    <div className="heatmapLegend"><span>Earlier</span><span>Less <i/><i/><i/><i/> More</span><span>Today</span></div>
    <p className="panelFootnote">A visitor can appear on multiple days. Daily counts must not be added together to get unique visitors for the whole period.</p>
  </section>;
}
const eventLabels:Record<string,string>={event_open:"Opened event",signup_open:"Opened mailing list",
  signup_submit:"Submitted sign-up form",signup_success:"Sign-up request accepted",board_open:"Connection Board",
  prop_open:"Prop Studio",venue_open:"Venue preview",nav_click:"Navigation",share_click:"Shared content"};
function Actions({report}:{report:Report}) {
  return <section className="panel actionsPanel" aria-labelledby="actionsTitle">
    <div className="panelHeader"><div><p className="eyebrow">03 / INTERACTIONS</p><h2 id="actionsTitle">What visitors do</h2><p>Recorded actions, excluding page loads and background heartbeats.</p></div><Activity size={22}/></div>
    {report.events.length?<div className="tableScroll"><table><thead><tr><th>Action</th><th>Sessions</th><th>Occurrences</th></tr></thead>
      <tbody>{report.events.map(r=><tr key={r.label}><td>{eventLabels[r.label]||r.label}</td><td>{integer(r.sessions)}</td><td>{integer(r.total)}</td></tr>)}</tbody></table></div>:
      <p className="emptySmall">Interactions will appear as visitors use the site.</p>}
  </section>;
}
function PageTime({rows}:{rows:Report["pageEngagement"]}) {
  const time=(seconds:number)=>seconds<60?seconds+" sec":Math.floor(seconds/60)+" min"+(seconds%60?" "+seconds%60+" sec":"");
  return <section className="panel pageTimePanel" aria-labelledby="pageTimeTitle">
    <div className="panelHeader"><div><h3 id="pageTimeTitle">Engagement by page</h3>
      <p>Which pages keep visitors reading or exploring?</p></div><Clock size={22}/></div>
    {rows.length?<div className="tableScroll"><table>
      <thead><tr><th>Page</th><th>Tracked sessions</th><th>Avg. minimum visible time</th><th>Reached 1 minute</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.page}><td>{row.page}</td>
        <td>{integer(row.sessions)}</td><td>{time(row.minimumSeconds)}</td><td>{integer(row.engaged60)}</td></tr>)}</tbody>
      </table></div>:<p className="emptySmall">Page engagement appears after visitors reach the first recorded time milestone.</p>}
    <p className="panelFootnote">Times are lower-bound estimates from visible-page milestones, averaged across tracked sessions. They exclude sessions below 10 seconds and do not measure exact attention. The maximum recorded milestone is 10 minutes.</p>
  </section>;
}
function Engagement({report}:{report:Report}) {
  const baseline=Math.max(1,report.metrics.sessions);
  const milestones=[10,30,60,180,300,600];
  return <article className="panel smallPanel"><div className="panelHeader"><div><h3>Time spent on pages</h3><p>Visible-time milestones, not exact attention.</p></div><Clock size={22}/></div>
    <div className="engagementRows">{milestones.map(seconds=>{
      const count=report.engagement.find(r=>r.seconds===seconds)?.sessions||0;
      return <div key={seconds} className="engagementItem"><div><span>{seconds<60?seconds+" seconds":seconds/60+" minutes"}</span>
        <strong>{integer(count)} sessions</strong></div>
        <div className="barTrack"><span style={{width:Math.min(100,count/baseline*100)+"%"}}/></div></div>
    })}</div><p className="panelFootnote">Timers pause when a tab is hidden. Counts are best effort and may be incomplete.</p>
  </article>;
}
export function Dashboard({report,filterOptions}:DashboardProps) {
  const router=useRouter();
  const [refreshing,startTransition]=useTransition();
  useEffect(()=>{const timer=window.setInterval(()=>{if(document.visibilityState==="visible")startTransition(()=>router.refresh())},60000);return()=>clearInterval(timer)},[router]);
  const exportParams=new URLSearchParams({format:"csv",range:report.filters.range});
  if(report.filters.range==="custom"){exportParams.set("from",report.filters.from);exportParams.set("to",report.filters.to)}
  if(report.filters.dimension!=="all"&&report.filters.value){exportParams.set("dimension",report.filters.dimension);exportParams.set("value",report.filters.value)}
  async function logout(){
    const res=await fetch("/analytics/api/auth",{method:"DELETE",headers:{"Content-Type":"application/json"}});
    if(res.ok){router.push("/login");router.refresh();}
  }
  const metrics=report.metrics;
  return <div className="appShell">
    <header className="topNav"><a href="https://offscriptgh.com/" className="wordMark" aria-label="Offscript home"><span className="wordMarkCircle">O</span><strong>OFFSCRIPT</strong></a>
      <span className="deskLabel">/ THE DESK</span><nav aria-label="Account"><a href="https://offscriptgh.com/" className="navLink"><House size={17}/> Website</a>
        <button type="button" className="navLink" onClick={logout}><SignOut size={17}/> Sign out</button></nav></header>
    <main className="dashboardMain" id="main">
      <div className="pageHero"><div><p className="eyebrow">OFFSCRIPT / PRIVATE INSIGHTS</p><h1>Analytics<span>.</span></h1>
        <p className="heroSubtitle">See how people find Offscript and engage with our events.</p></div>
        <div className="heroTools"><span className="nowPill"><i className="liveDot"/> {integer(metrics.activeNow)} active now</span>
          <button type="button" className="refreshButton" aria-label="Refresh analytics" disabled={refreshing} onClick={()=>startTransition(()=>router.refresh())}>
          <ArrowClockwise size={20} className={refreshing?"spin":""}/></button>
          <span className="syncNote">{refreshing?"Refreshing…":"Updates every minute"}</span></div></div>
      <DashboardFilters filters={report.filters} options={filterOptions}/>
      {report.status!=="ready"&&<div className="statusNotice" role="status"><LockKey size={21}/><div><strong>{report.status==="unconfigured"?"Analytics storage isn't connected yet":"The report couldn't be loaded"}</strong>
        <p>{report.status==="unconfigured"?"The dashboard is ready for configuration. No visitor figures are being reported yet.":"Try again later. Site visitors are unaffected."}</p></div></div>}
      <nav className="sectionNav" aria-label="Dashboard sections"><a href="#overview">Overview</a><a href="#audience">Audience</a><a href="#behavior">Behaviour</a><a href="#activity">Activity</a></nav>
      <section id="overview" aria-labelledby="overviewHeading">
        <div className="sectionHeader"><h2 id="overviewHeading">At a glance</h2><span>{rangeLabel(report.filters)}</span></div>
        <div className="kpiGrid">
          <Kpi name="Visitors" value={integer(metrics.visitors)} detail="Unique anonymous browsers" change={delta(metrics.visitors,report.previous?.visitors??null)}/>
          <Kpi name="Page views" value={integer(metrics.pageViews)} detail="Recorded page opens" change={delta(metrics.pageViews,report.previous?.pageViews??null)}/>
          <Kpi name="Actions" value={integer(metrics.actions)} detail={integer(metrics.actionSessions)+" participating sessions"} change={delta(metrics.actions,report.previous?.actions??null)}/>
          <Kpi name="Active now" value={integer(metrics.activeNow)} detail="Visible in the last 90 seconds" live/>
        </div>
        <Trend data={report.trend} previous={report.previous}/>
      </section>
      <section id="audience" className="sectionBlock" aria-labelledby="audienceHeading"><div className="sectionHeader">
        <div><p className="eyebrow">02 / AUDIENCE</p><h2 id="audienceHeading">Who&apos;s finding us</h2></div><span>{report.audienceLabel}</span></div>
        <div className="audienceGrid"><SourceComposition items={report.breakdowns.source}/><BreakdownCard title="Countries" description="Approximate location by country" items={report.breakdowns.country}/>
          <BreakdownCard title="Devices" description="Broad device categories" items={report.breakdowns.device}/>
          <BreakdownCard title="Browsers" description="Web browsers used" items={report.breakdowns.browser}/></div>
      </section>
      <section id="behavior" className="sectionBlock" aria-labelledby="behaviorHeading"><div className="sectionHeader"><div>
        <p className="eyebrow">03 / BEHAVIOUR</p><h2 id="behaviorHeading">What happens after a visit</h2></div></div>
        <div className="behaviorGrid"><Actions report={report}/><Engagement report={report}/></div>
        <PageTime rows={report.pageEngagement}/>
      </section>
      <section id="activity" className="sectionBlock" aria-label="Activity and detailed data">
        <div className="detailGrid"><Heatmap activity={report.activity}/><BreakdownCard title="Most visited pages" description="Recorded page views by address" items={report.breakdowns.page}/></div>
        <div className="detailGrid"><BreakdownCard title="Event editions" description="Traffic grouped by event" items={report.breakdowns.edition}/>
          <section className="panel exportPanel"><div><p className="eyebrow">DATA / EXPORT</p><h2>Keep the record.</h2>
            <p>Download exact daily totals, recorded actions and popular pages for this report.</p></div>
            <a className="downloadLink" href={"/analytics/api/report?"+exportParams.toString()}><DownloadSimple size={19}/> Download CSV <ArrowUpRight size={17}/></a>
            <p className="panelFootnote">Exports contain aggregate counts only, never individual visitor identifiers.</p></section></div>
        <Disclosure title="Metric notes and privacy"><div className="definitions"><p><strong>Visitor:</strong> an anonymous browser identifier. It is not a known person.</p>
          <p><strong>Session:</strong> a browser session that may include several pages. Separate visits can create new sessions.</p>
          <p><strong>Active now:</strong> estimated from a visible-page heartbeat received in the last 90 seconds.</p>
          <p><strong>Engagement:</strong> visible-time milestones. A background tab pauses its timer.</p>
          <p><strong>Conversion:</strong> a sign-up request accepted by our form, not a confirmed email subscriber.</p>
          <p><strong>Attribution:</strong> approximate country and limited referral or campaign tags. No IP addresses, emails, payment information, form contents or individual page text are stored in these analytics records.</p>
          <p><strong>Reporting time:</strong> Ghana time (GMT/UTC). Period comparison uses the preceding equal-length period.</p>
          <p><strong>Privacy:</strong> Global Privacy Control and analytics pause preferences are respected. Script blockers and interruptions can cause undercounts.</p></div></Disclosure>
      </section>
      <footer className="dashboardFooter"><span>OFFSCRIPT / PRIVATE INSIGHTS</span><span>Recorded at {new Date(report.generatedAt).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"})} GMT</span></footer>
    </main>
  </div>;
}
