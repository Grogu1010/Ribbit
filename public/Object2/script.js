const LEVELS=[{"source":"Water bottle","sourceEmoji":"🧴","target":"Dog","targetEmoji":"🐶","rotate":-18,"warp":28,"stretch":132,"fisheye":44,"photo":"assets/water-bottle.webp"},{"source":"Chair","sourceEmoji":"🪑","target":"Ball","targetEmoji":"⚽","rotate":24,"warp":-34,"stretch":74,"fisheye":68,"photo":"assets/chair.webp"},{"source":"Umbrella","sourceEmoji":"☂️","target":"Mushroom","targetEmoji":"🍄","rotate":14,"warp":7,"stretch":108,"fisheye":19,"photo":null},{"source":"Light bulb","sourceEmoji":"💡","target":"Pear","targetEmoji":"🍐","rotate":61,"warp":38,"stretch":127,"fisheye":-55,"photo":null},{"source":"Key","sourceEmoji":"🔑","target":"Guitar","targetEmoji":"🎸","rotate":-53,"warp":-42,"stretch":85,"fisheye":-18,"photo":null},{"source":"Banana","sourceEmoji":"🍌","target":"Moon","targetEmoji":"🌙","rotate":-6,"warp":-11,"stretch":104,"fisheye":19,"photo":null},{"source":"Donut","sourceEmoji":"🍩","target":"Life buoy","targetEmoji":"🛟","rotate":41,"warp":20,"stretch":123,"fisheye":-55,"photo":null},{"source":"Pencil","sourceEmoji":"✏️","target":"Rocket","targetEmoji":"🚀","rotate":-73,"warp":51,"stretch":81,"fisheye":-18,"photo":null},{"source":"Mug","sourceEmoji":"☕","target":"Bucket","targetEmoji":"🪣","rotate":-26,"warp":-29,"stretch":100,"fisheye":19,"photo":null},{"source":"Camera","sourceEmoji":"📷","target":"Robot","targetEmoji":"🤖","rotate":21,"warp":2,"stretch":119,"fisheye":-55,"photo":null},{"source":"Alarm clock","sourceEmoji":"⏰","target":"Sunflower","targetEmoji":"🌻","rotate":68,"warp":33,"stretch":77,"fisheye":-18,"photo":null},{"source":"Pizza slice","sourceEmoji":"🍕","target":"Sailboat","targetEmoji":"⛵","rotate":-46,"warp":-47,"stretch":96,"fisheye":19,"photo":null},{"source":"Guitar","sourceEmoji":"🎸","target":"Fish","targetEmoji":"🐟","rotate":1,"warp":-16,"stretch":115,"fisheye":-55,"photo":null},{"source":"Sneaker","sourceEmoji":"👟","target":"Telephone","targetEmoji":"☎️","rotate":48,"warp":15,"stretch":73,"fisheye":-18,"photo":null},{"source":"Scissors","sourceEmoji":"✂️","target":"Bird","targetEmoji":"🐦","rotate":-66,"warp":46,"stretch":92,"fisheye":19,"photo":null},{"source":"Spoon","sourceEmoji":"🥄","target":"Leaf","targetEmoji":"🍃","rotate":-19,"warp":-34,"stretch":111,"fisheye":-55,"photo":null},{"source":"Fork","sourceEmoji":"🍴","target":"Cactus","targetEmoji":"🌵","rotate":28,"warp":-3,"stretch":130,"fisheye":-18,"photo":null},{"source":"Backpack","sourceEmoji":"🎒","target":"Owl","targetEmoji":"🦉","rotate":75,"warp":28,"stretch":88,"fisheye":19,"photo":null},{"source":"Book","sourceEmoji":"📕","target":"Sandwich","targetEmoji":"🥪","rotate":-39,"warp":-52,"stretch":107,"fisheye":-55,"photo":null},{"source":"Candle","sourceEmoji":"🕯️","target":"Rocket","targetEmoji":"🚀","rotate":8,"warp":-21,"stretch":126,"fisheye":-18,"photo":null},{"source":"Hammer","sourceEmoji":"🔨","target":"Flamingo","targetEmoji":"🦩","rotate":55,"warp":10,"stretch":84,"fisheye":19,"photo":null},{"source":"Headphones","sourceEmoji":"🎧","target":"Ram","targetEmoji":"🐏","rotate":-59,"warp":41,"stretch":103,"fisheye":-55,"photo":null},{"source":"Bell","sourceEmoji":"🔔","target":"Jellyfish","targetEmoji":"🪼","rotate":-12,"warp":-39,"stretch":122,"fisheye":-18,"photo":null},{"source":"Balloon","sourceEmoji":"🎈","target":"Apple","targetEmoji":"🍎","rotate":35,"warp":-8,"stretch":80,"fisheye":19,"photo":null},{"source":"Apple","sourceEmoji":"🍎","target":"Heart","targetEmoji":"❤️","rotate":-79,"warp":23,"stretch":99,"fisheye":-55,"photo":null},{"source":"Heart","sourceEmoji":"❤️","target":"Strawberry","targetEmoji":"🍓","rotate":-32,"warp":54,"stretch":118,"fisheye":-18,"photo":null},{"source":"Glasses","sourceEmoji":"👓","target":"Butterfly","targetEmoji":"🦋","rotate":15,"warp":-26,"stretch":76,"fisheye":19,"photo":null},{"source":"Binoculars","sourceEmoji":"🔭","target":"Giraffe","targetEmoji":"🦒","rotate":62,"warp":5,"stretch":95,"fisheye":-55,"photo":null},{"source":"Violin","sourceEmoji":"🎻","target":"Swan","targetEmoji":"🦢","rotate":-52,"warp":36,"stretch":114,"fisheye":-18,"photo":null},{"source":"Paintbrush","sourceEmoji":"🖌️","target":"Feather","targetEmoji":"🪶","rotate":-5,"warp":-44,"stretch":72,"fisheye":19,"photo":null},{"source":"Toothbrush","sourceEmoji":"🪥","target":"Snake","targetEmoji":"🐍","rotate":42,"warp":-13,"stretch":91,"fisheye":-55,"photo":null},{"source":"Safety pin","sourceEmoji":"🧷","target":"Paperclip","targetEmoji":"📎","rotate":-72,"warp":18,"stretch":110,"fisheye":-18,"photo":null},{"source":"Paperclip","sourceEmoji":"📎","target":"Snake","targetEmoji":"🐍","rotate":-25,"warp":49,"stretch":129,"fisheye":19,"photo":null},{"source":"Ruler","sourceEmoji":"📏","target":"Crocodile","targetEmoji":"🐊","rotate":22,"warp":-31,"stretch":87,"fisheye":-55,"photo":null},{"source":"Saw","sourceEmoji":"🪚","target":"Shark","targetEmoji":"🦈","rotate":69,"warp":0,"stretch":106,"fisheye":-18,"photo":null},{"source":"Axe","sourceEmoji":"🪓","target":"Whale","targetEmoji":"🐋","rotate":-45,"warp":31,"stretch":125,"fisheye":19,"photo":null},{"source":"Broom","sourceEmoji":"🧹","target":"Palm tree","targetEmoji":"🌴","rotate":2,"warp":-49,"stretch":83,"fisheye":-55,"photo":null},{"source":"Basket","sourceEmoji":"🧺","target":"Turtle","targetEmoji":"🐢","rotate":49,"warp":-18,"stretch":102,"fisheye":-18,"photo":null},{"source":"Package","sourceEmoji":"📦","target":"Dice","targetEmoji":"🎲","rotate":-65,"warp":13,"stretch":121,"fisheye":19,"photo":null},{"source":"Gift","sourceEmoji":"🎁","target":"Cake","targetEmoji":"🎂","rotate":-18,"warp":44,"stretch":79,"fisheye":-55,"photo":null},{"source":"Trophy","sourceEmoji":"🏆","target":"Tulip","targetEmoji":"🌷","rotate":29,"warp":-36,"stretch":98,"fisheye":-18,"photo":null},{"source":"Amphora","sourceEmoji":"🏺","target":"Penguin","targetEmoji":"🐧","rotate":76,"warp":-5,"stretch":117,"fisheye":19,"photo":null},{"source":"Teapot","sourceEmoji":"🫖","target":"Elephant","targetEmoji":"🐘","rotate":-38,"warp":26,"stretch":75,"fisheye":-55,"photo":null},{"source":"Microscope","sourceEmoji":"🔬","target":"Lobster","targetEmoji":"🦞","rotate":9,"warp":-54,"stretch":94,"fisheye":-18,"photo":null},{"source":"Telescope","sourceEmoji":"🔭","target":"Giraffe","targetEmoji":"🦒","rotate":56,"warp":-23,"stretch":113,"fisheye":19,"photo":null},{"source":"Syringe","sourceEmoji":"💉","target":"Mosquito","targetEmoji":"🦟","rotate":-58,"warp":8,"stretch":71,"fisheye":-55,"photo":null},{"source":"Thermometer","sourceEmoji":"🌡️","target":"Chilli","targetEmoji":"🌶️","rotate":-11,"warp":39,"stretch":90,"fisheye":-18,"photo":null},{"source":"Fire extinguisher","sourceEmoji":"🧯","target":"Lobster","targetEmoji":"🦞","rotate":36,"warp":-41,"stretch":109,"fisheye":19,"photo":null},{"source":"Wrench","sourceEmoji":"🔧","target":"Dolphin","targetEmoji":"🐬","rotate":-78,"warp":-10,"stretch":128,"fisheye":-55,"photo":null},{"source":"Screwdriver","sourceEmoji":"🪛","target":"Sword","targetEmoji":"🗡️","rotate":-31,"warp":21,"stretch":86,"fisheye":-18,"photo":null},{"source":"Gear","sourceEmoji":"⚙️","target":"Flower","targetEmoji":"🌼","rotate":16,"warp":52,"stretch":105,"fisheye":19,"photo":null},{"source":"Chain","sourceEmoji":"⛓️","target":"Snake","targetEmoji":"🐍","rotate":63,"warp":-28,"stretch":124,"fisheye":-55,"photo":null},{"source":"Anchor","sourceEmoji":"⚓","target":"Octopus","targetEmoji":"🐙","rotate":-51,"warp":3,"stretch":82,"fisheye":-18,"photo":null},{"source":"Lock","sourceEmoji":"🔒","target":"Snail","targetEmoji":"🐌","rotate":-4,"warp":34,"stretch":101,"fisheye":19,"photo":null},{"source":"Suitcase","sourceEmoji":"🧳","target":"Robot","targetEmoji":"🤖","rotate":43,"warp":-46,"stretch":120,"fisheye":-55,"photo":null},{"source":"Shopping cart","sourceEmoji":"🛒","target":"Deer","targetEmoji":"🦌","rotate":-71,"warp":-15,"stretch":78,"fisheye":-18,"photo":null},{"source":"Shopping bags","sourceEmoji":"🛍️","target":"Rabbit","targetEmoji":"🐇","rotate":-24,"warp":16,"stretch":97,"fisheye":19,"photo":null},{"source":"Trash can","sourceEmoji":"🗑️","target":"Top hat","targetEmoji":"🎩","rotate":23,"warp":47,"stretch":116,"fisheye":-55,"photo":null},{"source":"Bathtub","sourceEmoji":"🛁","target":"Boat","targetEmoji":"🚤","rotate":70,"warp":-33,"stretch":74,"fisheye":-18,"photo":null},{"source":"Toilet","sourceEmoji":"🚽","target":"Swan","targetEmoji":"🦢","rotate":-44,"warp":-2,"stretch":93,"fisheye":19,"photo":null},{"source":"Door","sourceEmoji":"🚪","target":"Chocolate bar","targetEmoji":"🍫","rotate":3,"warp":29,"stretch":112,"fisheye":-55,"photo":null},{"source":"Window","sourceEmoji":"🪟","target":"Waffle","targetEmoji":"🧇","rotate":50,"warp":-51,"stretch":70,"fisheye":-18,"photo":null},{"source":"Mirror","sourceEmoji":"🪞","target":"Lollipop","targetEmoji":"🍭","rotate":-64,"warp":-20,"stretch":89,"fisheye":19,"photo":null},{"source":"Bed","sourceEmoji":"🛏️","target":"Crocodile","targetEmoji":"🐊","rotate":-17,"warp":11,"stretch":108,"fisheye":-55,"photo":null},{"source":"Couch","sourceEmoji":"🛋️","target":"Hippo","targetEmoji":"🦛","rotate":30,"warp":42,"stretch":127,"fisheye":-18,"photo":null},{"source":"Ladder","sourceEmoji":"🪜","target":"Giraffe","targetEmoji":"🦒","rotate":77,"warp":-38,"stretch":85,"fisheye":19,"photo":null},{"source":"Ring","sourceEmoji":"💍","target":"Planet","targetEmoji":"🪐","rotate":-37,"warp":-7,"stretch":104,"fisheye":-55,"photo":null},{"source":"Gem","sourceEmoji":"💎","target":"Kite","targetEmoji":"🪁","rotate":10,"warp":24,"stretch":123,"fisheye":-18,"photo":null},{"source":"Battery","sourceEmoji":"🔋","target":"Bus","targetEmoji":"🚌","rotate":57,"warp":55,"stretch":81,"fisheye":19,"photo":null},{"source":"Computer mouse","sourceEmoji":"🖱️","target":"Beetle","targetEmoji":"🪲","rotate":-57,"warp":-25,"stretch":100,"fisheye":-55,"photo":null}];

