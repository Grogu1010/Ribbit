// Stick Grow v2 — Netlify frontend + Supabase multiplayer backend.
const SUPABASE_URL='https://enekvsumzfgeafimjfai.supabase.co';
const SUPABASE_KEY='sb_publishable_p53PUyE4VpJ-vnNx731pBw_r5APaosj';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);

let mode='',room='',playerId='',token='',snapshot=null,channel=null,refreshTimer=null;
let soundOn=localStorage.getItem('ribbit-sound')!=='off';
let qrRoom='',feedbackTimer=null,freezeTimer=null;

const show=id=>['home','host','player'].forEach(v=>$(v).classList.toggle('hidden',v!==id));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function action(p_action,other={}){
  const {data,error}=await db.rpc('ribbit_action',{
    p_action,p_code:room||null,p_token:token||null,p_name:null,p_word:null,p_target:null,p_power:null,...other
  });
  if(error)throw Error(error.message);
  return data;
}

async function safe(fn){
  try{await fn()}
  catch(e){
    const message=(e?.message||'Something went wrong').replace(/^.*?: /,'');
    if(mode==='player')notice(message,'bad');
    else alert(message);
  }
}

function notice(message,type='good'){
  const el=$('feedback');
  if(!el)return;
  clearTimeout(feedbackTimer);
  el.textContent=message;
  el.className='feedback show'+(type==='bad'?' bad':type==='big'?' big':'');
  feedbackTimer=setTimeout(()=>el.className='feedback',3200);
}

function sound(kind='tick'){
  if(!soundOn)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    const ctx=new Ctx(),o=ctx.createOscillator(),g=ctx.createGain();
    const map={tick:[340,.06],grow:[560,.10],big:[760,.18],snap:[120,.12],freeze:[240,.16],win:[920,.3]};
    const [freq,duration]=map[kind]||map.tick;
    o.frequency.value=freq;o.type=kind==='snap'?'square':'sine';
    g.gain.setValueAtTime(.055,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);
    setTimeout(()=>ctx.close(),500);
  }catch{}
}

function setSoundButton(){
  $('soundToggle').textContent=soundOn?'🔊':'🔇';
  $('soundToggle').setAttribute('aria-label',soundOn?'Mute sound':'Turn sound on');
}
$('soundToggle').onclick=()=>{
  soundOn=!soundOn;localStorage.setItem('ribbit-sound',soundOn?'on':'off');setSoundButton();sound('tick');
};
setSoundButton();

function tiles(letters){
  return (letters||[]).map(l=>`<div class="tile">${esc(l)}</div>`).join('');
}

function branchMarkup(percent){
  let branches='';
  if(percent>24)branches+='<i class="branch b1"><i class="leaf"></i></i>';
  if(percent>48)branches+='<i class="branch b2"><i class="leaf"></i></i>';
  if(percent>72)branches+='<i class="branch b3"><i class="leaf"></i></i>';
  return branches;
}

function lane(p,goal,rank=1,leader=false,compact=false){
  const percent=Math.max(0,Math.min(100,(p.score/goal)*100));
  const frozen=p.frozenUntil&&new Date(p.frozenUntil)>new Date();
  return `<div class="lane${leader?' leader':''}${p.boost?' boosted':''}${frozen?' frozen':''}" data-player="${esc(p.id)}">
    <div class="lane-head">
      <div class="lane-name"><span class="rank">#${rank}</span>${esc(p.name)}${p.boost?'<span class="boost-tag">×2</span>':''}${frozen?'<span class="ice-tag">❄ FROZEN</span>':''}</div>
      <div class="lane-score"><b>${p.score}</b> / ${goal}</div>
    </div>
    <div class="stick-field">
      <span class="stump"></span>
      <div class="stick-grow" style="--grow:${percent}%">
        ${branchMarkup(percent)}
        ${percent>4?'<span class="stick-frog">🐸</span>':''}
      </div>
      <span class="finish-flag">🏁</span>
    </div>
  </div>`;
}

