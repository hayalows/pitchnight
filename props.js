/* Off Script Pitch Night / The Prop Studio.
   Curated cut-out designs. No accounts, tracking, uploads or external APIs. */
(function(){
  "use strict";
  var FONT_FILES={anton:"assets/fonts/anton-props.woff2",grotesk:"assets/fonts/space-grotesk-props.woff2"};
  var selected=0, logoData="", fontCSS="", loading=false, toastTimer=0;
  var $=function(id){return document.getElementById(id)};
  var pad=function(n){return String(n).padStart(2,"0")};
  var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var escapeXML=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]})};
  /* Ten cut-out props. Each one has its own die-cut silhouette; all share one type system
     (Anton display, Space Grotesk micro-type), one white cutting border and one shadow. */
  var C={paper:"#faf4e7",ink:"#171717",blue:"#1036af",red:"#f03d2f",yellow:"#ffd63b",mint:"#aeef9d",white:"#ffffff"};
  var P=[
    {id:"hear-me-out",label:"HEAR ME OUT.",kind:"THE OPENING LINE",desc:"The line for someone who has a case to make.",art:artBubble},
    {id:"im-the-friend",label:"I'M THE FRIEND.",kind:"THE REVEAL",desc:"For the person everyone has been talking about.",art:artTicket},
    {id:"whos-pitching-me",label:"WHO'S PITCHING ME?",kind:"THE QUESTION",desc:"For anyone ready to hear a convincing introduction.",art:artBurst},
    {id:"my-friend-is-a-catch",label:"MY FRIEND IS A CATCH.",kind:"THE RECOMMENDATION",desc:"For the friend with a proper case to make.",art:artTag},
    {id:"green-flags",label:"SHOW ME THE GREEN FLAGS.",kind:"THE CHECKLIST",desc:"For the audience evaluating every pitch.",art:artFlag},
    {id:"brought-receipts",label:"I BROUGHT RECEIPTS.",kind:"THE EVIDENCE",desc:"For anyone who can back up every claim.",art:artReceipt},
    {id:"pitch-accepted",label:"PITCH ACCEPTED.",kind:"THE APPROVAL",desc:"For a pitch that wins over the room.",art:artRosette},
    {id:"jury-is-out",label:"THE JURY IS STILL OUT.",kind:"THE VERDICT",desc:"For the friend who's not convinced yet.",art:artCapsule},
    {id:"rest-my-case",label:"I REST MY CASE.",kind:"THE CLOSING LINE",desc:"For the pitch that needs no further explanation.",art:artStamp},
    {id:"make-your-case",label:"MAKE YOUR CASE.",kind:"THE SIGNATURE",desc:"The one phrase that belongs to the whole night.",art:artArch}
  ];
  /* Anton advance widths (em) for the self-hosted subset, used to size each line to its shape. */
  var AW={" ":.234,"!":.229,"'":.214,"’":.232,"?":.492,".":.229,",":.236,"-":.311,"0":.494,"1":.331,"2":.494,"3":.494,"4":.494,"5":.494,"6":.494,"7":.494,"8":.494,"9":.494,"A":.485,"B":.479,"C":.474,"D":.493,"E":.412,"F":.399,"G":.485,"H":.499,"I":.227,"J":.466,"K":.472,"L":.397,"M":.746,"N":.498,"O":.486,"P":.472,"Q":.494,"R":.477,"S":.461,"T":.396,"U":.474,"V":.469,"W":.712,"X":.484,"Y":.446,"Z":.41};
  var AF="Anton,Impact,'Arial Narrow',sans-serif",GF="'Space Grotesk',Arial,sans-serif",CAP=.859,SKEW=Math.tan(10*Math.PI/180);
  var CREDIT="OFF SCRIPT · PITCH NIGHT 2026",uid=0;
  function textWidth(s){var w=0;for(var i=0;i<s.length;i++)w+=AW[s.charAt(i)]||.48;return w}
  function fit(s,maxW,maxSize){return Math.min(maxSize,maxW/textWidth(s))}
  function f1(n){return Math.round(n*10)/10}
  /* One display line. parts = [[text, colour], ...]; skew sets it in a faux italic around its own centre. */
  function line(o){
    var s=o.size,anchor=o.anchor||"middle",w=0;
    o.parts.forEach(function(p){w+=textWidth(p[0])});
    var dx=o.skew?-s*CAP*SKEW/2:0;
    var spans=o.parts.map(function(p){return '<tspan fill="'+p[1]+'">'+escapeXML(p[0])+'</tspan>'}).join("");
    return {w:w*s,svg:'<g transform="translate('+f1(o.x+dx)+' '+f1(o.y)+')'+(o.skew?' skewX(-10)':'')+(o.rot?' rotate('+o.rot+')':'')+'"><text x="0" y="0" text-anchor="'+anchor+'" font-family="'+AF+'" font-size="'+f1(s)+'">'+spans+'</text></g>'};
  }
  function micro(t,x,y,fill,o){
    o=o||{};
    var tr=o.rot?' transform="rotate('+o.rot+' '+x+' '+y+')"':'';
    return '<text x="'+x+'" y="'+y+'"'+tr+' fill="'+fill+'" font-family="'+GF+'" font-size="'+(o.size||13)+'" font-weight="700" letter-spacing="'+(o.ls==null?2.6:o.ls)+'" text-anchor="'+(o.anchor||"middle")+'"'+(o.op?' opacity="'+o.op+'"':'')+'>'+escapeXML(t)+'</text>';
  }
  /* The Off Script logo as a small stuck-on sticker; its white square joins the die-cut border. */
  function logo(x,y,s,rot){
    var h=s/2,g='translate('+x+' '+y+') rotate('+(rot||0)+')';
    var sil='<rect x="'+(-h)+'" y="'+(-h)+'" width="'+s+'" height="'+s+'" rx="'+f1(s*.2)+'" transform="'+g+'"/>';
    var inner=logoData?'<image href="'+logoData+'" x="'+f1(-h+s*.08)+'" y="'+f1(-h+s*.08)+'" width="'+f1(s*.84)+'" height="'+f1(s*.84)+'" preserveAspectRatio="xMidYMid meet"/>':'<text x="0" y="4" text-anchor="middle" font-family="'+GF+'" font-size="'+f1(s*.17)+'" font-weight="700" fill="#171717">OFF SCRIPT</text>';
    return {sil:sil,art:'<g transform="'+g+'"><rect x="'+(-h)+'" y="'+(-h)+'" width="'+s+'" height="'+s+'" rx="'+f1(s*.2)+'" fill="#ffffff" stroke="#171717" stroke-opacity=".14" stroke-width="1.5"/>'+inner+'</g>'};
  }
  /* Hand-made marks: a marker underline, a loose circle, a sparkle, a tick, strips of tape. */
  function underline(x0,x1,y,col,w){
    var L=x1-x0;
    return '<path d="M'+f1(x0)+' '+f1(y+3)+' C'+f1(x0+L*.28)+' '+f1(y-4)+' '+f1(x0+L*.6)+' '+f1(y+5)+' '+f1(x1)+' '+f1(y-3)+'" fill="none" stroke="'+col+'" stroke-width="'+(w||9)+'" stroke-linecap="round"/>';
  }
  function scribble(cx,cy,rx,ry,col,w,rot){
    var pts=[],n=26,a0=-2.3,a1=a0+Math.PI*2+.55;
    for(var k=0;k<=n;k++){var t=k/n,a=a0+(a1-a0)*t,r=1+.035*Math.sin(t*9)+(t>.85?.06*(t-.85)/.15:0);pts.push([cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r*(1+.04*t)])}
    var d="M"+f1(pts[0][0])+" "+f1(pts[0][1]);
    for(k=1;k<pts.length-1;k++){var mx=(pts[k][0]+pts[k+1][0])/2,my=(pts[k][1]+pts[k+1][1])/2;d+=" Q"+f1(pts[k][0])+" "+f1(pts[k][1])+" "+f1(mx)+" "+f1(my)}
    return '<path d="'+d+'" transform="rotate('+(rot||-4)+' '+cx+' '+cy+')" fill="none" stroke="'+col+'" stroke-width="'+(w||7)+'" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function sparkle(x,y,r,col){
    var q=r*.16;
    return '<path d="M'+x+' '+f1(y-r)+' C'+f1(x+q)+' '+f1(y-q)+' '+f1(x+q)+' '+f1(y-q)+' '+f1(x+r)+' '+y+' C'+f1(x+q)+' '+f1(y+q)+' '+f1(x+q)+' '+f1(y+q)+' '+x+' '+f1(y+r)+' C'+f1(x-q)+' '+f1(y+q)+' '+f1(x-q)+' '+f1(y+q)+' '+f1(x-r)+' '+y+' C'+f1(x-q)+' '+f1(y-q)+' '+f1(x-q)+' '+f1(y-q)+' '+x+' '+f1(y-r)+' Z" fill="'+col+'"/>';
  }
  function tape(x,y,w,h,rot,col){
    return '<g transform="translate('+x+' '+y+') rotate('+rot+')"><path d="M'+(-w/2)+' '+(-h/2)+' L'+(w/2)+' '+(-h/2)+' L'+(w/2-4)+' '+(-h/6)+' L'+(w/2)+' '+(h/6)+' L'+(w/2-3)+' '+(h/2)+' L'+(-w/2)+' '+(h/2)+' L'+(-w/2+4)+' '+(h/5)+' L'+(-w/2)+' '+(-h/6)+' Z" fill="'+(col||C.paper)+'" opacity=".88"/></g>';
  }
  function rnd(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}

  /* 01: a speech bubble with a swung tail. */
  function artBubble(i,u){
    var d="M156 44 H566 C620 44 652 78 652 130 V280 C652 332 620 364 566 364 H268 C236 398 186 428 118 446 C148 418 166 392 172 364 H154 C100 364 68 332 68 280 V130 C68 78 100 44 156 44 Z";
    var L=logo(626,64,66,8);
    var a=line({x:112,y:178,size:102,anchor:"start",parts:[["HEAR ME",C.paper]]});
    var b=line({x:108,y:330,size:160,anchor:"start",skew:true,parts:[["OUT.",C.yellow]]});
    var art='<path d="'+d+'" fill="'+C.blue+'"/>'+a.svg+underline(110,110+b.w-10,346,C.red,10)+b.svg+
      '<g fill="none" stroke="'+C.yellow+'" stroke-width="8" stroke-linecap="round"><path d="M408 222 Q428 204 440 178"/><path d="M420 256 Q456 246 478 224"/><path d="M424 292 Q462 294 490 280"/></g>'+
      micro(CREDIT,612,316,C.paper,{size:11,anchor:"end",ls:2,op:.82})+L.art;
    return {sil:['<path d="'+d+'"/>',L.sil],art:art};
  }
  /* 02: an admission ticket with concave corners, a perforated stub and a barcode. */
  function artTicket(i,u){
    var x0=58,x1=662,y0=72,y1=408,r=28,px=520,n=20;
    var d="M"+x0+" "+(y0+r)+" A"+r+" "+r+" 0 0 0 "+(x0+r)+" "+y0+" H"+(px-n)+" A"+n+" "+n+" 0 0 0 "+(px+n)+" "+y0+" H"+(x1-r)+" A"+r+" "+r+" 0 0 0 "+x1+" "+(y0+r)+
      " V"+(y1-r)+" A"+r+" "+r+" 0 0 0 "+(x1-r)+" "+y1+" H"+(px+n)+" A"+n+" "+n+" 0 0 0 "+(px-n)+" "+y1+" H"+(x0+r)+" A"+r+" "+r+" 0 0 0 "+x0+" "+(y1-r)+" Z";
    var cp="tk"+u,bars="",rr=rnd(7),bx=556;
    while(bx<626){var bw=2+Math.round(rr()*5);bars+='<rect x="'+bx+'" y="270" width="'+bw+'" height="104" fill="'+C.paper+'"/>';bx+=bw+2+Math.round(rr()*4)}
    var a=line({x:289,y:190,size:110,parts:[["I’M THE",C.ink]]});
    var b=line({x:289,y:332,size:132,skew:true,parts:[["FRIEND.",C.red]]});
    var art='<defs><clipPath id="'+cp+'"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+C.yellow+'"/>'+
      '<rect x="'+px+'" y="'+y0+'" width="'+(x1-px)+'" height="'+(y1-y0)+'" fill="'+C.red+'" clip-path="url(#'+cp+')"/>'+
      '<line x1="'+px+'" y1="'+(y0+30)+'" x2="'+px+'" y2="'+(y1-30)+'" stroke="'+C.ink+'" stroke-width="5" stroke-linecap="round" stroke-dasharray=".1 13"/>'+
      bars+
      micro(CREDIT,289,386,C.ink,{size:12,ls:3})+
      a.svg+scribble(289,284,204,66,C.blue,7,-3)+b.svg;
    var L=logo(600,212,62,-6);
    return {sil:['<path d="'+d+'"/>'],art:art+L.art};
  }
  /* 03: a shout burst with one long spike. */
  function artBurst(i,u){
    var rr=rnd(23),n=17,cx=360,cy=238,pts=[];
    for(var k=0;k<n*2;k++){
      var a=-Math.PI/2+k*Math.PI/n,out=k%2===0,j=out?.97+rr()*.07:.8+rr()*.05,rx=322,ry=214;
      a+=(rr()-.5)*.08;if(k===22){j=1.16}
      pts.push(f1(cx+Math.cos(a)*rx*j)+" "+f1(cy+Math.sin(a)*ry*j));
    }
    var d="M"+pts.join(" L")+" Z";
    var a=line({x:360,y:214,size:122,parts:[["WHO’S",C.paper]]});
    var b=line({x:360,y:314,size:94,skew:true,parts:[["PITCHING ME?",C.yellow]]});
    var L=logo(150,112,62,-12);
    var art='<path d="'+d+'" fill="'+C.red+'" stroke="'+C.red+'" stroke-width="6" stroke-linejoin="round"/>'+a.svg+b.svg+
      micro(CREDIT,360,356,C.paper,{size:12,ls:3,op:.9})+
      sparkle(560,146,22,C.yellow)+sparkle(594,180,11,C.paper)+L.art;
    return {sil:['<path d="'+d+'"/>',L.sil],art:art};
  }
  /* 04: a price tag with a reinforced eyelet. */
  function artTag(i,u){
    var d="M178 78 H612 C640 78 662 100 662 128 V352 C662 380 640 402 612 402 H178 L76 266 C66 252 66 228 76 214 Z";
    var hole="M114 240 m-17 0 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z";
    var a=line({x:194,y:170,size:fit("MY FRIEND IS A",400,100),anchor:"start",parts:[["MY FRIEND IS A",C.paper]]});
    var b=line({x:188,y:340,size:fit("CATCH.",440,180),anchor:"start",skew:true,parts:[["CATCH.",C.yellow]]});
    var art='<path d="'+d+' '+hole+'" fill="'+C.ink+'" fill-rule="evenodd"/>'+
      '<circle cx="114" cy="240" r="26" fill="none" stroke="'+C.yellow+'" stroke-width="10"/>'+
      a.svg+b.svg+sparkle(632,212,18,C.yellow)+
      micro(CREDIT,192,376,C.paper,{size:11,anchor:"start",ls:2.6,op:.8});
    var L=logo(640,88,62,8);
    return {sil:['<path d="'+d+' '+hole+'" fill-rule="evenodd"/>',L.sil],art:art+L.art};
  }
  /* 05: a swallowtail flag on a pole. */
  function artFlag(i,u){
    var pole="M64 48 C64 38 92 38 92 48 V444 C92 456 64 456 64 444 Z";
    var d="M92 62 C250 34 450 88 664 52 L590 220 L664 388 C452 420 250 368 92 392 Z";
    var a=line({x:124,y:176,size:fit("SHOW ME THE GREEN",440,70),anchor:"start",parts:[["SHOW ME THE ",C.ink],["GREEN",C.blue]]});
    var b=line({x:122,y:340,size:150,anchor:"start",skew:true,parts:[["FLAGS.",C.blue]]});
    var art='<path d="'+d+'" fill="'+C.mint+'"/><path d="'+pole+'" fill="'+C.ink+'"/><circle cx="78" cy="40" r="17" fill="'+C.yellow+'" stroke="'+C.ink+'" stroke-width="4"/>'+
      a.svg+b.svg+'<path d="M528 270 L552 298 L600 222" fill="none" stroke="'+C.red+'" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'+
      micro(CREDIT,78,412,C.paper,{size:10,ls:2,anchor:"start",rot:-90});
    var L=logo(626,84,62,9);
    return {sil:['<path d="'+pole+'"/>','<circle cx="78" cy="40" r="17"/>','<path d="'+d+'"/>',L.sil],art:art+L.art};
  }
  /* 06: a till receipt with torn edges, taped to the board. */
  function artReceipt(i,u){
    var x0=150,x1=570,y0=40,y1=440,t=15,k,d="M"+x0+" "+y0;
    var steps=Math.round((x1-x0)/(t*2));var sw=(x1-x0)/steps;
    for(k=0;k<steps;k++)d+=" L"+f1(x0+sw*k+sw/2)+" "+(y0+9)+" L"+f1(x0+sw*(k+1))+" "+y0;
    d+=" L"+x1+" "+y1;
    for(k=steps-1;k>=0;k--)d+=" L"+f1(x0+sw*k+sw/2)+" "+(y1-9)+" L"+f1(x0+sw*k)+" "+y1;
    d+=" Z";
    var a=line({x:360,y:200,size:fit("I BROUGHT",360,104),parts:[["I BROUGHT",C.blue]]});
    var b=line({x:360,y:322,size:fit("RECEIPTS.",380,120),skew:true,parts:[["RECEIPTS.",C.red]]});
    var rule=function(y){return '<line x1="'+(x0+30)+'" y1="'+y+'" x2="'+(x1-30)+'" y2="'+y+'" stroke="'+C.ink+'" stroke-width="2.5" stroke-dasharray="6 6" opacity=".55"/>'};
    var rr=rnd(3),bars="",bx=270;
    while(bx<450){var bw=2+Math.round(rr()*4);bars+='<rect x="'+bx+'" y="388" width="'+bw+'" height="30" fill="'+C.ink+'"/>';bx+=bw+2+Math.round(rr()*3)}
    var art='<g transform="rotate(-3 360 240)"><path d="'+d+'" fill="'+C.paper+'"/>'+
      rule(116)+
      '<path d="M176 258 C290 244 440 262 566 250 L562 318 C440 328 300 310 180 322 Z" fill="'+C.yellow+'"/>'+
      a.svg+b.svg+rule(352)+micro(CREDIT,360,376,C.ink,{size:11,ls:2.4})+bars+'</g>'+
      tape(360,42,150,36,-5,C.mint)+tape(566,420,96,30,-38,C.yellow);
    var L=logo(212,84,56,-10);
    return {sil:['<path d="'+d+'" transform="rotate(-3 360 240)"/>',L.sil],art:art+L.art};
  }
  /* 07: an award rosette with ribbon tails and a banner across it. */
  function artRosette(i,u){
    var cx=360,cy=196,R=168,n=28,k,d="";
    for(k=0;k<n;k++){var a=-Math.PI/2+k*2*Math.PI/n,b=a+2*Math.PI/n,x=cx+Math.cos(b)*R,y=cy+Math.sin(b)*R;
      if(k===0)d="M"+f1(cx+Math.cos(a)*R)+" "+f1(cy+Math.sin(a)*R);
      d+=" A20 20 0 0 1 "+f1(x)+" "+f1(y)}
    d+=" Z";
    var tl="M300 330 L246 452 L276 436 L292 466 L346 342 Z",tr="M420 330 L474 452 L444 436 L428 466 L374 342 Z";
    var band="M96 228 C250 210 470 210 624 228 L624 330 C470 312 250 312 96 330 Z";
    var el="M96 250 L44 262 L70 294 L44 330 L110 336 Z",er="M624 250 L676 262 L650 294 L676 330 L610 336 Z";
    var arc="rs"+u,ra=126;
    var a=line({x:360,y:210,size:92,parts:[["PITCH",C.paper]]});
    var b=line({x:360,y:308,size:fit("ACCEPTED.",470,96),skew:true,parts:[["ACCEPTED.",C.paper]]});
    var art='<defs><path id="'+arc+'" d="M'+(cx-ra)+' '+cy+' A'+ra+' '+ra+' 0 0 1 '+(cx+ra)+' '+cy+'"/></defs>'+
      '<path d="'+tl+'" fill="'+C.yellow+'"/><path d="'+tr+'" fill="'+C.yellow+'"/>'+
      '<path d="'+d+'" fill="'+C.blue+'"/><circle cx="'+cx+'" cy="'+cy+'" r="148" fill="none" stroke="'+C.paper+'" stroke-width="2.5" stroke-dasharray="1 8" stroke-linecap="round"/>'+
      '<path d="'+el+'" fill="'+C.red+'"/><path d="'+er+'" fill="'+C.red+'"/><path d="M96 330 L110 336 L110 318 Z M624 330 L610 336 L610 318 Z" fill="'+C.ink+'" opacity=".45"/>'+
      '<path d="'+band+'" fill="'+C.red+'"/>'+
      '<text font-family="'+GF+'" font-size="11.5" font-weight="700" letter-spacing="2.6" fill="'+C.paper+'"><textPath href="#'+arc+'" xlink:href="#'+arc+'" startOffset="50%" text-anchor="middle">'+escapeXML(CREDIT)+'</textPath></text>'+
      a.svg+b.svg+sparkle(256,176,12,C.yellow)+sparkle(464,176,12,C.yellow);
    var L=logo(522,70,60,10);
    return {sil:['<path d="'+tl+'"/>','<path d="'+tr+'"/>','<path d="'+d+'"/>','<path d="'+el+'"/>','<path d="'+er+'"/>','<path d="'+band+'"/>',L.sil],art:art+L.art};
  }
  /* 08: a two-colour capsule, split down the middle like an undecided vote. */
  function artCapsule(i,u){
    var y0=96,y1=384,r=(y1-y0)/2,x0=44,x1=676,d="M"+(x0+r)+" "+y0+" H"+(x1-r)+" A"+r+" "+r+" 0 0 1 "+(x1-r)+" "+y1+" H"+(x0+r)+" A"+r+" "+r+" 0 0 1 "+(x0+r)+" "+y0+" Z";
    var cp="cs"+u;
    var a=line({x:360,y:226,size:116,parts:[["THE JURY",C.paper]]});
    var b=line({x:360,y:330,size:fit("IS STILL OUT.",480,100),skew:true,parts:[["IS STILL ",C.paper],["OUT.",C.yellow]]});
    var art='<defs><clipPath id="'+cp+'"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+C.blue+'"/>'+
      '<path d="M326 0 L329 234 L432 238 L404 480 L720 480 L720 0 Z" fill="'+C.red+'" clip-path="url(#'+cp+')"/>'+
      a.svg+b.svg+micro(CREDIT,360,364,C.paper,{size:11,ls:2.6,op:.85});
    var L=logo(96,128,62,-10);
    return {sil:['<path d="'+d+'"/>',L.sil],art:art+L.art};
  }
  /* 09: a postage stamp with a perforated edge and a postmark. */
  function artStamp(i,u){
    var x0=96,x1=624,y0=52,y1=428,b=9,k,d;
    var nx=20,ny=14,sx=(x1-x0)/nx,sy=(y1-y0)/ny;
    d="M"+x0+" "+y0;
    for(k=0;k<nx;k++){var xa=x0+sx*k+sx/2-b;d+=" H"+f1(xa)+" A"+b+" "+b+" 0 0 0 "+f1(xa+2*b)+" "+y0}
    d+=" H"+x1;
    for(k=0;k<ny;k++){var ya=y0+sy*k+sy/2-b;d+=" V"+f1(ya)+" A"+b+" "+b+" 0 0 0 "+x1+" "+f1(ya+2*b)}
    d+=" V"+y1;
    for(k=nx-1;k>=0;k--){var xb=x0+sx*k+sx/2+b;d+=" H"+f1(xb)+" A"+b+" "+b+" 0 0 0 "+f1(xb-2*b)+" "+y1}
    d+=" H"+x0;
    for(k=ny-1;k>=0;k--){var yb=y0+sy*k+sy/2+b;d+=" V"+f1(yb)+" A"+b+" "+b+" 0 0 0 "+x0+" "+f1(yb-2*b)}
    d+=" Z";
    var a=line({x:146,y:250,size:104,anchor:"start",parts:[["I REST",C.paper]]});
    var bb=line({x:142,y:362,size:fit("MY CASE.",430,124),anchor:"start",skew:true,parts:[["MY CASE.",C.ink]]});
    var art='<path d="'+d+'" fill="'+C.paper+'"/><rect x="'+(x0+26)+'" y="'+(y0+26)+'" width="'+(x1-x0-52)+'" height="'+(y1-y0-52)+'" fill="'+C.red+'"/>'+
      
      a.svg+bb.svg+
      '<g fill="none" stroke="'+C.ink+'" stroke-width="3.5" opacity=".75"><circle cx="510" cy="150" r="56"/><circle cx="510" cy="150" r="46"/>'+
      '<path d="M570 128 q12 -9 24 0 t24 0 M570 150 q12 -9 24 0 t24 0 M570 172 q12 -9 24 0 t24 0"/></g>'+
      '<g opacity=".75">'+sparkle(510,150,20,C.ink)+'</g>'+
      micro(CREDIT,146,392,C.paper,{size:11,anchor:"start",ls:2.6,op:.9});
    var L=logo(606,412,60,8);
    return {sil:['<path d="'+d+'"/>',L.sil],art:art+L.art};
  }
  /* 10: an arched sign, the signature line of the night. */
  function artArch(i,u){
    var cx=360,cy=270,R=246,y1=446,d="M"+(cx-R)+" "+y1+" V"+cy+" A"+R+" "+R+" 0 0 1 "+(cx+R)+" "+cy+" V"+y1+" Z";
    var r2=R-18,d2="M"+(cx-r2)+" "+(y1-18)+" V"+cy+" A"+r2+" "+r2+" 0 0 1 "+(cx+r2)+" "+cy+" V"+(y1-18)+" Z";
    var arc="ar"+u,ra=R-44;
    var a=line({x:360,y:290,size:fit("MAKE",330,160),parts:[["MAKE",C.ink]]});
    var b=line({x:360,y:398,size:fit("YOUR CASE.",400,106),skew:true,parts:[["YOUR CASE.",C.blue]]});
    var L=logo(cx-R+14,y1-30,64,-9);
    var art='<defs><path id="'+arc+'" d="M'+(cx-ra)+' '+cy+' A'+ra+' '+ra+' 0 0 1 '+(cx+ra)+' '+cy+'"/></defs>'+
      '<path d="'+d+'" fill="'+C.yellow+'"/><path d="'+d2+'" fill="none" stroke="'+C.ink+'" stroke-width="3"/>'+
      '<text font-family="'+GF+'" font-size="13" font-weight="700" letter-spacing="3.4" fill="'+C.ink+'"><textPath href="#'+arc+'" xlink:href="#'+arc+'" startOffset="50%" text-anchor="middle">'+escapeXML(CREDIT)+'</textPath></text>'+
      sparkle(300,94,10,C.red)+sparkle(420,94,10,C.red)+
      a.svg+underline(176,544,414,C.red,9)+b.svg+L.art;
    return {sil:['<path d="'+d+'"/>',L.sil],art:art};
  }
  function renderArt(p,index,exported){
    var u=++uid,a=p.art(index,u),sil=a.sil.join("");
    var svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 720 480" width="720" height="480" role="img" aria-label="'+escapeXML(p.label)+' photo prop">';
    svg+='<title>'+escapeXML(p.label)+' | Off Script Pitch Night</title>';
    svg+='<defs>'+(exported&&fontCSS?'<style>'+fontCSS+'</style>':'')+'<filter id="sh'+u+'" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="7"/></filter></defs>';
    /* Shadow, cutting line, white die-cut border, then the art itself. */
    svg+='<g transform="translate(5 11)" fill="#171717" stroke="#171717" stroke-width="26" stroke-linejoin="round" opacity=".24" filter="url(#sh'+u+')">'+sil+'</g>';
    svg+='<g fill="none" stroke="#171717" stroke-opacity=".16" stroke-width="29" stroke-linejoin="round">'+sil+'</g>';
    svg+='<g fill="#ffffff" stroke="#ffffff" stroke-width="26" stroke-linejoin="round">'+sil+'</g>';
    svg+=a.art+'</svg>';
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
