/* OffScript Edition 001 thank-you card: rendered entirely in the browser.
   No uploads, accounts or image-generation service. */
(() => {
"use strict";
const $=id=>document.getElementById(id),canvas=$("card-canvas");
const ctx=canvas?.getContext("2d",{alpha:false}),nameEl=$("card-name"),save=$("card-download"),share=$("card-share"),copy=$("card-copy-link"),sizeEl=$("card-size"),status=$("card-status");
if(!ctx){if(status)status.textContent="Card preview is unavailable in this browser.";return;}
const c={paper:"#faf4e7",ink:"#171717",blue:"#1036af",red:"#f03d2f",yellow:"#ffd63b",mint:"#aeef9d"};
const choices={
 everyone:{label:"TO THE WHOLE ROOM",text:"To everyone who showed up, supported the idea or helped behind the scenes, thank you for being part of our first Pitch Night."},
 attendees:{label:"TO EVERYONE WHO CAME THROUGH",text:"You showed up, brought your energy and made our first Pitch Night memorable. We loved having you in the room."},
 volunteers:{label:"TO THE PEOPLE BEHIND THE SCENES",text:"You gave your time and helped make the night happen. Thank you for the care, patience and effort behind Edition 001."},
 supporters:{label:"TO THOSE WHO BACKED THE IDEA",text:"Thank you for believing in this little idea and helping us bring our first edition to life. We appreciate you."}
};
const q=new URLSearchParams(location.search);
const state={to:Object.hasOwn(choices,q.get("to"))?q.get("to"):"everyone",format:q.get("format")==="story"?"story":"post",name:String(q.get("name")||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,32)};
nameEl.value=state.name;
const logo=new Image();let hasLogo=false,blob=null,revision=0,typing=0;
const say=t=>{status.textContent=t;};
function setPressed(){document.querySelectorAll("[data-to]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.to===state.to)));document.querySelectorAll("[data-format]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.format===state.format)));}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function font(n,family="Anton",weight="400"){return weight+" "+n+"px "+(family==="Anton"?"Anton, Impact, sans-serif":'"Space Grotesk", Arial, sans-serif');}
function drawText(s,x,y,n,color,family="Anton",weight="400"){ctx.textBaseline="alphabetic";ctx.textAlign="left";ctx.font=font(n,family,weight);ctx.fillStyle=color;ctx.fillText(s,x,y);}
function fit(s,x,y,n,max,color,family="Anton",weight="400"){while(n>20){ctx.font=font(n,family,weight);if(ctx.measureText(s).width<=max)break;n-=3;}drawText(s,x,y,n,color,family,weight);}
function wrap(s,x,y,maxW,baseSize,lineHeight,maxLines){
 let sz=baseSize,lines=[];
 for(let attempt=0;attempt<12;attempt++){
  ctx.font=font(sz,"Space Grotesk","500");let cur="";lines=[];
  for(const w of s.split(/\s+/)){
   const candidate=cur?cur+" "+w:w;
   if(cur&&ctx.measureText(candidate).width>maxW){lines.push(cur);cur=w;}else cur=candidate;
  }
  if(cur)lines.push(cur);
  if(lines.length<=maxLines)break;
  sz=Math.max(23,sz-3);
 }
 ctx.fillStyle=c.ink;ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font=font(sz,"Space Grotesk","500");
 lines.forEach((line,i)=>ctx.fillText(line,x,y+i*(lineHeight*(sz/baseSize))));
}
function star(x,y,outer,inner,count,color,angle=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();
 for(let i=0;i<count*2;i++){const a=-Math.PI/2+i*Math.PI/count,r=i%2?inner:outer;
 if(!i)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
 ctx.closePath();ctx.fill();ctx.restore();
}
function render(){
 const story=state.format==="story",H=story?1920:1350,W=1080,hero=story?1267:785;
 canvas.width=W;canvas.height=H;
 rect(0,0,W,H,c.ink);rect(16,16,W-32,H-32,c.paper);
 rect(16,16,W-32,hero-16,c.blue);rect(16,16,W-32,155,c.yellow);
 rect(35,176,1010,3,c.paper);
 if(hasLogo)ctx.drawImage(logo,46,28,133,133);
 else fit("OFFSCRIPT",54,111,62,410,c.ink);
 fit("PITCH NIGHT / EDITION 001",520,107,37,498,c.ink,"Space Grotesk","700");
 drawText("A NOTE FROM THE OFFSCRIPT TEAM",65,story?266:214,30,c.paper,"Space Grotesk","700");
 fit("THANK",61,story?615:480,story?340:314,953,c.paper);
 fit("YOU.",61,story?974:733,story?352:317,930,c.yellow);
 ctx.strokeStyle=c.red;ctx.lineWidth=16;ctx.lineCap="round";ctx.beginPath();let y=story?997:755;
 ctx.moveTo(72,y);ctx.bezierCurveTo(256,y-27,520,y+31,785,y-10);ctx.stroke();
 let stickerY=story?hero-200:hero-120;
 ctx.save();ctx.translate(816,stickerY);ctx.rotate(.13);
 rect(-137,-50,280,107,c.ink);rect(-146,-60,280,107,c.mint);
 fit("THE CASE WAS MADE.",-127,7,28,246,c.ink,"Space Grotesk","700");ctx.restore();
 star(963,story?286:255,35,13,7,c.red,.1);
 star(105,hero-127,24,8,6,c.yellow,.18);
 const recipient=state.name.replace(/\s+/g," ").trim();
 const label=recipient?"A LITTLE THANK YOU FOR":choices[state.to].label;
 fit(label,61,hero+67,34,950,c.blue,"Space Grotesk","700");
 let bodyY=hero+126;
 if(recipient){fit(recipient.toLocaleUpperCase(),61,hero+148,64,933,c.ink);bodyY=hero+209;}
 wrap(choices[state.to].text,64,bodyY,945,story?48:42,story?65:55,recipient?4:5);
 const footer=H-135;
 drawText("WITH GRATITUDE, THE OFFSCRIPT TEAM",64,footer-28,27,c.blue,"Space Grotesk","700");
 rect(16,footer,1048,119,c.ink);
 fit("BEYOND THE USUAL. INTO CONNECTION.",64,footer+76,36,941,c.paper,"Space Grotesk","700");
 sizeEl.textContent=W+" × "+H+" PNG";
 canvas.setAttribute("aria-label","OffScript Edition 001 thank-you card for "+(recipient||state.to)+". "+choices[state.to].text);
}
function encode(){
 const n=++revision;blob=null;save.disabled=true;share.disabled=true;
 try{canvas.toBlob(b=>{if(n!==revision)return;if(!b){say("Image export isn't available in this browser.");return;}
 blob=b;save.disabled=false;share.disabled=false;},"image/png");}
 catch(_){say("The card couldn't be prepared. Try another browser.");}
}
function refresh(){render();encode();}
function filename(){return "offscript-001-thank-you-"+state.to+"-"+state.format+".png";}
function download(){
 if(!blob){say("Your image is still preparing.");return;}
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename();a.style.display="none";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
 say("PNG prepared. Check your downloads or files.");
}
async function shareImage(){
 if(!blob){say("Your image is still preparing.");return;}
 const file=new File([blob],filename(),{type:"image/png"});
 if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
  try{await navigator.share({files:[file],title:"OffScript / Thank You",text:"A little thank-you from Edition 001."});say("Share sheet opened.");}
  catch(e){if(e.name!=="AbortError")say("Sharing wasn't available. Save the PNG instead.");}
 }else{download();say("Direct image sharing isn't supported here. Your PNG has been prepared.");}
}
async function copyLink(){
 const url=new URL("thank-you-card.html",location.href);url.searchParams.set("to",state.to);
 if(state.format!=="post")url.searchParams.set("format",state.format);
 if(state.name)url.searchParams.set("name",state.name);
 try{
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url.href);
   say("Design link copied. Anyone with it can see the name you added.");}
  else if(navigator.share){await navigator.share({url:url.href,title:"OffScript thank-you card"});say("Card link shared.");}
  else say("Use your browser's Share action to send the page.");
 }catch(e){if(e.name!=="AbortError")say("Couldn't copy the link. Use your browser's Share action.");}
}
document.querySelectorAll("[data-to]").forEach(b=>b.addEventListener("click",()=>{state.to=b.dataset.to;setPressed();refresh();say("");}));
document.querySelectorAll("[data-format]").forEach(b=>b.addEventListener("click",()=>{state.format=b.dataset.format;setPressed();refresh();say("");}));
nameEl.addEventListener("input",()=>{state.name=nameEl.value.replace(/[\u0000-\u001f\u007f]/g,"").slice(0,32);
 clearTimeout(typing);typing=setTimeout(()=>{refresh();say("");},110);});
save.addEventListener("click",download);share.addEventListener("click",shareImage);copy.addEventListener("click",copyLink);
setPressed();refresh();
Promise.all([document.fonts.load('400 96px Anton'),document.fonts.load('700 36px "Space Grotesk"')]).then(refresh).catch(()=>{});
logo.onload=()=>{hasLogo=true;refresh();};logo.onerror=()=>{hasLogo=false;refresh();};
logo.src="assets/offscript-logo.png";
})();