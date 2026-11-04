/* Off Script / Pitch Night — Direction 01, collectible friend pass.
   The original logo is loaded locally. No names or images leave the device.
   This is a share card, never proof of registration or payment. */
(() => {
  "use strict";
  const dialog=document.getElementById("pass-dialog");
  const canvas=document.getElementById("pass-canvas");
  const input=document.getElementById("pass-name");
  const download=document.getElementById("pass-download");
  const share=document.getElementById("pass-share");
  const feedback=document.getElementById("pass-feedback");
  const close=document.querySelector("[data-close-pass]");
  const openers=document.querySelectorAll("[data-open-pass]");
  const formatButtons=document.querySelectorAll("[data-poster-format]");
  const sizeLabel=document.getElementById("pass-preview-size");
  const context=canvas?.getContext("2d",{alpha:false});
  if(!dialog || !context || !input)return;
  const ctx=context;
  const PALETTE={paper:"#faf3e7",ink:"#191919",cobalt:"#1038b8",red:"#f03d32",
    cream:"#fff9ef",white:"#fffefa",yellow:"#ffd943",grey:"#8a8c92"};
  const FONT_HEAD='"Anton",Impact,"Arial Narrow",sans-serif';
  const FONT_BODY='"DM Sans",Arial,sans-serif';
  let format="post",logoReady=false,fontReady=false,paintFrame=0,previousFocus=null;
  const logo=new Image();
  let sourceWidth=1080,sourceHeight=1350;
  const person=()=>input.value.trim().replace(/\s+/g," ").slice(0,42);
  const tell=(message)=>{if(feedback)feedback.textContent=message;};
  const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);};
  const box=(x,y,w,h,r,fill,stroke=null,sw=0)=>{
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke&&sw){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}
  };
  const text=(str,x,y,font,fill,align="left")=>{
    ctx.fillStyle=fill;ctx.font=font;ctx.textBaseline="alphabetic";ctx.textAlign=align;
    ctx.fillText(str,x,y);ctx.textAlign="left";
  };
  const fit=(str,maxWidth,size,min=34,font=FONT_HEAD)=>{
    let s=size;for(;s>min;s-=2){ctx.font=s+"px "+font;if(ctx.measureText(str).width<=maxWidth)break;}
    return s;
  };
  const stroke=(path,fill,lineWidth=4)=>{
    ctx.beginPath();path(ctx);ctx.strokeStyle=fill;ctx.lineWidth=lineWidth;ctx.lineCap="round";ctx.stroke();
  };
  const redUnderline=(x,y,w)=>{
    stroke(c=>{c.moveTo(x,y);c.bezierCurveTo(x+w*.3,y-13,x+w*.73,y-11,x+w,y-4);},PALETTE.red,11);
    stroke(c=>{c.moveTo(x+10,y+7);c.quadraticCurveTo(x+w*.48,y-6,x+w*.83,y);},PALETTE.red,3);
  };
  function backdrop(height) {
    ctx.fillStyle=PALETTE.paper;ctx.fillRect(0,0,1080,height);
    const blue=ctx.createLinearGradient(0,0,1000,height);
    blue.addColorStop(0,"#214bd4");blue.addColorStop(.52,PALETTE.cobalt);blue.addColorStop(1,"#09247d");
    ctx.save();ctx.translate(1035,170);ctx.rotate(.54);
    box(-95,-290,280,height+480,140,blue);ctx.restore();
    // The second visible ribbon runs below the pass, giving the artboard some depth.
    ctx.save();ctx.translate(-55,height*.63);ctx.rotate(-.72);
    box(-120,-130,290,height*.85,145,blue);ctx.restore();
    // Restrained printed grain, kept away from text and the editable name.
    ctx.fillStyle="rgba(24,29,56,.028)";
    for(let y=12;y<height;y+=26)for(let x=14;x<1080;x+=26){ctx.fillRect(x,y,1.1,1.1);}
  }
  function drawLogo(x,y,w,h) {
    if(!logoReady)return;
    ctx.drawImage(logo,logo.naturalWidth*.1103,logo.naturalHeight*.2032,
      logo.naturalWidth*.7905,logo.naturalHeight*.7905,x,y,w,h);
  }
  function splitName(name) {
    const words=name.toLocaleUpperCase().split(/\s+/).filter(Boolean);
    if(!words.length)return ["FRIEND'S NAME"];
    const whole=words.join(" ");
    ctx.font="112px "+FONT_HEAD;
    if(ctx.measureText(whole).width<680)return [whole];
    let best=null;
    for(let i=1;i<words.length;i++){
      const first=words.slice(0,i).join(" "),second=words.slice(i).join(" ");
      const score=Math.max(ctx.measureText(first).width,ctx.measureText(second).width);
      if(!best||score<best.score)best={parts:[first,second],score};
    }
    return best?best.parts:[whole];
  }
  function badgeName(name) {
    const parts=splitName(name);
    const maxWidth=687;
    let size=parts.length===1?140:102;
    size=Math.min(...parts.map(s=>fit(s,maxWidth,size,45)));
    ctx.fillStyle=person()?PALETTE.white:"rgba(255,255,255,.72)";
    ctx.textAlign="center";ctx.font=size+"px "+FONT_HEAD;
    if(parts.length===1){
      ctx.fillText(parts[0],0,73,maxWidth);
    }else{
      ctx.fillText(parts[0],0,-1,maxWidth);
      ctx.fillText(parts[1],0,122,maxWidth);
    }
    ctx.textAlign="left";
  }
  function drawnPass(){
    ctx.save();
    // Pass is tilted like a real print artefact, not a flat spreadsheet card.
    ctx.translate(540,699);ctx.rotate(-.035);
    const x=-408,y=-493,w=816,h=1020;
    ctx.shadowColor="rgba(12,19,50,.25)";ctx.shadowBlur=32;ctx.shadowOffsetY=27;
    box(x+1,y+10,w,h,56,PALETTE.cream);
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    box(x,y,w,h,56,PALETTE.cream,"#e8dfd1",3);
    // Slot and metallic clasp.
    box(-66,y+42,132,31,17,PALETTE.ink);
    const steel=ctx.createLinearGradient(-45,0,45,0);
    steel.addColorStop(0,"#777476");steel.addColorStop(.22,"#faf4ed");
    steel.addColorStop(.52,"#b1a49b");steel.addColorStop(.78,"#f6eadc");steel.addColorStop(1,"#696463");
    box(-36,y-59,72,125,29,steel,"#5b5552",4);
    box(-19,y-45,38,88,14,"#faf6e9");
    // Official branding, small enough to support rather than dominate.
    drawLogo(x+61,y+106,131,128);
    ctx.fillStyle=PALETTE.ink;ctx.fillRect(x+226,y+130,2,76);
    text("PITCH NIGHT",x+262,y+181,"800 33px "+FONT_BODY,PALETTE.ink);

    ctx.strokeStyle="#d9d2c5";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+56,y+254);ctx.lineTo(x+w-56,y+254);ctx.stroke();
    // Central event message: joined period stays attached to CASE.
    text("MAKE",x+61,y+402,"154px "+FONT_HEAD,PALETTE.cobalt);
    text("YOUR CASE.",x+61,y+563,"111px "+FONT_HEAD,PALETTE.ink);
    redUnderline(x+78,y+598,402);

    // Printed name insert. Large white name on consistent deep blue.
    box(x+54,y+652,w-108,251,37,PALETTE.cobalt);
    ctx.save();ctx.translate(0,y+775);
    text("I'M PITCHING MY FRIEND",0,-78,"800 30px "+FONT_BODY,PALETTE.white,"center");
    badgeName(person());
    ctx.restore();

    // Event facts in one quiet line, never below the crop.
    text("FRI 13 NOV 2026",x+57,y+965,"800 25px "+FONT_BODY,PALETTE.ink);
    text("6:30 PM GMT",x+w-57,y+965,"800 25px "+FONT_BODY,PALETTE.ink,"right");
    ctx.restore();
  }
  function connector(){
    // Lanyard sits behind the pass and joins the slot without fake QR codes.
    const gradient=ctx.createLinearGradient(400,0,780,300);
    gradient.addColorStop(0,"#0a217b");gradient.addColorStop(.48,"#1954df");
    gradient.addColorStop(1,"#071c69");
    ctx.save();
    ctx.beginPath();ctx.moveTo(398,-120);ctx.bezierCurveTo(433,18,472,84,515,179);
    ctx.moveTo(786,-120);ctx.bezierCurveTo(723,20,671,92,575,180);
    ctx.lineCap="round";ctx.lineWidth=68;ctx.strokeStyle=PALETTE.ink;ctx.stroke();
    ctx.lineWidth=58;ctx.strokeStyle=gradient;ctx.stroke();
    ctx.restore();
    // Clasp connector behind the badge, with controlled metallic highlights.
    box(520,138,41,90,18,"#9b9691",PALETTE.ink,4);
    box(528,144,22,77,9,"#dcd5c6");
  }
  function drawCard() {
    clear();
    const story=format==="story";
    const height=story?1920:1350;
    backdrop(height);
    if(story){
      // Dedicated story composition, not a stretched feed card.
      text("FRIEND SPOTLIGHT",540,168,"800 43px "+FONT_BODY,PALETTE.ink,"center");
      ctx.save();ctx.translate(0,275);
    }
    connector();drawnPass();
    if(story){
      ctx.restore();
      text("PITCH • FUN • GAMES",540,1740,"800 39px "+FONT_BODY,PALETTE.cobalt,"center");
      text("SHARE CARD · NOT VALID FOR ENTRY",540,1820,"800 25px "+FONT_BODY,PALETTE.ink,"center");
    }else{
      text("SHARE CARD · NOT VALID FOR ENTRY",540,1306,"800 20px "+FONT_BODY,PALETTE.ink,"center");
    }
    const ready=Boolean(person()&&logoReady&&fontReady);
    if(download)download.disabled=!ready;
    if(share)share.disabled=!ready;
    canvas.setAttribute("aria-label","Off Script Pitch Night share card for "+(person()||"your friend"));
  }
  function schedulePaint(){
    if(paintFrame)cancelAnimationFrame(paintFrame);
    paintFrame=requestAnimationFrame(()=>{paintFrame=0;drawCard();});
  }
  function changeFormat(next){
    if(next!== "post"&&next!=="story")return;
    format=next;
    sourceWidth=1080;sourceHeight=next==="story"?1920:1350;
    canvas.width=sourceWidth;canvas.height=sourceHeight;
    canvas.dataset.format=next;
    if(sizeLabel)sizeLabel.textContent=sourceWidth+" × "+sourceHeight+" PNG";
    formatButtons.forEach(btn=>{
      const selected=btn.dataset.posterFormat===next;
      btn.setAttribute("aria-pressed",String(selected));
    });
    schedulePaint();
  }
  logo.addEventListener("load",()=>{logoReady=true;schedulePaint();});
  logo.addEventListener("error",()=>{logoReady=false;tell("The official logo didn't load. Refresh and try again.");schedulePaint();});
  logo.src="assets/offscript-logo.png";
  Promise.all([
    document.fonts?.load?document.fonts.load("160px Anton"):Promise.resolve(),
    document.fonts?.load?document.fonts.load('800 33px "DM Sans"'):Promise.resolve()
  ]).then(()=>{fontReady=true;schedulePaint();}).catch(()=>{fontReady=true;schedulePaint();});
  function showPoster(trigger){
    if(dialog.open||typeof dialog.showModal!=="function")return;
    previousFocus=trigger||document.activeElement;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
    dialog.showModal();document.body.classList.add("dialog-is-open");
    schedulePaint();input.focus({preventScroll:true});
  }
  openers.forEach(el=>el.addEventListener("click",()=>showPoster(el)));
  close?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener("close",()=>{
    document.body.classList.remove("dialog-is-open");
    previousFocus?.focus?.({preventScroll:true});tell("");
  });
  input.addEventListener("input",()=>{tell("");schedulePaint();});
  formatButtons.forEach(el=>el.addEventListener("click",()=>changeFormat(el.dataset.posterFormat)));
  const createPNG=()=>new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  const filename=()=>{
    const n=person().toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
      .replace(/^-|-$/g,"").slice(0,38)||"friend";
    return "pitch-night-"+n+"-"+format+".png";
  };
  async function exportPNG(){
    if(!person()||!logoReady||!fontReady)return null;
    drawCard();return await createPNG();
  }
  download?.addEventListener("click",async()=>{
    const blob=await exportPNG();if(!blob){tell("Unable to make PNG. Try again.");return;}
    const href=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=href;a.download=filename();
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(href),30000);
    tell("Poster saved to your browser's downloads.");
  });
  if(share && navigator.share && navigator.canShare){
    share.hidden=false;
    share.addEventListener("click",async()=>{
      const blob=await exportPNG();if(!blob)return;
      const file=new File([blob],filename(),{type:"image/png"});
      if(!navigator.canShare({files:[file]})){
        tell("File sharing isn't supported here. Download the PNG instead.");return;
      }
      try{await navigator.share({files:[file],title:"Pitch Night · Make Your Case"});}
      catch(e){if(e?.name!=="AbortError")tell("Sharing was unavailable. Download the PNG instead.");}
    });
  }
  if(new URLSearchParams(location.search).get("poster")==="1"){
    showPoster(document.querySelector("[data-open-pass]"));
  }
  changeFormat("post");
})();