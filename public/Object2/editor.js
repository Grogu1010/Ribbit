(() => {
const $=id=>document.getElementById(id);
const canvas=$('morphCanvas'),ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
const texture=document.createElement('canvas'),tctx=texture.getContext('2d',{alpha:true});
const meshCanvas=document.createElement('canvas'),mctx=meshCanvas.getContext('2d',{alpha:true,desynchronized:true});
const MOBILE=matchMedia('(max-width:700px)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const SIZE=MOBILE?420:560,GRID=MOBILE?9:12;
canvas.width=canvas.height=SIZE;texture.width=texture.height=SIZE;meshCanvas.width=meshCanvas.height=SIZE;
let mesh=[],gesture=null,currentTool='warp',brushRadius=MOBILE?96:125,ready=false,enabled=false,rotation=0;
let raf=0,dirty=true;

$('undoButton')?.remove();
$('resetButton')?.remove();

const hints={
  warp:'Warp: drag a specific part where you want it to go.',
  rotate:'Rotate: drag left or right anywhere — the whole object turns.',
  stretch:'Stretch: drag a specific part outward to lengthen or squash it.',
  fisheye:'Fisheye: drag a specific part to bulge it; reverse to pinch it.'
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
function screenPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*SIZE/r.width,y:(e.clientY-r.top)*SIZE/r.height,rect:r,cssX:e.clientX-r.left,cssY:e.clientY-r.top}}
function modelPoint(e){
  const p=screenPoint(e),cx=SIZE/2,cy=SIZE/2,dx=p.x-cx,dy=p.y-cy,co=Math.cos(-rotation),si=Math.sin(-rotation);
  return {...p,x:cx+dx*co-dy*si,y:cy+dx*si+dy*co};
}
function showBrush(e){
  const ring=$('brushRing');if(!ring)return;
  if(currentTool==='rotate'){ring.style.display='none';return}
  const p=screenPoint(e),scale=p.rect.width/SIZE;
  ring.style.display='block';ring.style.left=p.cssX+'px';ring.style.top=p.cssY+'px';ring.style.width=ring.style.height=(brushRadius*2*scale)+'px';
}
function apply(e){
  if(!gesture)return;
  if(currentTool==='rotate'){
    const p=screenPoint(e),dx=p.x-gesture.startScreen.x;
    rotation=gesture.baseRotation+dx*Math.PI/SIZE;
    requestRender();return;
  }
  const p=modelPoint(e);
  if(currentTool==='warp'){
    const dx=p.x-gesture.last.x,dy=p.y-gesture.last.y;if(Math.abs(dx)+Math.abs(dy)<.5)return;
    for(const pt of mesh){const dist=Math.hypot(pt.x-p.x,pt.y-p.y);if(dist<brushRadius){const w=(1-dist/brushRadius)**2;pt.x+=dx*w*1.25;pt.y+=dy*w*1.25;clampPoint(pt)}}
    gesture.last=p;requestRender();return;
  }
  mesh=cloneMesh(gesture.base);const cx=gesture.start.x,cy=gesture.start.y,dx=p.x-cx,dy=p.y-cy;
  if(currentTool==='stretch'){
    const mag=Math.hypot(dx,dy);if(mag>1){const ux=dx/mag,uy=dy/mag;
      mesh.forEach((pt,i)=>{const base=gesture.base[i],rx=base.x-cx,ry=base.y-cy,dist=Math.hypot(rx,ry);if(dist>=brushRadius)return;const w=(1-dist/brushRadius)**2,along=rx*ux+ry*uy,perp=-rx*uy+ry*ux,scale=1+Math.min(1.55,mag/brushRadius)*1.05*w,na=along*scale;pt.x=cx+ux*na-uy*perp+dx*.12*w;pt.y=cy+uy*na+ux*perp+dy*.12*w;clampPoint(pt)});
    }
  }else if(currentTool==='fisheye'){
    const strength=Math.max(-1.05,Math.min(1.05,(dx-dy)/brushRadius));
    mesh.forEach((pt,i)=>{const base=gesture.base[i],rx=base.x-cx,ry=base.y-cy,dist=Math.hypot(rx,ry);if(dist>=brushRadius)return;const w=(1-dist/brushRadius)**2,scale=Math.max(.25,1+strength*w*.85);pt.x=cx+rx*scale;pt.y=cy+ry*scale;clampPoint(pt)});
  }
  requestRender();
}
canvas.addEventListener('pointerdown',e=>{
  if(!ready||!enabled)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);
  const mp=modelPoint(e),sp=screenPoint(e);gesture={start:mp,last:mp,base:cloneMesh(),startScreen:sp,baseRotation:rotation};showBrush(e);
},{passive:false});
canvas.addEventListener('pointermove',e=>{showBrush(e);if(gesture){e.preventDefault();apply(e)}},{passive:false});
canvas.addEventListener('pointerup',e=>{if(gesture){apply(e);gesture=null;requestRender()}});
canvas.addEventListener('pointercancel',()=>{gesture=null});
canvas.addEventListener('pointerleave',()=>{if(!gesture&&$('brushRing'))$('brushRing').style.display='none'});

document.querySelectorAll('.toolButton').forEach(btn=>btn.onclick=()=>{
  currentTool=btn.dataset.tool;document.querySelectorAll('.toolButton').forEach(b=>b.classList.toggle('active',b===btn));
  $('toolHint').textContent=hints[currentTool];
  document.querySelectorAll('.brushButton').forEach(b=>b.disabled=currentTool==='rotate');
  if(currentTool==='rotate'&&$('brushRing'))$('brushRing').style.display='none';
});
document.querySelectorAll('.brushButton').forEach(btn=>btn.onclick=()=>{
  if(currentTool==='rotate')return;brushRadius=+btn.dataset.radius*(SIZE/640);document.querySelectorAll('.brushButton').forEach(b=>b.classList.toggle('active',b===btn));
});
// Scale the default brush to the lower-resolution mobile canvas.
brushRadius=145*(SIZE/640);

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