function rankedPlayers(r){
  return [...(r.players||[])].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}

function updateQR(){
  if(mode!=='host'||!room||qrRoom===room)return;
  const box=$('qrCode');if(!box)return;
  const url=`${location.origin}/Stick_Grow/stick_grow.html?room=${encodeURIComponent(room)}`;
  box.innerHTML='';
  if(window.QRCode){
    new QRCode(box,{text:url,width:200,height:200,colorDark:'#102016',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  }else{
    box.innerHTML='<div style="color:#102016;font-weight:900;padding:24px">QR failed to load.<br>Use the room code.</div>';
  }
  qrRoom=room;
}

function showEvent(text,type=''){
  const feed=$('eventFeed');if(!feed)return;
  const el=document.createElement('div');
  el.className='event-pop '+type;el.textContent=text;feed.replaceChildren(el);
  setTimeout(()=>el.remove(),2500);
}

function shake(){
  document.body.classList.remove('screen-shake');
  void document.body.offsetWidth;
  document.body.classList.add('screen-shake');
  setTimeout(()=>document.body.classList.remove('screen-shake'),420);
}

function confetti(){
  const layer=$('fxLayer');if(!layer)return;
  for(let i=0;i<70;i++){
    const bit=document.createElement('i');
    bit.className='confetti';
    bit.style.left=Math.random()*100+'vw';
    bit.style.animationDelay=(Math.random()*.7)+'s';
    bit.style.setProperty('--drift',((Math.random()-.5)*45)+'vw');
    layer.appendChild(bit);
    setTimeout(()=>bit.remove(),3500);
  }
}

function inferEvents(current,previous){
  if(!previous||previous.code!==current.code)return;
  const oldMap=new Map((previous.players||[]).map(p=>[p.id,p]));
  for(const p of current.players||[]){
    const old=oldMap.get(p.id);if(!old)continue;
    const delta=p.score-old.score;
    if(delta>0){
      showEvent(`${p.name} grew +${delta}!`,delta>=18?'big':'');
      sound(delta>=18?'big':'grow');
      if(delta>=18)shake();
    }else if(delta<0){
      showEvent(`✂️ SNAP! ${p.name} lost ${Math.abs(delta)} growth`,'bad');sound('snap');shake();
      const laneEl=document.querySelector(`.lane[data-player="${CSS.escape(p.id)}"]`);
      if(laneEl){laneEl.classList.add('snap-hit');setTimeout(()=>laneEl.classList.remove('snap-hit'),500)}
    }
    if(!old.boost&&p.boost){
      showEvent(`⚡ ${p.name} UNLOCKED ×2 GROWTH!`,'big');sound('big');confetti();
    }
    const oldFreeze=old.frozenUntil?new Date(old.frozenUntil).getTime():0;
    const newFreeze=p.frozenUntil?new Date(p.frozenUntil).getTime():0;
    if(newFreeze>oldFreeze&&newFreeze>Date.now()){
      showEvent(`❄️ ${p.name} IS FROZEN!`,'bad');sound('freeze');
    }
  }
  if(previous.status!=='finished'&&current.status==='finished'){
    sound('win');confetti();
  }
}

async function refresh(){
  if(!room)return;
  try{
    const next=await action('state');
    const previous=snapshot;
    render(next,previous);
    inferEvents(next,previous);
    snapshot=next;
  }catch(e){console.warn('Room refresh failed',e)}
}

function render(r,previous){
  const ranked=rankedPlayers(r);

  if(mode==='host'){
    $('roomCode').textContent=r.code;
    $('bigRoomCode').textContent=r.code;
    $('joinUrl').textContent=`${location.origin}/Stick_Grow/stick_grow.html?room=${r.code}`;
    $('playerCount').textContent=r.players.length;
    $('lobbyPlayers').innerHTML=r.players.length
      ?r.players.map(p=>`<span class="player-chip">${esc(p.name)}</span>`).join('')
      :'<div class="empty-lobby">Waiting for the first frog…</div>';

    $('hostLobby').classList.toggle('hidden',r.status!=='lobby');
    $('hostRace').classList.toggle('hidden',r.status==='lobby');
    $('start').disabled=r.players.length===0;
    $('start').querySelector('span').textContent=r.players.length===1?'START SOLO':'START RACE';
    $('goalValue').textContent=r.goal;
    $('hostRoundLabel').textContent=r.status==='lobby'?'LOBBY':r.status==='finished'?'FINISHED':'RACING';
    $('hostLetters').innerHTML=tiles(r.letters);
    $('lanes').innerHTML=ranked.map((p,i)=>lane(p,r.goal,i+1,i===0&&r.status==='playing')).join('');

    const winner=r.players.find(p=>p.id===r.winner);
    $('hostStatus').textContent=r.status==='finished'
      ?`${winner?.name||'SOMEONE'} WINS!`
      :`FIRST TO ${r.goal} — GROW!`;
    $('again').classList.toggle('hidden',r.status!=='finished');

    if(r.status==='lobby')updateQR();

    const showWinner=r.status==='finished';
    $('winnerOverlay').classList.toggle('hidden',!showWinner);
    if(showWinner)$('winnerName').textContent=(winner?.name||'WINNER').toUpperCase()+'!';
  }

  if(mode==='player'){
    const me=r.players.find(p=>p.id===playerId);
    const rank=Math.max(1,ranked.findIndex(p=>p.id===playerId)+1);
    $('playerRoomCode').textContent=r.code;
    $('playerRank').textContent=me?`#${rank}`:'#–';
    $('playerInfo').textContent=`${r.players.length}/12 players · first to ${r.goal}`;
    $('playerLetters').innerHTML=tiles(r.letters);
    $('playControls').classList.toggle('hidden',r.status!=='playing');
    $('waitingCard').classList.toggle('hidden',r.status==='playing');

    if(r.status==='lobby')$('playerStatus').textContent='You’re in. Eyes on the TV!';
    else if(r.status==='finished')$('playerStatus').textContent=r.winner===playerId?'YOU GREW THE BIGGEST! 🏆':'Race over!';
    else $('playerStatus').textContent=rank===1?'YOU’RE LEADING!':'GROW, GROW, GROW!';

    $('boostBadge').classList.toggle('active',!!me?.boost);
    $('boostBadge').title=me?.boost?'Permanent 2× growth is active':'Get a 10-letter word to unlock 2×';
    $('myProgress').innerHTML=me?lane(me,r.goal,rank,rank===1,true):'';
    $('myScoreText').textContent=me?`${me.score} / ${r.goal}`:`0 / ${r.goal}`;

    $('targets').innerHTML=ranked.filter(p=>p.id!==playerId).map(p=>`
      <div class="target-row">
        <span class="target-name">${esc(p.name)} <small>${p.score}</small></span>
        <button class="power-btn snap" data-type="snap" data-id="${esc(p.id)}" ${me?.snapUsed?'disabled':''}>✂️ SNAP</button>
        <button class="power-btn freeze" data-type="freeze" data-id="${esc(p.id)}" ${me?.freezeUsed?'disabled':''}>❄️ FREEZE</button>
      </div>`).join('') || '<div class="empty-lobby">No rivals yet. Enjoy the peace.</div>';

    $('targets').querySelectorAll('button').forEach(b=>b.onclick=()=>safe(async()=>{
      await action('power',{p_power:b.dataset.type,p_target:b.dataset.id});
      notice(b.dataset.type==='snap'?'✂️ SNAP SENT!':'❄️ FREEZE SENT!','big');
      sound(b.dataset.type==='snap'?'snap':'freeze');
      await refresh();
    }));

    applyFreeze(me);
    if(r.status==='finished'&&previous?.status!=='finished'){
      if(r.winner===playerId){confetti();sound('win')}
      else sound('tick');
    }
  }
}

function applyFreeze(me){
  clearTimeout(freezeTimer);
  const until=me?.frozenUntil?new Date(me.frozenUntil).getTime():0;
  const frozen=until>Date.now();
  $('player').classList.toggle('is-frozen',frozen);
  $('freezeBanner').classList.toggle('hidden',!frozen);
  $('word').disabled=frozen;
  $('submit').disabled=frozen;
  if(frozen){
    const left=Math.max(100,until-Date.now()+120);
    freezeTimer=setTimeout(()=>refresh(),left);
  }
}

async function connect(){
  if(channel)await db.removeChannel(channel);
  channel=db.channel('ribbit-'+room)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'ribbit_updates',filter:'room_code=eq.'+room},()=>refresh())
    .subscribe();
  if(refreshTimer)clearInterval(refreshTimer);
  refreshTimer=setInterval(refresh,4000);
  await refresh();
}