const $=s=>document.querySelector(s);
const canvas=$('#canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const off=document.createElement('canvas'),offCtx=off.getContext('2d',{willReadFrequently:true});
off.width=canvas.width;off.height=canvas.height;

const controls={
  rotate:$('#rotate'),warp:$('#warp'),stretch:$('#stretch'),fisheye:$('#fisheye')
};
const values={
  rotate:$('#rotateValue'),warp:$('#warpValue'),stretch:$('#stretchValue'),fisheye:$('#fisheyeValue')
};

let levelIndex=0,sourceAsset=null,renderTicket=0,moves=0,hints=0,solved=false;
let solvedSet=new Set(JSON.parse(localStorage.getItem('object2-solved')||'[]'));

function twemojiCode(s){
  return Array.from(s).map(ch=>ch.codePointAt(0).toString(16)).filter(c=>c!=='fe0f').join('-');
}
function twemojiUrl(s){
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${twemojiCode(s)}.svg`;
}
function setTarget(emoji){
  const host=$('#targetAsset');host.replaceChildren();
  const img=new Image();img.alt='';img.src=twemojiUrl(emoji);
  img.onload=()=>host.replaceChildren(img);
  img.onerror=()=>{const span=document.createElement('span');span.className='nativeEmoji';span.textContent=emoji;host.replaceChildren(span)};
  host.append(img);
}
function loadImage(src){
  return new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
}
async function loadSource(level){
  sourceAsset=null;
  if(level.photo){
    try{sourceAsset={type:'image',value:await loadImage(level.photo)};}catch{sourceAsset={type:'emoji',value:level.sourceEmoji};}
  }else{
    try{sourceAsset={type:'image',value:await loadImage(twemojiUrl(level.sourceEmoji))};}
    catch{sourceAsset={type:'emoji',value:level.sourceEmoji};}
  }
  scheduleRender();
}
function drawContained(context,asset,w,h){
  context.clearRect(0,0,w,h);
  if(!asset)return;
  if(asset.type==='emoji'){
    context.save();context.textAlign='center';context.textBaseline='middle';
    context.font=`360px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    context.fillText(asset.value,w/2,h/2+8);context.restore();return;
  }
  const im=asset.value,scale=Math.min((w*.78)/im.width,(h*.78)/im.height);
  const dw=im.width*scale,dh=im.height*scale;
  context.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
}
function fisheye(source,strength){
  if(Math.abs(strength)<.01)return source;
  const w=source.width,h=source.height;
  const sctx=source.getContext('2d',{willReadFrequently:true});
  const src=sctx.getImageData(0,0,w,h),out=sctx.createImageData(w,h);
  const cx=w/2,cy=h/2,k=strength*.72;
  for(let y=0;y<h;y++){
    const ny=(y-cy)/cy;
    for(let x=0;x<w;x++){
      const nx=(x-cx)/cx,r2=nx*nx+ny*ny;
      let sx=x,sy=y;
      if(r2<1){
        const factor=Math.max(.28,1+k*(1-r2));
        sx=Math.round(cx+(x-cx)/factor);sy=Math.round(cy+(y-cy)/factor);
      }
      if(sx>=0&&sx<w&&sy>=0&&sy<h){
        const si=(sy*w+sx)*4,di=(y*w+x)*4;
        out.data[di]=src.data[si];out.data[di+1]=src.data[si+1];out.data[di+2]=src.data[si+2];out.data[di+3]=src.data[si+3];
      }
    }
  }
  sctx.putImageData(out,0,0);return source;
}
function render(){
  const w=canvas.width,h=canvas.height;
  const base=document.createElement('canvas');base.width=w;base.height=h;
  drawContained(base.getContext('2d'),sourceAsset,w,h);
  offCtx.clearRect(0,0,w,h);offCtx.save();offCtx.translate(w/2,h/2);
  const rot=+controls.rotate.value*Math.PI/180;
  const warp=+controls.warp.value/100;
  const stretch=+controls.stretch.value/100;
  offCtx.rotate(rot);
  offCtx.transform(stretch,warp*.34,warp*.22,1/Math.sqrt(stretch),0,0);
  offCtx.drawImage(base,-w/2,-h/2);offCtx.restore();
  fisheye(off,+controls.fisheye.value/100);
  ctx.clearRect(0,0,w,h);ctx.drawImage(off,0,0);
}
function scheduleRender(){
  const mine=++renderTicket;
  requestAnimationFrame(()=>{if(mine===renderTicket)render()});
}
function similarity(){
  const l=LEVELS[levelIndex];
  const dr=Math.abs(+controls.rotate.value-l.rotate)/180;
  const dw=Math.abs(+controls.warp.value-l.warp)/100;
  const ds=Math.abs(+controls.stretch.value-l.stretch)/100;
  const df=Math.abs(+controls.fisheye.value-l.fisheye)/100;
  const weighted=(dr*.24+dw*.26+ds*.24+df*.26);
  return Math.max(0,Math.round((1-weighted)*100));
}
function updateUI(move=true){
  if(move)moves++;
  values.rotate.textContent=`${controls.rotate.value}°`;
  values.warp.textContent=(+controls.warp.value>0?'+':'')+controls.warp.value;
  values.stretch.textContent=`${controls.stretch.value}%`;
  values.fisheye.textContent=(+controls.fisheye.value>0?'+':'')+controls.fisheye.value;
  const score=similarity();$('#scoreText').textContent=`${score}%`;$('#meterFill').style.width=score+'%';
  scheduleRender();
  if(!solved&&score>=94)completeLevel(score);
}
function resetTools(countMove=false){
  controls.rotate.value=0;controls.warp.value=0;controls.stretch.value=100;controls.fisheye.value=0;
  moves=0;hints=0;solved=false;$('#nextBtn').disabled=true;$('#hintText').textContent='Move any tool to begin.';
  updateUI(countMove);
}
async function showLevel(i){
  levelIndex=(i+LEVELS.length)%LEVELS.length;
  const l=LEVELS[levelIndex];
  $('#sourceName').textContent=l.source;$('#targetName').textContent=l.target;
  $('#levelLabel').textContent=String(levelIndex+1).padStart(2,'0')+' / '+LEVELS.length;
  $('#bestLabel').textContent=`${solvedSet.size} solved`;
  $('#goalCopy').textContent='Get to 94% similarity to morph it.';
  setTarget(l.targetEmoji);resetTools(false);await loadSource(l);
}
function biggestErrorHint(){
  const l=LEVELS[levelIndex];
  const arr=[
    ['Rotate',+controls.rotate.value,l.rotate,8],
    ['Warp',+controls.warp.value,l.warp,6],
    ['Stretch',+controls.stretch.value,l.stretch,6],
    ['Fisheye',+controls.fisheye.value,l.fisheye,6]
  ].map(x=>[...x,Math.abs(x[1]-x[2])]).sort((a,b)=>b[4]-a[4]);
  const [name,current,target,tol]=arr[0];
  if(Math.abs(current-target)<=tol)return `${name} is very close. Fine-tune another tool.`;
  const dir=target>current?'higher':'lower';
  return `${name} needs to go ${dir}.`;
}
function completeLevel(score){
  solved=true;solvedSet.add(levelIndex);localStorage.setItem('object2-solved',JSON.stringify([...solvedSet]));
  $('#bestLabel').textContent=`${solvedSet.size} solved`;$('#nextBtn').disabled=false;
  $('#successFlash').classList.remove('go');void $('#successFlash').offsetWidth;$('#successFlash').classList.add('go');
  const l=LEVELS[levelIndex];
  $('#winEmoji').textContent=l.targetEmoji;$('#winTitle').textContent=`${l.source} → ${l.target}`;
  const stars=hints===0&&moves<45?'★★★':hints<2?'★★☆':'★☆☆';
  $('#winStats').textContent=`${stars}  ${score}% similarity · ${moves} moves · ${hints} hints`;
  setTimeout(()=>$('#winDialog').showModal(),500);
}
Object.entries(controls).forEach(([name,el])=>el.addEventListener('input',()=>updateUI(true)));
$('#resetBtn').addEventListener('click',()=>resetTools(false));
$('#hintBtn').addEventListener('click',()=>{hints++;$('#hintText').textContent=biggestErrorHint()});
$('#nextBtn').addEventListener('click',()=>showLevel(levelIndex+1));
$('#continueBtn').addEventListener('click',()=>{$('#winDialog').close();showLevel(levelIndex+1)});
$('#randomBtn').addEventListener('click',()=>{let n=levelIndex;while(n===levelIndex)n=Math.floor(Math.random()*LEVELS.length);showLevel(n)});
$('#winDialog').addEventListener('cancel',e=>{e.preventDefault();$('#winDialog').close()});
window.addEventListener('keydown',e=>{
  if(e.key==='r'||e.key==='R')resetTools(false);
  if(e.key==='h'||e.key==='H'){hints++;$('#hintText').textContent=biggestErrorHint()}
});
showLevel(0);
