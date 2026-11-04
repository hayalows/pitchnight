/* Off Script Pitch Night — minimalist personalised friend card.
   Uses the original logo and works entirely in the visitor's browser.
   This image is a share card, never a payment or admission credential. */
(() => {
  "use strict";
  const dialog = document.getElementById("pass-dialog");
  const canvas = document.getElementById("pass-canvas");
  const input = document.getElementById("pass-name");
  const downloadButton = document.getElementById("pass-download");
  const shareButton = document.getElementById("pass-share");
  const feedback = document.getElementById("pass-feedback");
  const closeButton = document.querySelector("[data-close-pass]");
  const openers = document.querySelectorAll("[data-open-pass]");
  const ctx = canvas?.getContext("2d", { alpha: false });
  if (!dialog || !ctx || !input) return;

  const W = 1080, H = 1350;
  const color = {
    cream:"#faf4e7", blue:"#1036b4", ink:"#171717", white:"#fffefa",
    red:"#e83e34", muted:"#777571", silver:"#c9ccd0", yellow:"#ffda3f"
  };
  const display = '"Anton", Impact, "Arial Narrow", sans-serif';
  const body = '"DM Sans", Arial, sans-serif';
  const logo = new Image();
  let logoReady = false;
  let logoFailed = false;
  let fontsReady = false;
  let scheduled = 0;
  let previousFocus = null;
  const friendName = () => input.value.trim().replace(/\s+/g," ").slice(0,42);

  function notify(message) {
    if (feedback) feedback.textContent = message;
  }
  function rectangle(x,y,w,h,fill) {
    ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
  }
  function rounded(x,y,w,h,r) {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  }
  function box(x,y,w,h,r,fill,stroke=null,width=0) {
    rounded(x,y,w,h,r);
    ctx.fillStyle=fill;ctx.fill();
    if(stroke&&width){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function drawText(str,x,y,font,fill,align="left",maxWidth) {
    ctx.fillStyle=fill;ctx.font=font;ctx.textBaseline="alphabetic";ctx.textAlign=align;
    if(maxWidth)ctx.fillText(str,x,y,maxWidth);else ctx.fillText(str,x,y);
    ctx.textAlign="left";
  }
  function rule(x1,y1,x2,y2,fill,width=4) {
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=fill;ctx.lineWidth=width;ctx.lineCap="round";ctx.stroke();
  }
  function officialLogo() {
    if (!logoReady) return;
    // Original Off Script PNG, cropped only to its transparent content.
    ctx.drawImage(logo,
      logo.naturalWidth*.1103,logo.naturalHeight*.2032,
      logo.naturalWidth*.7905,logo.naturalHeight*.7905,
      83,60,174,161);
  }
  function title() {
    officialLogo();
    drawText("PITCH NIGHT",330,127,'800 79px '+body,color.ink);
    rule(331,176,996,176,color.ink,4);

    const words="MAKE YOUR";
    let size=170;
    while(size>115) {
      ctx.font=size+"px "+display;
      if(ctx.measureText(words).width<=900)break;
      size-=2;
    }
    ctx.font=size+"px "+display;
    const left=86, baseline=404;
    const makeWidth=ctx.measureText("MAKE").width;
    drawText("MAKE",left,baseline,size+"px "+display,color.blue);
    drawText("YOUR",left+makeWidth+25,baseline,size+"px "+display,color.ink);
    drawText("CASE",84,595,"210px "+display,color.blue);
    // One red punctuation mark echoes the original flyer without a busy collage.
    rectangle(575,544,40,40,color.red);
  }
  function lanyard() {
    // A real-looking lanyard, but restrained so the ID tag stays the focus.
    const straps=[
      [[474,626],[495,673],[541,738]],
      [[635,626],[615,676],[563,738]]
    ];
    for(const [[x1,y1],[cx,cy],[x2,y2]] of straps) {
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(cx,cy,x2,y2);
      ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=color.ink;
      ctx.lineWidth=42;ctx.stroke();ctx.strokeStyle=color.blue;ctx.lineWidth=31;ctx.stroke();
    }
  }
  function fitName(str) {
    const words=str.toLocaleUpperCase().split(/\s+/).filter(Boolean);
    if(!words.length)return {lines:["YOUR FRIEND'S NAME"],size:103};
    const full=words.join(" ");
    ctx.font="142px "+display;
    let lines=[full];
    if(words.length>1&&ctx.measureText(full).width>780) {
      let best=null;
      for(let split=1;split<words.length;split++) {
        const one=words.slice(0,split).join(" "), two=words.slice(split).join(" ");
        const width=Math.max(ctx.measureText(one).width,ctx.measureText(two).width);
        if(!best||width<best.width)best={lines:[one,two],width};
      }
      if(best)lines=best.lines;
    }
    let size=lines.length===1?145:109;
    while(size>42) {
      ctx.font=size+"px "+display;
      if(lines.every(line=>ctx.measureText(line).width<=780))break;
      size-=2;
    }
    return {lines,size};
  }
  function nameTag() {
    // The clipped, very slightly angled badge is the single illustration.
    ctx.save();
    ctx.translate(540,904);
    ctx.rotate(-.022);

    box(-442+15,-194+16,884,392,29,color.ink);
    box(-442,-194,884,392,29,color.white,color.ink,8);
    box(-421,-173,842,348,20,color.white,color.blue,7);
    ctx.save();
    rounded(-419,-171,838,91,17);ctx.clip();
    rectangle(-419,-171,838,101,color.blue);
    ctx.restore();
    drawText("THE FRIEND I'M PITCHING",-385,-111,"800 35px "+body,color.white);

    const name=fitName(friendName());
    const ink=friendName()?color.ink:"#777571";
    if(name.lines.length===1) {
      drawText(name.lines[0],0,76,name.size+"px "+display,ink,"center",780);
    } else {
      drawText(name.lines[0],0,5,name.size+"px "+display,ink,"center",780);
      drawText(name.lines[1],0,122,name.size+"px "+display,ink,"center",780);
    }
    // One precise underline, kept below even long two-line names.
    rule(-350,150,349,150,color.red,9);
    ctx.restore();

    // Minimal metallic clasp explains the lanyard and adds depth.
    box(512,693,79,53,12,color.ink);
    box(507,688,79,49,12,color.silver,color.ink,6);
    box(521,700,50,25,6,color.white,color.muted,3);
  }
  function footer() {
    rule(84,1144,996,1144,color.ink,4);
    drawText("FRI 13 NOV 2026",85,1212,"800 39px "+body,color.ink);
    drawText("6:30 PM GMT",992,1212,"800 38px "+body,color.ink,"right");
    drawText("PITCH   /   FUN   /   GAMES",85,1277,"800 25px "+body,color.blue);
    drawText("SHARE CARD · NOT A TICKET",995,1277,"800 21px "+body,color.ink,"right");
  }
  function render() {
    rectangle(0,0,W,H,color.cream);
    title();
    lanyard();
    nameTag();
    footer();
    canvas.setAttribute("aria-label","Personalised Off Script Pitch Night friend share poster for "+(friendName()||"your friend"));
    const ready=Boolean(friendName()&&logoReady&&fontsReady);
    if(downloadButton)downloadButton.disabled=!ready;
    if(shareButton)shareButton.disabled=!ready;
  }
  function queueRender() {
    if(scheduled)cancelAnimationFrame(scheduled);
    scheduled=requestAnimationFrame(()=>{scheduled=0;render();});
  }
  logo.addEventListener("load",()=>{logoReady=true;logoFailed=false;queueRender();});
  logo.addEventListener("error",()=>{
    logoReady=false;logoFailed=true;
    notify("Off Script's original logo did not load. Reload the page to try again.");
    queueRender();
  });
  logo.src="assets/offscript-logo.png";
  Promise.all([
    document.fonts?.load?document.fonts.load("190px Anton"):Promise.resolve(),
    document.fonts?.load?document.fonts.load('800 35px "DM Sans"'):Promise.resolve()
  ]).then(()=>{fontsReady=true;queueRender();}).catch(()=>{fontsReady=true;queueRender();});

  function openPoster(trigger) {
    if(typeof dialog.showModal!=="function"||dialog.open)return;
    previousFocus=trigger||document.activeElement;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
    dialog.showModal();
    document.body.classList.add("dialog-is-open");
    queueRender();
    input.focus({preventScroll:true});
    if(logoFailed)notify("Reload the page to load the Off Script logo.");
  }
  openers.forEach(b=>b.addEventListener("click",()=>openPoster(b)));
  closeButton?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener("close",()=>{
    document.body.classList.remove("dialog-is-open");
    previousFocus?.focus?.({preventScroll:true});
    notify("");
  });
  input.addEventListener("input",()=>{notify("");queueRender();});
  const getPNG=()=>new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  const fileName=()=>"pitch-night-"+(friendName().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"").slice(0,38)||"friend")+".png";
  async function createPNG() {
    if(!friendName()||!logoReady||!fontsReady)return null;
    render();
    const blob=await getPNG();
    if(!blob)notify("Couldn't create the image. Try another browser.");
    return blob;
  }
  downloadButton?.addEventListener("click",async()=>{
    const blob=await createPNG();if(!blob)return;
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=fileName();
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    notify("PNG prepared. Check Downloads or your browser's save menu.");
  });
  if(shareButton&&typeof navigator.share==="function"&&typeof navigator.canShare==="function") {
    shareButton.hidden=false;
    shareButton.addEventListener("click",async()=>{
      const blob=await createPNG();if(!blob)return;
      const file=new File([blob],fileName(),{type:"image/png"});
      if(!navigator.canShare({files:[file]})){
        notify("Direct sharing isn't available here. Save the PNG instead.");return;
      }
      try{await navigator.share({files:[file],title:"Off Script Pitch Night",text:"I'm pitching a friend at Pitch Night."});}
      catch(err){if(err?.name!=="AbortError")notify("Sharing was unavailable. Save the poster instead.");}
    });
  }
  if(new URLSearchParams(location.search).get("poster")==="1")openPoster(document.querySelector("[data-open-pass]"));
  queueRender();
})();