(() => {
const $=id=>document.getElementById(id);
const canvas=$('morphCanvas'),ctx=canvas.getContext('2d');
const texture=document.createElement('canvas'),tctx=texture.getContext('2d');
const SIZE=canvas.width,GRID=16;texture.width=texture.height=SIZE;
let mesh=[],history=[],gesture=null,currentTool='warp',brushRadius=145,ready=false,enabled=false;

const hints={
  warp:'Warp: drag a specific part where you want it to go.',
  rotate:'Rotate: drag over a part to twist only that area.',
  stretch:'Stretch: drag a part outward to lengthen or squash it.',
  fisheye:'Fisheye: drag right/down to bulge; reverse to pinch.'
};
const regularMesh=()=>{const a=[];for(let y=0;y<=GRID;y++)for(let x=0;x<=GRID;x++)a.push({x:x*SIZE/GRID,y:y*SIZE/GRID});return a};
const cloneMesh=(source=mesh)=>source.map(p=>({x:p.x,y:p.y}));
const meshPoint=(x,y)=>mesh[y*(GRID+1)+x];
const sourcePoint=(x,y)=>({x:x*SIZE/GRID,y:y*SIZE/GRID});
const clampPoint=p=>{p.x=Math.max(-140,Math.min(SIZE+140,p.x));p.y=Math.max(-140,Math.min(SIZE+140,p.y))};

function drawTriangle(s0,s1,s2,d0,d1,d2){
  const den=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);if(Math.abs(den)<.0001)return;
  const a=(d0.x*(s1.y-s2.y)+d1.x*(s2.y-s0.y)+d2.x*(s0.y-s1.y))/den;
  const c=(d0.x*(s2.x-s1.x)+d1.x*(s0.x-s2.x)+d2.x*(s1.x-s0.x))/den;
  const e=(d0.x*(s1.x*s2.y-s2.x*s1.y)+d1.x*(s2.x*s0.y-s0.x*s2.y)+d2.x*(s0.x*s1.y-s1.x*s0.y))/den;
  const b=(d0.y*(s1.y-s2.y)+d1.y*(s2.y-s0.y)+d2.y*(s0.y-s1.y))/den;
  const d=(d0.y*(s2.x-s1.x)+d1.y*(s0.x-s2.x)+d2.y*(s1.x-s0.x))/den;
  const f=(d0.y*(s1.x*s2.y-s2.x*s1.y)+d1.y*(s2.x*s0.y-s0.x*s2.y)+d2.y*(s0.x*s1.y-s1.x*s0.y))/den;
  ctx.save();ctx.beginPath();ctx.moveTo(d0.x,d0.y);ctx.lineTo(d1.x,d1.y);ctx.lineTo(d2.x,d2.y);ctx.closePath();ctx.clip();
  ctx.setTransform(a,b,c,d,e,f);ctx.drawImage(texture,0,0);ctx.restore();
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,SIZE,SIZE);ctx.imageSmoothingEnabled=true;
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
    const s00=sourcePoint(x,y),s10=sourcePoint(x+1,y),s01=sourcePoint(x,y+1),s11=sourcePoint(x+1,y+1);
    const d00=meshPoint(x,y),d10=meshPoint(x+1,y),d01=meshPoint(x,y+1),d11=meshPoint(x+1,y+1);
    drawTriangle(s00,s10,s11,d00,d10,d11);drawTriangle(s00,s11,s01,d00,d11,d01);
  }
}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
async function setEmoji(emoji){
  ready=false;texture.width=texture.height=SIZE;tctx.clearRect(0,0,SIZE,SIZE);
  try{
    const im=await loadImage(window.Object2Level.twemojiUrl(emoji)),scale=Math.min(500/im.width,500/im.height),w=im.width*scale,h=im.height*scale;
    tctx.drawImage(im,(SIZE-w)/2,(SIZE-h)/2,w,h);
  }catch{
    tctx.textAlign='center';tctx.textBaseline='middle';tctx.font='430px "Apple Color Emoji","Segoe UI Emoji",sans-serif';tctx.fillText(emoji,SIZE/2,SIZE/2+8);
  }
  mesh=regularMesh();history=[];gesture=null;render();ready=true;
}
function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*SIZE/r.width,y:(e.clientY-r.top)*SIZE/r.height,rect:r}}
function showBrush(e){
  const p=point(e),ring=$('brushRing'),scale=p.rect.width/SIZE;
  ring.style.display='block';ring.style.left=(e.clientX-p.rect.left)+'px';ring.style.top=(e.clientY-p.rect.top)+'px';
  ring.style.width=ring.style.height=(brushRadius*2*scale)+'px';
}
function apply(p){
  if(!gesture)return;
  if(currentTool==='warp'){
    const dx=p.x-gesture.last.x,dy=p.y-gesture.last.y;
    for(const pt of mesh){const dist=Math.hypot(pt.x-p.x,pt.y-p.y);if(dist<brushRadius){const w=(1-dist/brushRadius)**2;pt.x+=dx*w*1.35;pt.y+=dy*w*1.35;clampPoint(pt)}}
    gesture.last=p;render();return;
  }
  mesh=cloneMesh(gesture.base);const cx=gesture.start.x,cy=gesture.start.y,dx=p.x-cx,dy=p.y-cy;
  if(currentTool==='rotate'){
    const angle=(dx+dy)*.009;
    mesh.forEach((pt,i)=>{const base=gesture.base[i],rx=base.x-cx,ry=base.y-cy,dist=Math.hypot(rx,ry);if(dist>=brushRadius)return;const w=(1-dist/brushRadius)**2,a=angle*w,co=Math.cos(a),si=Math.sin(a);pt.x=cx+rx*co-ry*si;pt.y=cy+rx*si+ry*co;clampPoint(pt)});
  }else if(currentTool==='stretch'){
    const mag=Math.hypot(dx,dy);if(mag>1){const ux=dx/mag,uy=dy/mag;
      mesh.forEach((pt,i)=>{const base=gesture.base[i],rx=base.x-cx,ry=base.y-cy,dist=Math.hypot(rx,ry);if(dist>=brushRadius)return;const w=(1-dist/brushRadius)**2,along=rx*ux+ry*uy,perp=-rx*uy+ry*ux,scale=1+Math.min(1.8,mag/brushRadius)*1.25*w,na=along*scale;pt.x=cx+ux*na-uy*perp+dx*.16*w;pt.y=cy+uy*na+ux*perp+dy*.16*w;clampPoint(pt)});
    }
  }else if(currentTool==='fisheye'){
    const strength=Math.max(-1.2,Math.min(1.2,(dx-dy)/brushRadius));
    mesh.forEach((pt,i)=>{const base=gesture.base[i],rx=base.x-cx,ry=base.y-cy,dist=Math.hypot(rx,ry);if(dist>=brushRadius)return;const w=(1-dist/brushRadius)**2,scale=Math.max(.2,1+strength*w*.95);pt.x=cx+rx*scale;pt.y=cy+ry*scale;clampPoint(pt)});
  }
  render();
}
canvas.addEventListener('pointerdown',e=>{
  if(!ready||!enabled)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e);
  history.push(cloneMesh());if(history.length>15)history.shift();gesture={start:p,last:p,base:cloneMesh()};showBrush(e);
});
canvas.addEventListener('pointermove',e=>{showBrush(e);if(gesture){e.preventDefault();apply(point(e))}});
canvas.addEventListener('pointerup',e=>{if(gesture){apply(point(e));gesture=null}});
canvas.addEventListener('pointercancel',()=>gesture=null);
canvas.addEventListener('pointerleave',()=>{if(!gesture)$('brushRing').style.display='none'});

