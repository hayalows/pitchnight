// Build the OffScript site and Cloudflare Worker. Run: node site/build.mjs
//
// Sources (edit these):
//   site/src/index.html, about.html, events.html, join.html, privacy.html   pages
//   site/src/partials/header.html, footer.html                              shared header + footer
//   site/src/pages.css, experience.css                                       shared styles (home inlines them)
//   site/src/site.js                                                         shared behaviour
//   site/src/props/prop-01..10.svg                                           Edition 001 props (vector)
//   site/src/bridge/                                                         family layer for event pages
//   cloudflare/subscriptions.js                                              email backend
// Outputs (generated, do not edit): site/*.html, site/offscript.css, favicon.svg, apple-touch-icon.png,
//   cloudflare/offscriptgh-site-worker.js (constants and backend block only; routing stays hand-written).
import {readFileSync,writeFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const read=(path,enc="utf8")=>readFileSync(join(root,path),enc);
const write=(path,txt)=>writeFileSync(join(root,path),txt);

const paths=JSON.parse(read("site/src/logo-paths.json"));
const fontSerif=readFileSync(join(root,"site/fonts/instrument-serif-italic-subset.woff2")).toString("base64");
const touchIcon=readFileSync(join(root,"site/src/apple-touch-icon.png"));

// The red flipped-f favicon, used on every OffScript and event page.
const favicon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#e8382b"/><g transform="translate(60 60) scale(0.82) translate(-193.8 -108.4)"><path fill="#faf4e7" d="'+paths.flip+'"/></g></svg>\n';

// Props are defined once per page as <symbol>s and placed with <use>, so repeats cost almost nothing.
const props=Array.from({length:10},(_,i)=>read(`site/src/props/prop-${String(i+1).padStart(2,"0")}.svg`).trim());
const propNames=["Hear me out.","I'm the friend.","Who's pitching me?","My friend is a catch.","Show me the green flags.","I brought receipts.","Pitch accepted.","The jury is still out.","I rest my case.","Make your case."];
function propSymbol(i){
  const inner=props[i].replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"");
  return `<symbol id="prop-${i+1}" viewBox="0 0 720 480">${inner}</symbol>`;
}
const prop=i=>`<svg class="prop-art" viewBox="0 0 720 480" aria-hidden="true" focusable="false"><use href="#prop-${i+1}"/></svg>`;
function propTiles(){
  const tilts=[-4,3,-2,5,-3,2,-5,4,-2,3];
  return propNames.map((name,i)=>`<li><a href="/events/pitch-night-001/props.html?prop=${i+1}" style="--r:${tilts[i]}deg" aria-label="${name.replace(/'/g,"&#39;")} Open this prop in the Prop Studio">${prop(i)}</a></li>`).join("");
}
const sharedJs=read("site/src/shared.js");
const analyticsCollector=read("site/src/analytics-collector.js");
const siteJs=sharedJs+"\n"+read("site/src/site.js");
const listSheet=read("site/src/partials/list-sheet.html");
// The footer logo as nine separate letters (O, f, flipped f, S, c, r, i, p, t), so each can react on its own.
// Each letter keeps its own holes, so the original even-odd shapes are unchanged.
const logoSubs=paths.stacked.split(/(?=M)/);
const glyphGroups=[[9,11],[10],[8],[1],[2],[4],[5,7],[0,6],[3]];
const logoGlyphs=glyphGroups.map((g,i)=>`<path class="osf-g${i===2?" osf-g--flip":""}" style="--i:${i}" fill-rule="evenodd" d="${g.map(n=>logoSubs[n]).join("")}"/>`).join("");
const header=read("site/src/partials/header.html");
const footer=read("site/src/partials/footer.html");
const baseTokens={"{{HEADER}}":header,"{{FOOTER}}":footer,"{{LIST_SHEET}}":listSheet,"{{SITE_JS}}":siteJs,"{{FAVICON}}":"/favicon.svg"};
const logoTokens={"{{LOGO_GLYPHS}}":logoGlyphs,"{{LOGO_STACKED}}":paths.stacked,"{{LOGO_OFF}}":paths.off,"{{LOGO_FLIP}}":paths.flip,"{{FONT_IS}}":fontSerif};

