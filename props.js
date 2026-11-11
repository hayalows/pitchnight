/* Off Script Pitch Night / The Prop Studio.
   Curated cut-out designs. No accounts, tracking, uploads or external APIs. */
(function(){
  "use strict";
  var P=[
    {id:"hear-me-out",lines:["HEAR ME","OUT."],label:"HEAR ME OUT.",kind:"THE OPENING LINE",desc:"The line for someone who has a case to make.",shape:"bubble",bg:"#1036af",ink:"#fff9ef",accent:"#ffd63b"},
    {id:"im-the-friend",lines:["I'M THE","FRIEND."],label:"I'M THE FRIEND.",kind:"THE REVEAL",desc:"For the person everyone has been talking about.",shape:"ticket",bg:"#faf4e7",ink:"#171717",accent:"#f03d2f"},
    {id:"whos-pitching-me",lines:["WHO'S","PITCHING ME?"],label:"WHO'S PITCHING ME?",kind:"THE QUESTION",desc:"For anyone ready to hear a convincing introduction.",shape:"bubble",bg:"#f03d2f",ink:"#fff9ef",accent:"#ffd63b"},
    {id:"my-friend-is-a-catch",lines:["MY FRIEND","IS A CATCH."],label:"MY FRIEND IS A CATCH.",kind:"THE RECOMMENDATION",desc:"For the friend with a proper case to make.",shape:"plaque",bg:"#ffd63b",ink:"#171717",accent:"#1036af"},
    {id:"green-flags",lines:["SHOW ME","THE GREEN","FLAGS."],label:"SHOW ME THE GREEN FLAGS.",kind:"THE CHECKLIST",desc:"For the audience evaluating every pitch.",shape:"tag",bg:"#aeef9d",ink:"#171717",accent:"#1036af"},
    {id:"brought-receipts",lines:["I BROUGHT","RECEIPTS."],label:"I BROUGHT RECEIPTS.",kind:"THE EVIDENCE",desc:"For anyone who can back up every claim.",shape:"ticket",bg:"#faf4e7",ink:"#1036af",accent:"#f03d2f"},
    {id:"pitch-accepted",lines:["PITCH","ACCEPTED."],label:"PITCH ACCEPTED.",kind:"THE APPROVAL",desc:"For a pitch that wins over the room.",shape:"plaque",bg:"#1036af",ink:"#fff9ef",accent:"#aeef9d"},
    {id:"jury-is-out",lines:["THE JURY","IS STILL OUT."],label:"THE JURY IS STILL OUT.",kind:"THE VERDICT",desc:"For the friend who's not convinced yet.",shape:"tag",bg:"#c4d7f2",ink:"#171717",accent:"#f03d2f"},
    {id:"rest-my-case",lines:["I REST","MY CASE."],label:"I REST MY CASE.",kind:"THE CLOSING LINE",desc:"For the pitch that needs no further explanation.",shape:"bubble",bg:"#f03d2f",ink:"#fff9ef",accent:"#ffd63b"},
    {id:"make-your-case",lines:["MAKE","YOUR CASE."],label:"MAKE YOUR CASE.",kind:"THE SIGNATURE",desc:"The one phrase that belongs to the whole night.",shape:"plaque",bg:"#ffd63b",ink:"#171717",accent:"#1036af"}
  ];
  var shapes={
    bubble:"M123 64 H595 Q647 64 647 119 V328 Q647 376 599 376 H233 L147 431 L162 376 H124 Q75 376 75 331 V114 Q75 64 123 64 Z",
    ticket:"M112 70 H607 Q657 70 657 119 V169 Q619 177 619 219 Q619 260 657 271 V331 Q657 384 607 384 H112 Q62 384 62 334 V271 Q100 262 100 219 Q100 177 62 169 V119 Q62 70 112 70 Z",
    plaque:"M126 77 H596 Q645 77 645 125 V331 Q645 379 597 379 H126 Q75 379 75 329 V127 Q75 77 126 77 Z",
    tag:"M100 81 L609 54 L659 131 L622 376 L112 402 L60 325 Z"
  };
  var selected=0, logoData="", loading=false, toastTimer=0;
  var $=function(id){return document.getElementById(id)};
  var escapeXML=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]})};
  function shapeSVG(p){var d=shapes[p.shape];return '<path d="'+d+'" transform="translate(5 8)" fill="#171717" opacity=".18"/><path d="'+d+'" fill="'+p.bg+'" stroke="#ffffff" stroke-width="24" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="#171717" stroke-width="3" stroke-linejoin="round"/>'}
  function renderArt(p,index,exported){
    var max=p.lines.reduce(function(v,s){return Math.max(v,s.length)},0);
    var size=max>=14?54:max>=12?60:68;
    if(p.lines.length===3)size=Math.min(size,60);
    var gap=p.lines.length===3?70:83;
    var centerY=p.lines.length===3?225:225;
    var first=centerY-((p.lines.length-1)*gap/2);
    var lines=p.lines.map(function(s,i){return '<text x="360" y="'+(first+i*gap)+'" fill="'+p.ink+'" text-anchor="middle" dominant-baseline="middle" font-family="Anton,Impact,Arial Black,sans-serif" font-weight="900" font-size="'+size+'" letter-spacing="0.2">'+escapeXML(s)+'</text>'}).join("");
    var logo=logoData?'<image href="'+logoData+'" x="121" y="100" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>':'<text x="112" y="134" font-family="Arial,sans-serif" font-size="10" font-weight="900" fill="#171717">OFF SCRIPT</text>';
    var accent=p.shape==="bubble"?
      '<path d="M577 119 l31 -9" stroke="'+p.accent+'" stroke-width="11" stroke-linecap="round"/>':
      '<path d="M542 112 h66" stroke="'+p.accent+'" stroke-width="12" stroke-linecap="round"/>';
    var label=String(index+1).padStart(2,"0");
    var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480" width="720" height="480" role="img" aria-label="'+escapeXML(p.label)+' photo prop">';
    svg+='<title>'+escapeXML(p.label)+' | Off Script Pitch Night</title>';
    svg+=shapeSVG(p);
    svg+='<rect x="106" y="91" width="84" height="69" rx="14" fill="#faf4e7" opacity=".98"/>'+logo;
    svg+='<text x="598" y="131" text-anchor="end" fill="'+p.ink+'" font-family="Arial,sans-serif" font-size="15" font-weight="800" letter-spacing="3">'+label+' / 10</text>';
    svg+=accent+lines;
    svg+='<path d="M298 340 H418" stroke="'+p.accent+'" stroke-linecap="round" stroke-width="7"/>';
    svg+='<text x="360" y="362" fill="'+p.ink+'" font-family="Arial,sans-serif" font-size="15" font-weight="800" letter-spacing="3.1" text-anchor="middle">PITCH NIGHT · 2026</text>';
    svg+='</svg>';
    return svg;
  }
  function toast(t){var el=$("prop-toast");if(!el)return;el.textContent=t;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove("show")},3800)}
  function refreshGallery(){
    var grid=$("prop-gallery");if(!grid)return;
    grid.innerHTML=P.map(function(p,i){return '<button class="prop-tile" type="button" data-prop="'+i+'" aria-pressed="'+(i===selected)+'" aria-label="Choose '+escapeXML(p.label)+'"><span class="tile-art" aria-hidden="true">'+renderArt(p,i,false)+'</span><span class="tile-foot"><span>'+escapeXML(p.label)+'</span><small>'+String(i+1).padStart(2,"0")+'</small></span></button>'}).join("");
    grid.querySelectorAll("[data-prop]").forEach(function(b){b.addEventListener("click",function(){choose(Number(b.dataset.prop))})});
  }
  function choose(i){
    if(!Number.isInteger(i)||i<0||i>=P.length)return;
    selected=i;var p=P[i];
    $("prop-preview").innerHTML=renderArt(p,i,false);
    $("prop-preview").setAttribute("aria-label",p.label+" photo prop");
    $("selected-count").textContent=String(i+1).padStart(2,"0")+" / 10";
    $("prop-title").textContent=p.label;
    $("prop-description").textContent=p.desc;
    $("prop-kind").textContent=p.kind;
    document.querySelectorAll(".prop-tile").forEach(function(b,j){b.setAttribute("aria-pressed",String(j===i))});
  }
  function loadLogo(){
    var image=new Image();
    image.onload=function(){
      try{
        var c=document.createElement("canvas"),w=image.naturalWidth,h=image.naturalHeight;
        c.width=180;c.height=180;
        c.getContext("2d").drawImage(image,w*.1103,h*.2032,w*.7905,h*.7905,0,0,180,180);
        logoData=c.toDataURL("image/png");
      }catch(e){logoData=""}
      var h=$("hero-sticker");if(h)h.innerHTML=renderArt(P[0],0,false);
      if(document.body.classList.contains("print-mode"))renderPrint();
      else{refreshGallery();choose(selected)}
    };
    image.onerror=function(){toast("The Off Script logo could not be loaded. Refresh and try again.")};
    image.src="assets/offscript-logo.png";
  }
  function downloadBlob(blob,name){
    var url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},15000);
  }
  function selectedSVG(){return renderArt(P[selected],selected,true)}
  function downloadSVG(){
    var blob=new Blob([selectedSVG()],{type:"image/svg+xml;charset=utf-8"});
    downloadBlob(blob,"offscript-prop-"+P[selected].id+".svg");
    toast("SVG saved. Give this file to your printer.");
  }
  async function pngBlob(){
    await document.fonts.ready;
    var svg=selectedSVG();
    var url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
    try{
      var im=new Image();im.src=url;
      await new Promise(function(res,rej){im.onload=res;im.onerror=rej});
      var c=document.createElement("canvas");c.width=2160;c.height=1440;
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      return await new Promise(function(res){c.toBlob(res,"image/png")});
    }finally{URL.revokeObjectURL(url)}
  }
  async function savePNG(){
    if(loading)return;loading=true;try{
      var blob=await pngBlob();if(!blob)throw Error("Unable to generate PNG");
      downloadBlob(blob,"offscript-prop-"+P[selected].id+".png");toast("Image saved.");
    }catch(e){toast("The image could not be saved. Try the SVG print file instead.")}
    finally{loading=false}
  }
  async function shareProp(){
    if(loading)return;loading=true;
    try{
      var blob=await pngBlob();if(!blob)throw Error("Unable to make image");
      var name="offscript-prop-"+P[selected].id+".png";
      var file=new File([blob],name,{type:"image/png"});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"Off Script Pitch Night · "+P[selected].label});
      }else{downloadBlob(blob,name);toast("Image saved. You can share it from your device.")}
    }catch(e){if(e.name!=="AbortError")toast("Sharing was unavailable. Save the image instead.")}
    finally{loading=false}
  }
  function renderPrint(){
    var root=$("print-root");if(!root)return;
    root.hidden=false;
    root.innerHTML='<div class="print-toolbar"><strong>OFF SCRIPT / 10 PHOTO PROPS</strong><button type="button" id="print-now">PRINT OR SAVE AS PDF</button></div>'+
      P.map(function(p,i){return '<section class="print-sheet"><div>'+renderArt(p,i,true)+'</div><p class="sheet-meta">PROP '+String(i+1).padStart(2,"0")+' / 10 · CUT ALONG THE OUTER WHITE BORDER · FIT TO A4 LANDSCAPE</p></section>'}).join("");
    $("print-now").addEventListener("click",function(){window.print()});
  }
  function init(){
    var print=new URLSearchParams(location.search).get("print")==="1";
    if(print){document.body.classList.add("print-mode");renderPrint()}
    else{
      $("hero-sticker").innerHTML=renderArt(P[0],0,false);
      refreshGallery();choose(0);
      $("download-svg").addEventListener("click",downloadSVG);
      $("save-png").addEventListener("click",savePNG);
      $("share-prop").addEventListener("click",shareProp);
    }
    loadLogo();
  }
  init();
})();