/* Off Script Pitch Night: personalised friend poster, drawn locally at 1080 × 1350.
   A shareable graphic, never a registration or payment confirmation. */
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
  const C = {
    paper: "#faf4e7",
    ink: "#191919",
    cobalt: "#1036b4",
    red: "#ef392f",
    yellow: "#ffd93d",
    mint: "#b4f2a0",
    white: "#fffdfa",
    grey: "#787c82"
  };
  const DISPLAY = '"Anton", Impact, "Arial Narrow", sans-serif';
  const SANS = '"DM Sans", "Arial", sans-serif';
  const logo = new Image();
  let logoReady = false;
  let logoFailed = false;
  let fontsReady = false;
  let pendingFrame = 0;
  let previousFocus = null;
  const newName = () => input.value.trim().replace(/\s+/g, " ").slice(0, 42);

  function message(text) {
    if (feedback) feedback.textContent = text;
  }
  function rounded(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  function filled(x, y, w, h, r, fill, stroke, weight = 0) {
    rounded(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke && weight) {
      ctx.lineWidth = weight;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function text(string, x, y, font, color, align = "left", maxWidth) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    if (maxWidth) ctx.fillText(string, x, y, maxWidth);
    else ctx.fillText(string, x, y);
    ctx.textAlign = "left";
  }
  function line(points, color = C.ink, weight = 5) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.lineWidth = weight;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  function burst(cx, cy, inner, outer, points, angle, color) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = angle + i * Math.PI / points;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function heart(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, 19);
    ctx.bezierCurveTo(-37, -13, -24, -35, 0, -11);
    ctx.bezierCurveTo(22, -35, 38, -12, 0, 19);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
  function rays(x, y) {
    line([[x-19,y-15],[x-42,y-34]], C.red, 8);
    line([[x+4,y-17],[x+8,y-47]], C.red, 8);
    line([[x+22,y-1],[x+52,y-7]], C.red, 8);
  }
  function originalLogo() {
    if (!logoReady) return;
    // Use the original transparent PNG, cropping only its transparent edges.
    const sx = logo.naturalWidth * .1103;
    const sy = logo.naturalHeight * .2032;
    const sw = logo.naturalWidth * .7905;
    const sh = logo.naturalHeight * .7905;
    ctx.drawImage(logo, sx, sy, sw, sh, 73, 58, 173, 161);
  }

  function microphone() {
    burst(195, 420, 99, 173, 11, -.22, C.yellow);
    ctx.save();
    ctx.translate(214, 426);
    ctx.rotate(-.28);
    // A little printed white die-cut outline behind the retro microphone.
    filled(-46, 35, 92, 191, 28, C.white, C.white, 14);
    filled(-25, 103, 50, 120, 13, C.ink, C.white, 8);
    filled(-19, 112, 38, 88, 7, C.grey, C.ink, 6);
    filled(-27, 132, 54, 33, 9, C.ink);
    filled(-74, -116, 148, 198, 65, C.white, C.white, 21);
    filled(-68, -108, 136, 189, 62, C.ink);
    filled(-57, -96, 114, 165, 50, "#e8e7df", C.ink, 5);
    ctx.save();
    rounded(-50, -89, 100, 150, 42);
    ctx.clip();
    for (let y = -82; y < 56; y += 20) {
      ctx.beginPath();
      ctx.moveTo(-65, y);
      ctx.bezierCurveTo(-23, y + 20, 25, y + 17, 65, y);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 13; ctx.stroke();
    }
    for (let x = -47; x <= 47; x += 12) {
      for (let y = -82; y < 60; y += 12) {
        if ((x + y) % 24 === 0) {
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 2 * Math.PI); ctx.fillStyle = C.ink; ctx.fill();
        }
      }
    }
    ctx.restore();
    ctx.restore();
    rays(116, 236);
  }

  function headline() {
    text("OFF SCRIPT PRESENTS", 334, 91, '800 23px ' + SANS, C.ink);
    text("PITCH NIGHT", 329, 154, '800 64px ' + SANS, C.ink);
    line([[331,170],[987,170]], C.ink, 4);
    microphone();
    text("MAKE", 339, 312, '154px ' + DISPLAY, C.cobalt);
    text("YOUR", 342, 457, '163px ' + DISPLAY, C.ink);
    ctx.save();
    ctx.translate(579, 408);
    ctx.rotate(-.095);
    ctx.beginPath();
    ctx.ellipse(0, 0, 250, 69, 0, .05, Math.PI * 2.04);
    ctx.strokeStyle = C.red; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(7, -2, 259, 72, 0, 2.9, 5.55);
    ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    rays(899, 357);
    text("CASE", 338, 590, '167px ' + DISPLAY, C.cobalt);
    // One small star instead of a cloud of unrelated stickers.
    burst(949, 540, 20, 55, 5, -.4, C.yellow);
    burst(949, 540, 10, 38, 5, -.4, C.paper);
  }

  function lanyardAndBadge() {
    // Blue woven lanyard curving into the central ID badge.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-48, 846);
    ctx.bezierCurveTo(120, 759, 279, 585, 447, 644);
    ctx.strokeStyle = C.white; ctx.lineWidth = 87; ctx.lineCap = "round"; ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 78; ctx.stroke();
    ctx.strokeStyle = C.cobalt; ctx.lineWidth = 65; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 2; ctx.setLineDash([7, 12]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();

    // Badge is rotated as one object so the name moves with the artwork.
    ctx.save();
    ctx.translate(540, 808);
    ctx.rotate(-.039);
    filled(-440+13, -165+14, 880, 322, 51, C.ink);
    filled(-448, -173, 880, 322, 50, C.white, C.ink, 8);
    filled(-426, -152, 836, 280, 36, C.paper, C.cobalt, 15);
    // Top cobalt band is deliberately solid, not too textured to read.
    ctx.save();
    rounded(-419, -145, 824, 80, 24);
    ctx.clip();
    ctx.fillStyle = C.cobalt;
    ctx.fillRect(-420, -145, 826, 85);
    ctx.restore();
    text("THE FRIEND I'M PITCHING", -396, -93, '800 34px '+SANS, C.white);
    line([[348,-106],[386,-106]], C.white, 4);
    nameOnBadge(newName() || "FRIEND'S NAME");
    // Underscore always stays beneath the last name line.
    ctx.beginPath();
    ctx.moveTo(-356, 117);
    ctx.bezierCurveTo(-100, 97, 191, 115, 356, 108);
    ctx.lineWidth = 9; ctx.strokeStyle = C.red; ctx.lineCap = "round"; ctx.stroke();
    ctx.restore();

    // Metallic lanyard clip, with narrow readable silhouette.
    ctx.save();
    ctx.translate(523, 627);
    ctx.rotate(-.09);
    filled(-44, 5, 91, 56, 12, C.ink);
    filled(-43, -4, 86, 56, 12, "#b4b5b9", C.ink, 7);
    filled(-30, 9, 61, 26, 8, "#f2f1ed", C.grey, 4);
    ctx.restore();
    rays(952, 678);
    heart(120, 949, .9, -.1);
    heart(176, 975, .55, -.1);
  }

  function nameOnBadge(value) {
    const words = value.toLocaleUpperCase().split(/\s+/).filter(Boolean);
    const full = words.join(" ");
    let groups = [full];
    ctx.font = '130px '+DISPLAY;
    if (words.length > 1 && ctx.measureText(full).width > 770) {
      let split = 1, smallest = Infinity;
      for (let i = 1; i < words.length; i++) {
        const left = words.slice(0, i).join(" ");
        const right = words.slice(i).join(" ");
        const width = Math.max(ctx.measureText(left).width, ctx.measureText(right).width);
        if (width < smallest) { smallest = width; split = i; }
      }
      groups = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
    }
    let size = groups.length === 1 ? 131 : 78;
    // For very long names, shrink just the name rather than overflowing the card.
    for (; size >= 43; size -= 2) {
      ctx.font = size + 'px '+DISPLAY;
      if (groups.every(str => ctx.measureText(str).width <= 766)) break;
    }
    ctx.fillStyle = newName() ? C.ink : "#51515a";
    ctx.textAlign = "center";
    if (groups.length === 1) {
      ctx.font = size+'px '+DISPLAY;
      ctx.fillText(groups[0], -8, 72, 775);
    } else {
      ctx.font = size+'px '+DISPLAY;
      ctx.fillText(groups[0], -8, 27, 775);
      ctx.fillText(groups[1], -8, 99, 775);
    }
    ctx.textAlign = "left";
  }

  function speechBubble() {
    filled(116, 996, 855, 112, 40, C.white, C.white, 14);
    filled(120, 991, 849, 108, 36, C.mint, C.ink, 7);
    // A short speech-bubble tail stays outside the lettering.
    ctx.beginPath();
    ctx.moveTo(182, 1097);
    ctx.lineTo(152, 1120);
    ctx.lineTo(206, 1097);
    ctx.closePath(); ctx.fillStyle = C.mint; ctx.fill();
    line([[152,1120],[181,1097]], C.ink, 6);
    text("WHY SHOULD ANOTHER YOUNG SINGLE ADULT", 544, 1038, '700 28px '+SANS, C.ink, "center", 790);
    text("CONSIDER DATING YOUR FRIEND?", 544, 1077, '800 30px '+SANS, C.ink, "center", 790);
  }

  function calendarIcon(x,y) {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap="round";
    rounded(x,y,44,43,6);ctx.stroke();
    line([[x,y+13],[x+44,y+13]],C.ink,4);
    line([[x+11,y-7],[x+11,y+8]],C.ink,5);
    line([[x+33,y-7],[x+33,y+8]],C.ink,5);
  }
  function clockIcon(x,y) {
    ctx.beginPath(); ctx.arc(x,y,21,0,2*Math.PI);ctx.lineWidth=5;ctx.strokeStyle=C.ink;ctx.stroke();
    line([[x,y-12],[x,y],[x+12,y+7]],C.ink,5);
  }
  function schedule() {
    // Three coloured programme tickets. Crisp edges aid readability in stories.
    const x = 116, y = 1137, w = 848, h = 55;
    ctx.fillStyle=C.yellow;ctx.fillRect(x,y,w/3,h);
    ctx.fillStyle=C.mint;ctx.fillRect(x+w/3,y,w/3,h);
    ctx.fillStyle=C.cobalt;ctx.fillRect(x+2*w/3,y,w/3,h);
    ctx.strokeStyle=C.ink;ctx.lineWidth=5;ctx.strokeRect(x,y,w,h);
    line([[x+w/3,y],[x+w/3,y+h]],C.ink,5);
    line([[x+2*w/3,y],[x+2*w/3,y+h]],C.ink,5);
    text("PITCH", x+w/6, y+39, '800 34px '+SANS,C.ink,"center");
    text("FUN", x+w/2,y+39,'800 34px '+SANS,C.ink,"center");
    text("GAMES",x+w*5/6,y+39,'800 34px '+SANS,C.white,"center");

    // Event info is deliberately unambiguous even when shared out of context.
    filled(116, 1208, 848, 72, 2, C.white,C.ink,5);
    ctx.fillStyle=C.mint;ctx.fillRect(546,1211,415,66);
    line([[547,1210],[547,1277]], C.ink,5);
    calendarIcon(140,1224);
    clockIcon(589,1243);
    text("FRI 13 NOV 2026",205,1254,'800 29px '+SANS,C.ink);
    text("6:30 PM GMT",629,1254,'800 31px '+SANS,C.ink);
    line([[116,1314],[274,1314]],C.ink,2);
    line([[815,1314],[962,1314]],C.ink,2);
    text("SHARE POSTER · NOT A TICKET",545,1322,'800 20px '+SANS,C.ink,"center");
  }

  function render() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
    // Subtle print dots; no heavy raster background or network images.
    ctx.fillStyle="rgba(16,54,180,.042)";
    for (let y=40;y<1320;y+=30) for(let x=36;x<1050;x+=30) {
      ctx.fillRect(x,y,1,1);
    }
    originalLogo();
    headline();
    lanyardAndBadge();
    speechBubble();
    schedule();
    canvas.setAttribute("aria-label", "Off Script Pitch Night share poster for " + (newName() || "your chosen friend"));
    const canExport=Boolean(newName() && logoReady && fontsReady);
    if(downloadButton) downloadButton.disabled=!canExport;
    if(shareButton) shareButton.disabled=!canExport;
  }
  function scheduleRender() {
    if(pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame=requestAnimationFrame(() => {pendingFrame=0;render();});
  }
  logo.addEventListener("load",()=>{logoReady=true;logoFailed=false;scheduleRender();});
  logo.addEventListener("error",()=>{
    logoFailed=true;logoReady=false;
    message("The official Off Script logo could not load. Refresh this page and try again.");
    scheduleRender();
  });
  logo.src="assets/offscript-logo.png";

  Promise.all([
    document.fonts?.load ? document.fonts.load('150px Anton') : Promise.resolve(),
    document.fonts?.load ? document.fonts.load('800 34px "DM Sans"') : Promise.resolve()
  ]).then(()=>{fontsReady=true;scheduleRender();}).catch(()=>{
    fontsReady=true;scheduleRender();
  });

  function openStudio(trigger) {
    if(typeof dialog.showModal!=="function") return;
    if(dialog.open) return;
    previousFocus=trigger || document.activeElement;
    document.getElementById("pitch-cursor")?.classList.remove("is-visible");
    dialog.showModal();
    document.body.classList.add("dialog-is-open");
    scheduleRender();
    input.focus({preventScroll:true});
    if(logoFailed) message("Please reload the page to load the official Off Script logo.");
  }
  openers.forEach(button=>button.addEventListener("click",()=>openStudio(button)));
  closeButton?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog) dialog.close();});
  dialog.addEventListener("close",()=>{
    document.body.classList.remove("dialog-is-open");
    previousFocus?.focus?.({preventScroll:true});
    message("");
  });
  input.addEventListener("input",()=>{message("");scheduleRender();});
  const getPNG=()=>new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  function safeFilename() {
    const slug=newName().toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,38);
    return "pitch-night-"+(slug||"friend")+".png";
  }
  async function makePNG() {
    if(!newName() || !logoReady || !fontsReady) return null;
    render();
    const blob=await getPNG();
    if(!blob) message("Couldn't create the image. Try again or use another browser.");
    return blob;
  }
  downloadButton?.addEventListener("click",async()=>{
    const blob=await makePNG();
    if(!blob)return;
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=safeFilename();document.body.appendChild(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),30000);
    message("Poster prepared. Check Downloads or your browser's save menu.");
  });
  if(shareButton && typeof navigator.share==="function" && typeof navigator.canShare==="function") {
    shareButton.hidden=false;
    shareButton.addEventListener("click",async()=>{
      const blob=await makePNG();
      if(!blob)return;
      const file=new File([blob],safeFilename(),{type:"image/png"});
      if(!navigator.canShare({files:[file]})) {
        message("Your browser can't share this image directly. Save the PNG instead.");
        return;
      }
      try {
        await navigator.share({files:[file],title:"Off Script Pitch Night",text:"I'm pitching a friend at Pitch Night."});
      } catch (err) {
        if(err?.name!=="AbortError") message("Sharing was unavailable. Try saving the poster.");
      }
    });
  }
  if(new URLSearchParams(location.search).get("poster")==="1") {
    openStudio(document.querySelector("[data-open-pass]"));
  }
  scheduleRender();
})();