function render(src){
  let txt=src;
  for(const [a,b] of Object.entries(baseTokens))txt=txt.replaceAll(a,()=>b);
  txt=txt.replaceAll("{{PROP_TILES}}",()=>propTiles());
  const used=new Set();
  txt=txt.replace(/\{\{PROP_(\d\d)\}\}/g,(m,n)=>{used.add(Number(n)-1);return prop(Number(n)-1)});
  if(txt.includes("{{PROP_TILES}}")||/href="#prop-\d+"/.test(txt))propNames.forEach((_,i)=>{if(txt.includes(`href="#prop-${i+1}"`))used.add(i)});
  txt=txt.replace("{{PROP_SYMBOLS}}",()=>[...used].sort((a,b)=>a-b).map(propSymbol).join(""));
  for(const [a,b] of Object.entries(logoTokens))txt=txt.replaceAll(a,()=>b);
  const left=txt.match(/\{\{[A-Z_0-9]+\}\}/);
  if(left)throw Error("Unreplaced template token "+left[0]);
  return txt;
}

const sharedCss=read("site/src/pages.css")+"\n"+read("site/src/experience.css")+"\n"+read("site/src/shared.css");
const home=render(read("site/src/index.html")).replace("</style>",()=>sharedCss+"</style>");
const css=home.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if(!css)throw Error("CSS missing");
const pages={};
for(const p of ["about","events","join","privacy"]){pages[p]=render(read("site/src/"+p+".html"));write("site/"+p+".html",pages[p])}
const notFound=render(read("site/src/404.html"));
write("site/404.html",notFound);
write("site/index.html",home);
write("site/offscript.css",css);
write("favicon.svg",favicon);
writeFileSync(join(root,"apple-touch-icon.png"),touchIcon);

const bridgeCss=read("site/src/bridge/bridge.css")+"\n"+read("site/src/shared.css");
const bridgeBar=render(read("site/src/bridge/bar.html").replace("{{CRUMBS}}","%%CRUMBS%%")).replace("%%CRUMBS%%","{{CRUMBS}}").trim();
// Event pages get the very same footer and list sheet as the OffScript pages.
const bridgeFoot=render(footer+"\n"+listSheet).trim();

let worker=read("cloudflare/offscriptgh-site-worker.js");
const constants={HOME:home,BRAND_CSS:css,PAGE_ABOUT:pages.about,PAGE_EVENTS:pages.events,PAGE_JOIN:pages.join,PAGE_PRIVACY:pages.privacy,PAGE_NOT_FOUND:notFound,
  BRIDGE_CSS:bridgeCss,BRIDGE_JS:sharedJs,BRIDGE_BAR:bridgeBar,BRIDGE_FOOT:bridgeFoot,FAVICON_SVG:favicon,TOUCH_ICON_B64:touchIcon.toString("base64"),FONT_SERIF_B64:fontSerif,OFFSCRIPT_ANALYTICS_JS:analyticsCollector};
for(const [name,value] of Object.entries(constants)){
  const regex=new RegExp("^const "+name+"=.*;\\n","m");
  if(!regex.test(worker))throw Error("Missing "+name);
  worker=worker.replace(regex,()=>"const "+name+"="+JSON.stringify(value)+";\n");
}
if(!worker.includes("// OFFSCRIPT_BACKEND_START")||!worker.includes("// OFFSCRIPT_BACKEND_END"))throw Error("Backend markers missing");
worker=worker.replace(/\/\/ OFFSCRIPT_BACKEND_START[\s\S]*?\/\/ OFFSCRIPT_BACKEND_END/,()=>"// OFFSCRIPT_BACKEND_START\n"+read("cloudflare/subscriptions.js")+"\n// OFFSCRIPT_BACKEND_END");
write("cloudflare/offscriptgh-site-worker.js",worker);
const kb=s=>(Buffer.byteLength(s)/1024).toFixed(1)+" KB";
console.log(`Built home ${kb(home)}, CSS ${kb(css)}, pages ${Object.keys(pages).join(", ")}, bridge, favicon and Worker ${kb(worker)}.`);
