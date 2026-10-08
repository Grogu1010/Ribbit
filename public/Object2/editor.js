(() => {
const $=id=>document.getElementById(id);
const canvas=$('morphCanvas'),ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
const texture=document.createElement('canvas'),tctx=texture.getContext('2d',{alpha:true});
const meshCanvas=document.createElement('canvas'),mctx=meshCanvas.getContext('2d',{alpha:true,desynchronized:true});
const MOBILE=matchMedia('(max-width:700px)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const SIZE=MOBILE?420:560,GRID=MOBILE?9:12;
canvas.width=canvas.height=SIZE;texture.width=texture.height=SIZE;meshCanvas.width=meshCanvas.height=SIZE;
let mesh=[],gesture=null,currentTool='warp',ready=false,enabled=false,rotation=0;
let raf=0,dirty=true;

$('undoButton')?.remove();
$('resetButton')?.remove();
document.querySelector('.historyActions')?.remove();
$('brushRing')?.remove();
const brushRow=document.querySelector('.brushRow');
if(brushRow)brushRow.innerHTML='<em id="toolHint">Warp: grab one exact part and drag it where you want it.</em>';

const hints={
  warp:'Warp: grab one exact part and drag it where you want it.',
  rotate:'Rotate: drag left or right anywhere — the whole object turns.',
  stretch:'Stretch: grab one exact part and pull it longer or squash it.',
  fisheye:'Fisheye: grab one exact part and drag to bulge or pinch it.'
};
const regularMesh=()=>{const a=[];for(let y=0;y<=GRID;y++)for(let x=0;x<=GRID;x++)a.push({x:x*SIZE/GRID,y:y*SIZE/GRID});return a};
const cloneMesh=(source=mesh)=>source.map(p=>({x:p.x,y:p.y}));
const meshPoint=(x,y)=>mesh[y*(GRID+1)+x];
const sourcePoint=(x,y)=>({x:x*SIZE/GRID,y:y*SIZE/GRID});
const clampPoint=p=>{p.x=Math.max(-90,Math.min(SIZE+90,p.x));p.y=Math.max(-90,Math.min(SIZE+90,p.y))};

function drawTriangle(target,s0,s1,s2,d0,d1,d2){
  const den=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);if(Math.abs(den)<.0001)return;
  const a=(d0.x*(s1.y-s2.y)+d1.x*(s2.y-s0.y)+d2.x*(s0.y-s1.y))/den;
  const c=(d0.x*(s2.x-s1.x)+d1.x*(s0.x-s2.x)+d2.x*(s1.x-s0.x))/den;
  const e=(d0.x*(s1.x*s2.y-s2.x*s1.y)+d1.x*(s2.x*s0.y-s0.x*s2.y)+d2.x*(s0.x*s1.y-s1.x*s0.y))/den;
  const b=(d0.y*(s1.y-s2.y)+d1.y*(s2.y-s0.y)+d2.y*(s0.y-s1.y))/den;
  const d=(d0.y*(s2.x-s1.x)+d1.y*(s0.x-s2.x)+d2.y*(s1.x-s0.x))/den;
  const f=(d0.y*(s1.x*s2.y-s2.x*s1.y)+d1.y*(s2.x*s0.y-s0.x*s2.y)+d2.y*(s0.x*s1.y-s1.x*s0.y))/den;
  target.save();target.beginPath();target.moveTo(d0.x,d0.y);target.lineTo(d1.x,d1.y);target.lineTo(d2.x,d2.y);target.closePath();target.clip();
  target.setTransform(a,b,c,d,e,f);target.drawImage(texture,0,0);target.restore();
}
function renderNow(){
  raf=0;if(!dirty)return;dirty=false;
  mctx.setTransform(1,0,0,1,0,0);mctx.clearRect(0,0,SIZE,SIZE);mctx.imageSmoothingEnabled=true;
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
    const s00=sourcePoint(x,y),s10=sourcePoint(x+1,y),s01=sourcePoint(x,y+1),s11=sourcePoint(x+1,y+1);
    const d00=meshPoint(x,y),d10=meshPoint(x+1,y),d01=meshPoint(x,y+1),d11=meshPoint(x+1,y+1);
    drawTriangle(mctx,s00,s10,s11,d00,d10,d11);drawTriangle(mctx,s00,s11,s01,d00,d11,d01);
  }
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,SIZE,SIZE);ctx.imageSmoothingEnabled=true;
  ctx.save();ctx.translate(SIZE/2,SIZE/2);ctx.rotate(rotation);ctx.drawImage(meshCanvas,-SIZE/2,-SIZE/2);ctx.restore();
}
function requestRender(){dirty=true;if(!raf)raf=requestAnimationFrame(renderNow)}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
async function setEmoji(emoji){
  ready=false;gesture=null;rotation=0;tctx.setTransform(1,0,0,1,0,0);tctx.clearRect(0,0,SIZE,SIZE);
  try{
    const im=await loadImage(window.Object2Level.twemojiUrl(emoji)),max=SIZE*.78,scale=Math.min(max/im.width,max/im.height),w=im.width*scale,h=im.height*scale;
    tctx.drawImage(im,(SIZE-w)/2,(SIZE-h)/2,w,h);
  }catch{
    tctx.textAlign='center';tctx.textBaseline='middle';tctx.font=`${Math.round(SIZE*.67)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;tctx.fillText(emoji,SIZE/2,SIZE/2+6);
  }
  mesh=regularMesh();requestRender();ready=true;
}
function screenPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*SIZE/r.width,y:(e.clientY-r.top)*SIZE/r.height}}
function modelPoint(e){
  const p=screenPoint(e),cx=SIZE/2,cy=SIZE/2,dx=p.x-cx,dy=p.y-cy,co=Math.cos(-rotation),si=Math.sin(-rotation);
  return {x:cx+dx*co-dy*si,y:cy+dx*si+dy*co};
}
function preciseTargets(p){
  let best=Infinity,anchor=0;
  for(let i=0;i<mesh.length;i++){
    const dx=mesh[i].x-p.x,dy=mesh[i].y-p.y,d=dx*dx+dy*dy;
    if(d<best){best=d;anchor=i}
  }
  const stride=GRID+1,row=Math.floor(anchor/stride),col=anchor%stride;
  const targets=[{i:anchor,w:1}];
  if(col>0)targets.push({i:anchor-1,w:.16});
  if(col<GRID)targets.push({i:anchor+1,w:.16});
  if(row>0)targets.push({i:anchor-stride,w:.16});
  if(row<GRID)targets.push({i:anchor+stride,w:.16});
  return targets;
}
function apply(e){
  if(!gesture)return;
  if(currentTool==='rotate'){
    const p=screenPoint(e),dx=p.x-gesture.startScreen.x;
    rotation=gesture.baseRotation+dx*Math.PI/SIZE;
    requestRender();return;
  }
  const p=modelPoint(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
  if(currentTool==='warp'){
    const stepX=p.x-gesture.last.x,stepY=p.y-gesture.last.y;
    if(Math.abs(stepX)+Math.abs(stepY)<.3)return;
    for(const t of gesture.targets){
      const pt=mesh[t.i];pt.x+=stepX*t.w;pt.y+=stepY*t.w;clampPoint(pt);
    }
    gesture.last=p;requestRender();return;
  }
  mesh=cloneMesh(gesture.base);
  if(currentTool==='stretch'){
    const mag=Math.hypot(dx,dy);if(mag>1){
      const ux=dx/mag,uy=dy/mag,amount=Math.min(SIZE*.42,mag)*1.12;
      for(const t of gesture.targets){
        const base=gesture.base[t.i],rx=base.x-gesture.start.x,ry=base.y-gesture.start.y;
        const along=rx*ux+ry*uy,perp=-rx*uy+ry*ux;
        const stretched=along*(1+Math.min(1.7,mag/(SIZE*.13))*t.w)+amount*t.w;
        const pt=mesh[t.i];pt.x=gesture.start.x+ux*stretched-uy*perp;pt.y=gesture.start.y+uy*stretched+ux*perp;clampPoint(pt);
      }
    }
  }else if(currentTool==='fisheye'){
    const amount=Math.max(-.78,Math.min(.95,(dx-dy)/(SIZE*.18)));
    for(const t of gesture.targets){
      const base=gesture.base[t.i],rx=base.x-gesture.start.x,ry=base.y-gesture.start.y;
      const scale=Math.max(.28,1+amount*t.w);
      const pt=mesh[t.i];pt.x=gesture.start.x+rx*scale;pt.y=gesture.start.y+ry*scale;clampPoint(pt);
    }
  }
  requestRender();
}
canvas.addEventListener('pointerdown',e=>{
  if(!ready||!enabled)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);
  const mp=modelPoint(e),sp=screenPoint(e);
  gesture={start:mp,last:mp,base:cloneMesh(),startScreen:sp,baseRotation:rotation,targets:preciseTargets(mp)};
},{passive:false});
canvas.addEventListener('pointermove',e=>{if(gesture){e.preventDefault();apply(e)}},{passive:false});
canvas.addEventListener('pointerup',e=>{if(gesture){apply(e);gesture=null;requestRender()}});
canvas.addEventListener('pointercancel',()=>{gesture=null});

document.querySelectorAll('.toolButton').forEach(btn=>btn.onclick=()=>{
  currentTool=btn.dataset.tool;document.querySelectorAll('.toolButton').forEach(b=>b.classList.toggle('active',b===btn));
  const hint=$('toolHint');if(hint)hint.textContent=hints[currentTool];
});

window.Object2Editor={
  async setEmoji(emoji){await setEmoji(emoji)},
  setEnabled(value){enabled=!!value},
  isReady(){return ready},
  export(){
    renderNow();
    const out=document.createElement('canvas');out.width=out.height=360;const o=out.getContext('2d');
    o.fillStyle='#edf2ec';o.fillRect(0,0,360,360);o.drawImage(canvas,0,0,360,360);
    let data=out.toDataURL('image/webp',.72);if(!data.startsWith('data:image/webp'))data=out.toDataURL('image/jpeg',.78);return data;
  }
};
})();