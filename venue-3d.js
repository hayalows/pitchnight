/* Off Script / optional 3D courtyard scene.
   Free Three.js module; no model downloads, seats service or reservations.
   Geometry and seating are illustrative, inspired by the provided AI reference. */
export async function createVenueScene({ canvas, seats, onPick }) {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#a7b6d5");
  scene.fog = new THREE.Fog("#a7b6d5", 32, 76);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
  const orbit = { a: .34, p: .65, d: 29, pov: false };
  const target = new THREE.Vector3(0, .85, -1.4);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const mat = (color, roughness = .85) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  const cream = mat("#e9dac5"), wallMat = mat("#e7d5bd"), wallTrim = mat("#b58e5a");
  const ink = mat("#272524"), black = mat("#131416"), orange = mat("#f4742c");
  const sand = mat("#c4ad8a"), aisleMat = mat("#d9c7a8"), green = mat("#39654a");
  const gold = new THREE.MeshStandardMaterial({ color:"#ffe7ad", emissive:"#ffbe5a", emissiveIntensity:.85 });
  const selectedGold = new THREE.Color("#ffd63b");
  const normalSeat = new THREE.Color("#343a3d");

  function box(w,h,d,x,y,z,material,rotateY=0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.rotation.y=rotateY;
    scene.add(mesh);
    return mesh;
  }
  function cylinder(radius, height, x,y,z,material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,8),material);
    mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  function line(points,color="#302b26",opacity=1) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    const material = new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});
    const mesh=new THREE.Line(geometry,material);scene.add(mesh);return mesh;
  }
  function plane(width,depth, material,x,y,z) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width,depth),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  scene.add(new THREE.HemisphereLight("#e8f0ff","#a17b51",2.3));
  const sunlight = new THREE.DirectionalLight("#ffe0ac",2.4);
  sunlight.position.set(-8,13,6);scene.add(sunlight);
  const warm = new THREE.PointLight("#ffc26c",16,25,2);
  warm.position.set(0,6,-9);scene.add(warm);
  plane(18.1,29,sand,0,-.11,-.8);
  plane(2.2,26,aisleMat,0,-.099,0);
  for (const side of [-1,1]) {
    box(.25,2.7,27,side*7.9,1.29,-.8,wallMat);
    box(.2,.16,27,side*7.65,2.63,-.8,wallTrim);
    for (const z of [-6.3,-1.6,3.1,7.8]) {
      box(.06,1.65,1,side*7.68,1.65,z,ink);
      box(.07,1.18,.84,side*7.62,1.65,z,mat("#9a411e"));
      box(.08,.78,.35,side*7.58,1.68,z,orange);
    }
  }
  // Pavilion and stage. Its position and proportions are artistic, not measured.
  box(15.8,4.45,.56,0,2.21,-13.65,cream);
  box(15.8,.3,.86,0,4.38,-13.65,wallTrim);
  const roofVerts = new Float32Array([-8.4,4.42,-13.3, 0,5.55,-13.3, 8.4,4.42,-13.3]);
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute("position",new THREE.BufferAttribute(roofVerts,3));
  roofGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(roofGeo,new THREE.MeshStandardMaterial({color:"#6d482f",side:THREE.DoubleSide})));
  box(10.6,.35,3,0,.18,-10.8,ink);
  box(10.6,.11,.12,0,.29,-9.33,orange);
  // Canvas artwork drawn for the 3D display, no embedded reference or AI assets.
  const poster = document.createElement("canvas");
  poster.width=1024;poster.height=600;
  const pc=poster.getContext("2d");
  pc.fillStyle="#111214";pc.fillRect(0,0,1024,600);
  pc.fillStyle="#f4742c";pc.fillRect(0,0,1024,14);
  pc.textAlign="center";
  pc.fillStyle="#faf4e7";pc.font="800 46px Arial";
  pc.fillText("OFF SCRIPT",512,122);
  pc.fillStyle="#f4742c";pc.font="900 130px Arial";
  pc.fillText("PITCH",512,310);
  pc.fillText("NIGHT",512,433);
  pc.fillStyle="#faf4e7";pc.font="800 30px Arial";
  pc.fillText("MAKE YOUR CASE  /  001",512,515);
  const texture=new THREE.CanvasTexture(poster);
  texture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(7.6,3.1),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  screen.position.set(0,2.6,-13.28);scene.add(screen);
  // Stage lounge furniture and PA.
  for(const x of [-2.35,2.35]) {
    box(1.25,.42,.93,x,.68,-10.9,orange);
    box(1.25,.95,.25,x,1.3,-11.34,orange);
    box(.2,.55,.86,x+(x<0?-.65:.65),.93,-10.85,orange);
  }
  cylinder(.44,.35,0,.55,-10.58,wallTrim);
  cylinder(.12,.32,0,.31,-10.58,black);
  for(const x of [-5.8,5.8]) {
    box(.9,1.7,.58,x,1.9,-9.6,black);
    cylinder(.065,1.2,x,.65,-9.6,black);
  }
  // Potted plants at the edges keep the visual reference's evening mood.
  function plant(x,z,size=1) {
    cylinder(.33*size,.6*size,x,.31*size,z,mat("#d2b58b"));
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.055*size,.08*size,1.7*size,7),mat("#7f6746"));
    trunk.position.set(x,1.3*size,z);scene.add(trunk);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(.28*size,1.7*size,5),green);
      blade.position.set(x+Math.cos(a)*.28*size,2.22*size,z+Math.sin(a)*.28*size);
      blade.rotation.z=Math.cos(a)*.55;blade.rotation.x=Math.sin(a)*.55;
      scene.add(blade);
    }
  }
  [[-6.9,-7.8,.8],[6.9,-7.8,.8],[-7,7,.98],[7,7,.98],[-6,3.1,.62],[6,3.1,.62]].forEach(v=>plant(...v));
  // Illustrated string lighting over the central courtyard.
  for(const z of [-7.5,-3.1,1.3,5.7,9.1]) {
    const pts=[];
    for(let i=0;i<=20;i++){
      const x=-7.7+i*(15.4/20), y=4.9-Math.sin((i/20)*Math.PI)*.67;
      pts.push([x,y,z]);
    }
    line(pts,"#4e3e2d");
    for(let i=0;i<9;i++) {
      const x=-7.2+i*1.8, y=4.9-Math.sin(((x+7.7)/15.4)*Math.PI)*.67-.12;
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.10,7,7),gold);
      bulb.position.set(x,y,z);scene.add(bulb);
    }
  }
  // Interactive example chairs, based on two banks and a central aisle.
  const chairMap=new Map(),hits=[];
  for(const seat of seats){
    const group=new THREE.Group();
    group.position.set(seat.x,0,seat.z);
    scene.add(group);
    const legs=mat("#242424");
    const bodyMat=mat("#35393b",.72);
    function part(w,h,d,x,y,z,material){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      mesh.position.set(x,y,z);
      mesh.userData.seatId=seat.id;
      group.add(mesh);
      hits.push(mesh);
      return mesh;
    }
    part(.77,.13,.65,0,.52,0,bodyMat);
    part(.78,.70,.11,0,.92,.35,bodyMat);
    for(const x of [-.29,.29])for(const z of [-.22,.22])part(.058,.51,.06,x,.24,z,legs);
    chairMap.set(seat.id,{bodyMat,group});
  }

  let selectedId=null;
  function setSelected(seat) {
    selectedId=seat?.id||null;
    for(const [id,chair] of chairMap) {
      const yes=id===selectedId;
      chair.bodyMat.color.copy(yes?selectedGold:normalSeat);
      chair.bodyMat.emissive.set(yes?"#dd8c20":"#000000");
      chair.bodyMat.emissiveIntensity = yes ? .23 : 0;
    }
    requestDraw();
  }
  let renderQueued=false;
  function requestDraw(){
    if(renderQueued)return;
    renderQueued=true;
    window.requestAnimationFrame(()=>{renderQueued=false;renderer.render(scene,camera)});
  }
  function applyCamera(){
    if(orbit.pov){requestDraw();return}
    const {a,p,d}=orbit;
    camera.fov=45;camera.updateProjectionMatrix();
    camera.position.set(target.x+Math.sin(a)*Math.cos(p)*d,target.y+Math.sin(p)*d,target.z+Math.cos(a)*Math.cos(p)*d);
    camera.lookAt(target);
    requestDraw();
  }
  function reset(){
    orbit.a=.34;orbit.p=.65;orbit.d=29;orbit.pov=false;
    applyCamera();
  }
  function viewFromSeat(seat) {
    if(!seat)return;
    orbit.pov=true;
    camera.fov=62;camera.updateProjectionMatrix();
    camera.position.set(seat.x,1.48,seat.z-.16);
    camera.lookAt(0,2.4,-12.2);
    requestDraw();
  }
  function rotate(delta) {
    if(orbit.pov)orbit.pov=false;
    orbit.a+=delta;applyCamera();
  }
  function zoom(ratio) {
    if(orbit.pov)orbit.pov=false;
    orbit.d=clamp(orbit.d*ratio,13,47);applyCamera();
  }
  const pointer=new Map();
  let pressedAt=null, previousPinch=0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function pick(event){
    const bounds=canvas.getBoundingClientRect();
    if(!bounds.width||!bounds.height)return;
    mouse.set(((event.clientX-bounds.left)/bounds.width)*2-1,-((event.clientY-bounds.top)/bounds.height)*2+1);
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(hits,false)[0];
    if(hit?.object?.userData?.seatId)onPick(hit.object.userData.seatId);
  }
  canvas.addEventListener("pointerdown",event=>{
    canvas.setPointerCapture?.(event.pointerId);
    pointer.set(event.pointerId,{x:event.clientX,y:event.clientY});
    pressedAt={x:event.clientX,y:event.clientY,id:event.pointerId,dragged:false};
  });
  canvas.addEventListener("pointermove",event=>{
    if(!pointer.has(event.pointerId))return;
    const prev=pointer.get(event.pointerId);
    const dx=event.clientX-prev.x,dy=event.clientY-prev.y;
    pointer.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pressedAt&&Math.abs(event.clientX-pressedAt.x)+Math.abs(event.clientY-pressedAt.y)>7)pressedAt.dragged=true;
    if(pointer.size===2){
      const points=[...pointer.values()];
      const dist=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
      if(previousPinch>0&&dist>0)zoom(clamp(previousPinch/dist,.88,1.12));
      previousPinch=dist;return;
    }
    previousPinch=0;
    if(orbit.pov)reset();
    const rect=canvas.getBoundingClientRect();
    orbit.a-=dx/Math.max(250,rect.width)*3.0;
    orbit.p=clamp(orbit.p+dy/Math.max(220,rect.height)*1.6,.25,1.25);
    applyCamera();
  });
  function finish(event){
    const was=pressedAt&&pressedAt.id===event.pointerId&&!pressedAt.dragged&&pointer.size===1;
    pointer.delete(event.pointerId);
    previousPinch=0;
    if(was)pick(event);
    pressedAt=null;
  }
  canvas.addEventListener("pointerup",finish);
  canvas.addEventListener("pointercancel",finish);
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();
    zoom(e.deltaY>0?1.09:.91);
  },{passive:false});
  canvas.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft"){e.preventDefault();rotate(-.12)}
    else if(e.key==="ArrowRight"){e.preventDefault();rotate(.12)}
    else if(e.key==="ArrowUp"){e.preventDefault();zoom(.90)}
    else if(e.key==="ArrowDown"){e.preventDefault();zoom(1.10)}
    else if(e.key==="Home"){e.preventDefault();reset()}
  });
  function resize(){
    const rect=canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
    requestDraw();
  }
  reset();
  const ro=new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  return {setSelected,viewFromSeat,reset,rotate,zoom,resize};
}