$('launch').onclick=()=>safe(async()=>{
  sound('tick');
  const r=await action('create');
  room=r.code;token=r.token;mode='host';snapshot=null;qrRoom='';
  sessionStorage.setItem('ribbit-host',JSON.stringify({room,token}));
  show('host');await connect();
});

$('join').onclick=()=>safe(async()=>{
  const code=$('joinCode').value.trim().toUpperCase(),name=$('name').value.trim();
  if(!code||!name)throw Error('Enter a room code and your name.');
  room=code;
  const r=await action('join',{p_name:name});
  room=r.code;playerId=r.id;token=r.token;mode='player';snapshot=null;
  sessionStorage.setItem('ribbit-player',JSON.stringify({room,playerId,token}));
  show('player');sound('tick');await connect();
});

$('start').onclick=()=>safe(async()=>{sound('big');await action('start');await refresh()});
$('again').onclick=()=>safe(async()=>{
  $('winnerOverlay').classList.add('hidden');
  await action('reset');snapshot=null;await refresh();
});

$('copyLink').onclick=()=>safe(async()=>{
  const url=`${location.origin}/Stick_Grow/stick_grow.html?room=${room}`;
  await navigator.clipboard.writeText(url);
  $('copyLink').textContent='COPIED!';
  setTimeout(()=>$('copyLink').textContent='COPY JOIN LINK',1500);
});

