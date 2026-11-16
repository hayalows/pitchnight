// Build site and Cloudflare Worker. Run: node site/build.mjs
import {readFileSync,writeFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(join(root,path),"utf8");
const write=(path,txt)=>writeFileSync(join(root,path),txt);
const paths=JSON.parse(read("site/src/logo-paths.json"));
const font=readFileSync(join(root,"site/fonts/instrument-serif-italic-subset.woff2")).toString("base64");
const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#e8382b"/><g transform="translate(60 60) scale(0.82) translate(-193.8 -108.4)"><path fill="#faf4e7" d="'+paths.flip+'"/></g></svg>';
const tokens={"{{LOGO_STACKED}}":paths.stacked,"{{LOGO_OFF}}":paths.off,"{{LOGO_FLIP}}":paths.flip,"{{FONT_IS}}":font,"{{FAVICON}}":"data:image/svg+xml,"+encodeURIComponent(icon)};
const render=src=>{let txt=src;for(const [a,b] of Object.entries(tokens))txt=txt.replaceAll(a,b);if(/\{\{[A-Z_]+\}\}/.test(txt))throw Error("Unreplaced template token");return txt};
const extra=read("site/src/pages.css");
const home=render(read("site/src/index.html")).replace("</style>",extra+"</style>");
const css=home.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if(!css)throw Error("CSS missing");
const pages={};
for(const p of ["about","events","join","privacy"]){pages[p]=render(read("site/src/"+p+".html"));write("site/"+p+".html",pages[p])}
write("site/index.html",home);write("site/offscript.css",css);
let worker=read("cloudflare/offscriptgh-site-worker.js");
for(const [name,value] of Object.entries({HOME:home,BRAND_CSS:css,PAGE_ABOUT:pages.about,PAGE_EVENTS:pages.events,PAGE_JOIN:pages.join,PAGE_PRIVACY:pages.privacy})){
 const regex=new RegExp("^const "+name+"=.*;\\n","m");if(!regex.test(worker))throw Error("Missing "+name);
 worker=worker.replace(regex,()=> "const "+name+"="+JSON.stringify(value)+";\n");
}
if(!worker.includes("// OFFSCRIPT_BACKEND_START")||!worker.includes("// OFFSCRIPT_BACKEND_END"))throw Error("Backend markers missing");
worker=worker.replace(/\/\/ OFFSCRIPT_BACKEND_START[\s\S]*?\/\/ OFFSCRIPT_BACKEND_END/,"// OFFSCRIPT_BACKEND_START\n"+read("cloudflare/subscriptions.js")+"\n// OFFSCRIPT_BACKEND_END");
write("cloudflare/offscriptgh-site-worker.js",worker);
console.log("Built OffScript homepage, About, Events, Join Us, Privacy, CSS and Worker.");