document.querySelectorAll('.toolButton').forEach(btn=>btn.onclick=()=>{
  currentTool=btn.dataset.tool;document.querySelectorAll('.toolButton').forEach(b=>b.classList.toggle('active',b===btn));$('toolHint').textContent=hints[currentTool];
});
document.querySelectorAll('.brushButton').forEach(btn=>btn.onclick=()=>{
  brushRadius=+btn.dataset.radius;document.querySelectorAll('.brushButton').forEach(b=>b.classList.toggle('active',b===btn));
});
$('undoButton').onclick=()=>{if(history.length){mesh=history.pop();render()}};
$('resetButton').onclick=()=>{if(!ready)return;history.push(cloneMesh());mesh=regularMesh();render()};

window.Object2Editor={
  async setEmoji(emoji){await setEmoji(emoji)},
  setEnabled(value){enabled=!!value},
  isReady(){return ready},
  export(){
    const out=document.createElement('canvas');out.width=out.height=360;const o=out.getContext('2d');
    o.fillStyle='#edf2ec';o.fillRect(0,0,360,360);o.drawImage(canvas,0,0,360,360);
    let data=out.toDataURL('image/webp',.78);if(!data.startsWith('data:image/webp'))data=out.toDataURL('image/jpeg',.82);return data;
  }
};
})();