$('submit').onclick=()=>safe(async()=>{
  const word=$('word').value.trim();
  if(!word)return;
  $('submit').disabled=true;
  try{
    const r=await action('word',{p_word:word});
    const big=r.points>=18;
    notice(`+${r.points} GROWTH${r.boost?' · ×2 ACTIVE!':''}`,big?'big':'good');
    sound(big?'big':'grow');
    $('word').value='';
    await refresh();
  }finally{
    if(!$('player').classList.contains('is-frozen'))$('submit').disabled=false;
    $('word').focus();
  }
});

$('word').addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();$('submit').click()}
});

const q=new URLSearchParams(location.search);
if(q.has('room')){
  const code=q.get('room').trim().toUpperCase().slice(0,5);
  $('joinCode').value=code;
  $('joinRoomValue').textContent=code;
  $('joinRoomPill').classList.remove('hidden');
  $('roomField').classList.add('hidden');
  setTimeout(()=>$('name').focus(),100);
}
if(q.has('name'))$('name').value=q.get('name');

(async()=>{
  try{
    const savedHost=JSON.parse(sessionStorage.getItem('ribbit-host')||'null');
    const savedPlayer=JSON.parse(sessionStorage.getItem('ribbit-player')||'null');
    const queryRoom=q.get('room')?.toUpperCase();
    let saved=null;
    if(queryRoom){
      if(savedPlayer?.room===queryRoom)saved=savedPlayer;
      else if(savedHost?.room===queryRoom)saved=savedHost;
    }else saved=savedPlayer||savedHost;

    if(saved){
      room=saved.room;token=saved.token;playerId=saved.playerId||'';
      mode=saved.playerId?'player':'host';
      show(mode);await connect();return;
    }
    if(q.has('room')&&q.has('name'))$('join').click();
  }catch(e){console.warn(e)}
})();
