(() => {
const $=id=>document.getElementById(id);
const canvas=$('morphCanvas');
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
const texture=document.createElement('canvas');
const tctx=texture.getContext('2d',{alpha:true});
const MOBILE=matchMedia('(max-width:700px)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const SIZE=MOBILE?320:480;
const GRID=MOBILE?8:10;
canvas.width=canvas.height=SIZE;
texture.width=texture.height=SIZE;
canvas.style.willChange='transform';
canvas.style.transformOrigin='50% 50%';
canvas.style.backfaceVisibility='hidden';

let mesh=[],gesture=null,currentTool='warp',ready=false,enabled=false;
let raf=0,dirty=false;

const hints={
  warp:'Warp: touch one exact spot and drag it.',
  rotate:'Rotate all: drag left or right anywhere. The whole object turns.',
  stretch:'Stretch: touch one exact spot and pull it.',
  fisheye:'Fisheye: touch one tiny area and drag to bulge or pinch it.'
};

const regularMesh=()=>{
  const out=[];
  for(let y=0;y<=GRID;y++)for(let x=0;x<=GRID;x++)out.push({x:x*SIZE/GRID,y:y*SIZE/GRID});
  return out;
};
const cloneMesh=()=>mesh.map(p=>({x:p.x,y:p.y}));
const meshPoint=(x,y)=>mesh[y*(GRID+1)+x];
const sourcePoint=(x,y)=>({x:x*SIZE/GRID,y:y*SIZE/GRID});
const clampPoint=p=>{
  p.x=Math.max(-SIZE*.2,Math.min(SIZE*1.2,p.x));
  p.y=Math.max(-SIZE*.2,Math.min(SIZE*1.2,p.y));
};

function drawTriangle(s0,s1,s2,d0,d1,d2){
  const den=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);
  if(Math.abs(den)<.0001)return;
  const a=(d0.x*(s1.y-s2.y)+d1.x*(s2.y-s0.y)+d2.x*(s0.y-s1.y))/den;
  const c=(d0.x*(s2.x-s1.x)+d1.x*(s0.x-s2.x)+d2.x*(s1.x-s0.x))/den;
  const e=(d0.x*(s1.x*s2.y-s2.x*s1.y)+d1.x*(s2.x*s0.y-s0.x*s2.y)+d2.x*(s0.x*s1.y-s1.x*s0.y))/den;
  const b=(d0.y*(s1.y-s2.y)+d1.y*(s2.y-s0.y)+d2.y*(s0.y-s1.y))/den;
  const d=(d0.y*(s2.x-s1.x)+d1.y*(s0.x-s2.x)+d2.y*(s1.x-s0.x))/den;
  const f=(d0.y*(s1.x*s2.y-s2.x*s1.y)+d1.y*(s2.x*s0.y-s0.x*s2.y)+d2.y*(s0.x*s1.y-s1.x*s0.y))/den;
  ctx.save();
  ctx.beginPath();ctx.moveTo(d0.x,d0.y);ctx.lineTo(d1.x,d1.y);ctx.lineTo(d2.x,d2.y);ctx.closePath();ctx.clip();
  ctx.setTransform(a,b,c,d,e,f);ctx.drawImage(texture,0,0);ctx.restore();
}

function render(){
  raf=0;if(!dirty)return;dirty=false;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,SIZE,SIZE);ctx.imageSmoothingEnabled=true;
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
    const s00=sourcePoint(x,y),s10=sourcePoint(x+1,y),s01=sourcePoint(x,y+1),s11=sourcePoint(x+1,y+1);
    const d00=meshPoint(x,y),d10=meshPoint(x+1,y),d01=meshPoint(x,y+1),d11=meshPoint(x+1,y+1);
    drawTriangle(s00,s10,s11,d00,d10,d11);
    drawTriangle(s00,s11,s01,d00,d11,d01);
  }
}
function requestRender(){dirty=true;if(!raf)raf=requestAnimationFrame(render)}
function forceRender(){dirty=true;render()}

