/* Off Script Pitch Night / The Prop Studio.
   Curated cut-out designs. No accounts, tracking, uploads or external APIs. */
(function(){
  "use strict";
  /* bg = sticker ground, ink = headline, hi = the keyword line, mark = hand-drawn underline,
     k = index of the keyword line. Every colour comes from the Off Script palette. */
  var P=[
    {id:"hear-me-out",lines:["HEAR ME","OUT."],k:1,label:"HEAR ME OUT.",kind:"THE OPENING LINE",desc:"The line for someone who has a case to make.",shape:"bubble",bg:"#1036af",ink:"#fff9ef",hi:"#ffd63b",mark:"#f03d2f"},
    {id:"im-the-friend",lines:["I'M THE","FRIEND."],k:1,label:"I'M THE FRIEND.",kind:"THE REVEAL",desc:"For the person everyone has been talking about.",shape:"ticket",bg:"#faf4e7",ink:"#171717",hi:"#f03d2f",mark:"#1036af"},
    {id:"whos-pitching-me",lines:["WHO'S","PITCHING ME?"],k:1,label:"WHO'S PITCHING ME?",kind:"THE QUESTION",desc:"For anyone ready to hear a convincing introduction.",shape:"bubble",bg:"#f03d2f",ink:"#fff9ef",hi:"#ffd63b",mark:"#171717"},
    {id:"my-friend-is-a-catch",lines:["MY FRIEND","IS A CATCH."],k:1,label:"MY FRIEND IS A CATCH.",kind:"THE RECOMMENDATION",desc:"For the friend with a proper case to make.",shape:"plaque",bg:"#ffd63b",ink:"#171717",hi:"#f03d2f",mark:"#1036af"},
    {id:"green-flags",lines:["SHOW ME","THE GREEN","FLAGS."],k:2,label:"SHOW ME THE GREEN FLAGS.",kind:"THE CHECKLIST",desc:"For the audience evaluating every pitch.",shape:"tag",bg:"#aeef9d",ink:"#171717",hi:"#1036af",mark:"#f03d2f"},
    {id:"brought-receipts",lines:["I BROUGHT","RECEIPTS."],k:1,label:"I BROUGHT RECEIPTS.",kind:"THE EVIDENCE",desc:"For anyone who can back up every claim.",shape:"ticket",bg:"#faf4e7",ink:"#1036af",hi:"#f03d2f",mark:"#ffd63b"},
    {id:"pitch-accepted",lines:["PITCH","ACCEPTED."],k:1,label:"PITCH ACCEPTED.",kind:"THE APPROVAL",desc:"For a pitch that wins over the room.",shape:"plaque",bg:"#1036af",ink:"#fff9ef",hi:"#aeef9d",mark:"#ffd63b"},
    {id:"jury-is-out",lines:["THE JURY","IS STILL OUT."],k:1,label:"THE JURY IS STILL OUT.",kind:"THE VERDICT",desc:"For the friend who's not convinced yet.",shape:"tag",bg:"#c4d7f2",ink:"#171717",hi:"#1036af",mark:"#f03d2f"},
    {id:"rest-my-case",lines:["I REST","MY CASE."],k:1,label:"I REST MY CASE.",kind:"THE CLOSING LINE",desc:"For the pitch that needs no further explanation.",shape:"bubble",bg:"#f03d2f",ink:"#fff9ef",hi:"#171717",mark:"#ffd63b"},
    {id:"make-your-case",lines:["MAKE","YOUR CASE."],k:1,label:"MAKE YOUR CASE.",kind:"THE SIGNATURE",desc:"The one phrase that belongs to the whole night.",shape:"plaque",bg:"#ffd63b",ink:"#171717",hi:"#1036af",mark:"#f03d2f"}
  ];
  var shapes={
    bubble:"M123 64 H595 Q647 64 647 119 V328 Q647 376 599 376 H233 L147 431 L162 376 H124 Q75 376 75 331 V114 Q75 64 123 64 Z",
    ticket:"M112 70 H607 Q657 70 657 119 V169 Q619 177 619 219 Q619 260 657 271 V331 Q657 384 607 384 H112 Q62 384 62 334 V271 Q100 262 100 219 Q100 177 62 169 V119 Q62 70 112 70 Z",
    plaque:"M126 77 H596 Q645 77 645 125 V331 Q645 379 597 379 H126 Q75 379 75 329 V127 Q75 77 126 77 Z",
    tag:"M100 81 L609 54 L659 131 L622 376 L112 402 L60 325 Z"
  };
  /* Anton advance widths (em) for the self-hosted subset, used to fit each headline line. */
  var AW={" ":.234,"!":.229,"'":.214,"?":.492,".":.229,",":.236,"-":.311,"0":.494,"1":.331,"A":.485,"B":.479,"C":.474,"D":.493,"E":.412,"F":.399,"G":.485,"H":.499,"I":.227,"J":.466,"K":.472,"L":.397,"M":.746,"N":.498,"O":.486,"P":.472,"Q":.494,"R":.477,"S":.461,"T":.396,"U":.474,"V":.469,"W":.712,"X":.484,"Y":.446,"Z":.41};
  var FONT_FILES={anton:"assets/fonts/anton-props.woff2",grotesk:"assets/fonts/space-grotesk-props.woff2"};
  var selected=0, logoData="", fontCSS="", loading=false, toastTimer=0;
  var $=function(id){return document.getElementById(id)};
  var pad=function(n){return String(n).padStart(2,"0")};
  var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var escapeXML=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]})};
  function textWidth(s){var w=0;for(var i=0;i<s.length;i++)w+=AW[s.charAt(i)]||.48;return w}
  function shapeSVG(p){var d=shapes[p.shape];return '<path d="'+d+'" transform="translate(6 9)" fill="#171717" opacity=".2"/><path d="'+d+'" fill="'+p.bg+'" stroke="#ffffff" stroke-width="24" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="#171717" stroke-width="3" stroke-linejoin="round"/>'}
  /* A loose marker stroke, wobbling slightly so it reads as drawn by hand. */
  function underline(cx,y,w,colour){
    var x0=cx-w/2-6,x1=cx+w/2+8;
    return '<path d="M'+x0.toFixed(1)+' '+(y+3)+' C'+(x0+w*.3).toFixed(1)+' '+(y-3)+' '+(x0+w*.62).toFixed(1)+' '+(y+5)+' '+x1.toFixed(1)+' '+(y-2)+'" fill="none" stroke="'+colour+'" stroke-width="9" stroke-linecap="round"/>';
  }
  function layoutLines(p){
    var n=p.lines.length,maxW=440,zone=n===3?178:170,cap=n===3?84:118,capH=.86,gapEm=n===3?.15:.17;
    var sizes=p.lines.map(function(s){return Math.min(maxW/textWidth(s),cap)});
    var total=function(){return sizes.reduce(function(t,s){return t+s*capH},0)+gapEm*(sizes.reduce(function(a,b){return a+b},0)/n)*(n-1)};
    var fit=zone/total();if(fit<1)sizes=sizes.map(function(s){return s*fit});
    var gap=gapEm*(sizes.reduce(function(a,b){return a+b},0)/n),y=241-total()/2;
    return sizes.map(function(s,i){y+=s*capH;var row={text:p.lines[i],size:s,base:y,width:textWidth(p.lines[i])*s};y+=gap;return row});
  }
  function renderArt(p,index,exported){
    var rows=layoutLines(p),hiRow=rows[p.k];
    var lines=rows.map(function(r,i){return '<text x="360" y="'+r.base.toFixed(1)+'" fill="'+(i===p.k?p.hi:p.ink)+'" text-anchor="middle" font-family="Anton,Impact,\'Arial Narrow\',sans-serif" font-size="'+r.size.toFixed(1)+'">'+escapeXML(r.text)+'</text>'}).join("");
    var badge='<rect x="104" y="92" width="62" height="62" rx="13" fill="#ffffff" stroke="#171717" stroke-width="2.5"/>'+
      (logoData?'<image href="'+logoData+'" x="109" y="97" width="52" height="52" preserveAspectRatio="xMidYMid meet"/>':'<text x="135" y="128" text-anchor="middle" font-family="\'Space Grotesk\',Arial,sans-serif" font-size="11" font-weight="700" fill="#171717">OFF SCRIPT</text>');
    var label=pad(index+1);
    var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480" width="720" height="480" role="img" aria-label="'+escapeXML(p.label)+' photo prop">';
    svg+='<title>'+escapeXML(p.label)+' | Off Script Pitch Night</title>';
    if(exported&&fontCSS)svg+='<defs><style>'+fontCSS+'</style></defs>';
    svg+=shapeSVG(p)+badge;
    svg+='<text x="604" y="128" text-anchor="end" fill="'+p.ink+'" font-family="\'Space Grotesk\',Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="2.5">N° '+label+'</text>';
    svg+=underline(360,Math.min(hiRow.base+15,331),Math.min(hiRow.width,400),p.mark);
    svg+=lines;
    svg+='<text x="360" y="361" fill="'+p.ink+'" font-family="\'Space Grotesk\',Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="4" text-anchor="middle" opacity=".86">OFF SCRIPT · PITCH NIGHT 2026</text>';
    svg+='</svg>';
    return svg;
  }
  function toast(t){var el=$("prop-toast");if(!el)return;el.textContent=t;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove("show")},3800)}
  function refreshGallery(){
    var grid=$("prop-gallery");if(!grid)return;
    grid.innerHTML=P.map(function(p,i){return '<button class="prop-tile" type="button" data-prop="'+i+'" aria-pressed="'+(i===selected)+'" aria-label="Choose prop '+(i+1)+' of 10: '+escapeXML(p.label)+'"><span class="tile-art" aria-hidden="true">'+renderArt(p,i,false)+'</span><span class="tile-foot" aria-hidden="true"><small>'+pad(i+1)+'</small><span>'+escapeXML(p.kind)+'</span></span><span class="tile-picked" aria-hidden="true">PICKED</span></button>'}).join("");
    grid.querySelectorAll("[data-prop]").forEach(function(b){b.addEventListener("click",function(){choose(Number(b.dataset.prop),true)})});
  }
  function keepTileInView(i){
    var grid=$("prop-gallery"),tile=grid&&grid.querySelector('[data-prop="'+i+'"]');
    if(!tile||grid.scrollWidth<=grid.clientWidth+2)return;
    var left=tile.offsetLeft-(grid.clientWidth-tile.offsetWidth)/2;
    grid.scrollTo({left:Math.max(0,left),behavior:reduceMotion?"auto":"smooth"});
  }
  function choose(i,fromUser){
    if(!Number.isInteger(i)||i<0||i>=P.length)return;
    selected=i;var p=P[i],preview=$("prop-preview");
    preview.innerHTML=renderArt(p,i,false);
    preview.setAttribute("aria-label",p.label+" photo prop");
    if(fromUser&&!reduceMotion){preview.classList.remove("is-swapping");void preview.offsetWidth;preview.classList.add("is-swapping")}
    $("selected-count").textContent=pad(i+1)+" / 10";
    $("prop-title").textContent=p.label;
    $("prop-description").textContent=p.desc;
    $("prop-kind").textContent=p.kind;
        document.querySelectorAll(".prop-tile").forEach(function(b,j){b.setAttribute("aria-pressed",String(j===i))});
    if(fromUser)keepTileInView(i);
  }
  function step(d){choose((selected+d+P.length)%P.length,true)}
  function loadLogo(){
    var image=new Image();
    image.onload=function(){
      try{
        var c=document.createElement("canvas"),w=image.naturalWidth,h=image.naturalHeight;
        c.width=180;c.height=180;
        c.getContext("2d").drawImage(image,w*.1103,h*.2032,w*.7905,h*.7905,0,0,180,180);
        logoData=c.toDataURL("image/png");
      }catch(e){logoData=""}
      renderHero();
      if(document.body.classList.contains("print-mode"))renderPrint();
      else{refreshGallery();choose(selected,false)}
    };
    image.onerror=function(){toast("The Off Script logo could not be loaded. Refresh and try again.")};
    image.src="assets/offscript-logo.png";
  }
  /* An image-rendered SVG cannot see the page's fonts, so exports carry their own copy. */
  function toDataURL(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(blob)})}
  async function ensureFonts(){
    if(fontCSS)return;
    try{
      var urls=await Promise.all([FONT_FILES.anton,FONT_FILES.grotesk].map(function(u){return fetch(u).then(function(r){if(!r.ok)throw Error(u);return r.blob()}).then(toDataURL)}));
      fontCSS="@font-face{font-family:'Anton';src:url("+urls[0]+") format('woff2')}@font-face{font-family:'Space Grotesk';font-weight:300 700;src:url("+urls[1]+") format('woff2')}";
    }catch(e){fontCSS=""}
  }
  function downloadBlob(blob,name){
    var url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},15000);
  }
  function selectedSVG(){return renderArt(P[selected],selected,true)}
  function setBusy(on){
    document.querySelectorAll("[data-export]").forEach(function(b){b.setAttribute("aria-busy",String(on));b.classList.toggle("is-busy",on)});
  }
  async function downloadSVG(){
    if(loading)return;loading=true;setBusy(true);
    try{
      await ensureFonts();
      var blob=new Blob([selectedSVG()],{type:"image/svg+xml;charset=utf-8"});
      downloadBlob(blob,"offscript-prop-"+P[selected].id+".svg");
      toast("Print file saved. Give this SVG to your printer.");
    }finally{loading=false;setBusy(false)}
  }
  async function pngBlob(){
    await ensureFonts();
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    var svg=selectedSVG();
    var url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
    try{
      var im=new Image();im.src=url;
      await new Promise(function(res,rej){im.onload=res;im.onerror=rej});
      if(im.decode)try{await im.decode()}catch(e){}
      var c=document.createElement("canvas");c.width=2160;c.height=1440;
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      return await new Promise(function(res){c.toBlob(res,"image/png")});
    }finally{URL.revokeObjectURL(url)}
  }
  async function savePNG(){
    if(loading)return;loading=true;setBusy(true);try{
      var blob=await pngBlob();if(!blob)throw Error("Unable to generate PNG");
      downloadBlob(blob,"offscript-prop-"+P[selected].id+".png");toast("Image saved. Ready for your story.");
    }catch(e){toast("The image could not be saved. Try the SVG print file instead.")}
    finally{loading=false;setBusy(false)}
  }
  async function shareProp(){
    if(loading)return;loading=true;setBusy(true);
    try{
      var blob=await pngBlob();if(!blob)throw Error("Unable to make image");
      var name="offscript-prop-"+P[selected].id+".png";
      var file=new File([blob],name,{type:"image/png"});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"Off Script Pitch Night · "+P[selected].label});
      }else{downloadBlob(blob,name);toast("Image saved. You can share it from your device.")}
    }catch(e){if(e.name!=="AbortError")toast("Sharing was unavailable. Save the image instead.")}
    finally{loading=false;setBusy(false)}
  }
  function renderHero(){
    var h=$("hero-sticker");if(!h)return;
    var picks=[3,6,0];
    if(h.children.length===picks.length){picks.forEach(function(i,n){h.children[n].innerHTML=renderArt(P[i],i,false)});return}
    h.innerHTML=picks.map(function(i,n){return '<div class="hero-card hero-card-'+(n+1)+'">'+renderArt(P[i],i,false)+'</div>'}).join("");
  }
  function renderPrint(){
    var root=$("print-root");if(!root)return;
    root.hidden=false;
    root.innerHTML='<div class="print-toolbar"><strong>OFF SCRIPT / 10 PHOTO PROPS</strong><button type="button" id="print-now">PRINT OR SAVE AS PDF</button></div>'+
      P.map(function(p,i){return '<section class="print-sheet"><div>'+renderArt(p,i,true)+'</div><p class="sheet-meta">PROP '+pad(i+1)+' / 10 · CUT ALONG THE OUTER WHITE BORDER · FIT TO A4 LANDSCAPE</p></section>'}).join("");
    $("print-now").addEventListener("click",function(){window.print()});
  }
  /* Mobile: keep Save and Share within thumb reach while the studio is on screen. */
  function initDock(){
    var dock=$("prop-dock"),studio=$("choose"),controls=document.querySelector(".editor-controls");
    if(!dock||!studio||!controls||!("IntersectionObserver" in window))return;
    var inStudio=false,controlsVisible=false;
    var sync=function(){var show=inStudio&&!controlsVisible;dock.classList.toggle("is-shown",show);dock.setAttribute("aria-hidden",String(!show));dock.querySelectorAll("button").forEach(function(b){b.tabIndex=show?0:-1})};
    new IntersectionObserver(function(e){inStudio=e[0].isIntersecting;sync()},{rootMargin:"-30% 0px -10% 0px"}).observe(studio);
    new IntersectionObserver(function(e){controlsVisible=e[0].isIntersecting;sync()},{threshold:.6}).observe(controls);
    sync();
  }
  function init(){
    var print=new URLSearchParams(location.search).get("print")==="1";
    if(print){document.body.classList.add("print-mode");renderPrint()}
    else{
      renderHero();
      refreshGallery();choose(0,false);
      $("download-svg").addEventListener("click",downloadSVG);
      $("save-png").addEventListener("click",savePNG);
      $("share-prop").addEventListener("click",shareProp);
      var ds=$("dock-save"),dsh=$("dock-share");if(ds)ds.addEventListener("click",savePNG);if(dsh)dsh.addEventListener("click",shareProp);
      var pv=$("prev-prop"),nx=$("next-prop");if(pv)pv.addEventListener("click",function(){step(-1)});if(nx)nx.addEventListener("click",function(){step(1)});
      var grid=$("prop-gallery");
      grid.addEventListener("keydown",function(e){
        var d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!d||!e.target.closest(".prop-tile"))return;
        e.preventDefault();step(d);var t=grid.querySelector('[data-prop="'+selected+'"]');if(t)t.focus({preventScroll:true});
      });
      var stage=$("editor-stage"),sx=null;
      stage.addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
      stage.addEventListener("touchend",function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>48)step(dx<0?1:-1)},{passive:true});
      initDock();
      if("requestIdleCallback" in window)requestIdleCallback(ensureFonts);else setTimeout(ensureFonts,2500);
    }
    loadLogo();
  }
  init();
})();