function loadImage(src){
  return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
}
async function setEmoji(emoji){
  ready=false;gesture=null;canvas.style.transform='translateZ(0) rotate(0rad)';
  tctx.setTransform(1,0,0,1,0,0);tctx.clearRect(0,0,SIZE,SIZE);
  try{
    const im=await loadImage(window.Object2Level.twemojiUrl(emoji));
    const max=SIZE*.76,scale=Math.min(max/im.width,max/im.height),w=im.width*scale,h=im.height*scale;
    tctx.drawImage(im,(SIZE-w)/2,(SIZE-h)/2,w,h);
  }catch{
    tctx.textAlign='center';tctx.textBaseline='middle';
    tctx.font=`${Math.round(SIZE*.65)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    tctx.fillText(emoji,SIZE/2,SIZE/2+4);
  }
  mesh=regularMesh();forceRender();ready=true;
}

function point(e){
  const r=canvas.parentElement.getBoundingClientRect();
  return {x:(e.clientX-r.left)*SIZE/r.width,y:(e.clientY-r.top)*SIZE/r.height};
}
function nearestIndex(p){
  let best=Infinity,index=0;
  for(let i=0;i<mesh.length;i++){
    const dx=mesh[i].x-p.x,dy=mesh[i].y-p.y,d=dx*dx+dy*dy;
    if(d<best){best=d;index=i}
  }
  return index;
}
function tinyTargets(anchor){
  const stride=GRID+1,row=Math.floor(anchor/stride),col=anchor%stride;
  const out=[{i:anchor,w:1}];
  if(col>0)out.push({i:anchor-1,w:.12});
  if(col<GRID)out.push({i:anchor+1,w:.12});
  if(row>0)out.push({i:anchor-stride,w:.12});
  if(row<GRID)out.push({i:anchor+stride,w:.12});
  return out;
}
function bakeRotation(angle){
  if(Math.abs(angle)<.0001){canvas.style.transform='translateZ(0) rotate(0rad)';return}
  const cx=SIZE/2,cy=SIZE/2,co=Math.cos(angle),si=Math.sin(angle);
  for(const pt of mesh){
    const x=pt.x-cx,y=pt.y-cy;
    pt.x=cx+x*co-y*si;pt.y=cy+x*si+y*co;clampPoint(pt);
  }
  canvas.style.transform='translateZ(0) rotate(0rad)';
  forceRender();
}

function applyLocal(e){
  if(!gesture)return;
  const p=point(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
  if(currentTool==='warp'){
    const pt=mesh[gesture.anchor];
    pt.x=gesture.base[gesture.anchor].x+dx;
    pt.y=gesture.base[gesture.anchor].y+dy;
    clampPoint(pt);
    requestRender();return;
  }
  if(currentTool==='stretch'){
    const pt=mesh[gesture.anchor],base=gesture.base[gesture.anchor];
    pt.x=base.x+dx*1.35;pt.y=base.y+dy*1.35;clampPoint(pt);
    requestRender();return;
  }
  if(currentTool==='fisheye'){
    const amount=Math.max(-.8,Math.min(.8,(dx-dy)/(SIZE*.18)));
    const cx=gesture.start.x,cy=gesture.start.y;
    for(const t of gesture.targets){
      const base=gesture.base[t.i],rx=base.x-cx,ry=base.y-cy;
      const scale=Math.max(.35,1+amount*t.w);
      const pt=mesh[t.i];pt.x=cx+rx*scale;pt.y=cy+ry*scale;clampPoint(pt);
    }
    requestRender();
  }
}

canvas.addEventListener('pointerdown',e=>{
  if(!ready||!enabled)return;
  e.preventDefault();canvas.setPointerCapture(e.pointerId);
  const p=point(e),anchor=nearestIndex(p);
  gesture={start:p,base:cloneMesh(),anchor,targets:tinyTargets(anchor),angle:0};
},{passive:false});
canvas.addEventListener('pointermove',e=>{
  if(!gesture)return;e.preventDefault();
  if(currentTool==='rotate'){
    const p=point(e);
    gesture.angle=(p.x-gesture.start.x)*Math.PI/(SIZE*.72);
    canvas.style.transform=`translateZ(0) rotate(${gesture.angle}rad)`;
    return;
  }
  applyLocal(e);
},{passive:false});
canvas.addEventListener('pointerup',e=>{
  if(!gesture)return;e.preventDefault();
  if(currentTool==='rotate')bakeRotation(gesture.angle||0);
  else applyLocal(e);
  gesture=null;
},{passive:false});
canvas.addEventListener('pointercancel',()=>{
  if(gesture&&currentTool==='rotate')canvas.style.transform='translateZ(0) rotate(0rad)';
  gesture=null;
});

document.querySelectorAll('.toolButton').forEach(btn=>btn.onclick=()=>{
  currentTool=btn.dataset.tool;
  document.querySelectorAll('.toolButton').forEach(b=>b.classList.toggle('active',b===btn));
  const hint=$('toolHint');if(hint)hint.textContent=hints[currentTool];
});

window.Object2Editor={
  async setEmoji(emoji){await setEmoji(emoji)},
  setEnabled(value){enabled=!!value},
  isReady(){return ready},
  export(){
    forceRender();
    const out=document.createElement('canvas');out.width=out.height=320;
    const o=out.getContext('2d');o.fillStyle='#edf2ec';o.fillRect(0,0,320,320);o.drawImage(canvas,0,0,320,320);
    let data=out.toDataURL('image/webp',.68);
    if(!data.startsWith('data:image/webp'))data=out.toDataURL('image/jpeg',.75);
    return data;
  }
};
})();