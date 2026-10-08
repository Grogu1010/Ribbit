// Ribbit runs as a static Netlify site. All game writes go through Supabase RPC.
const SUPABASE_URL='https://enekvsumzfgeafimjfai.supabase.co';
const SUPABASE_KEY='sb_publishable_p53PUyE4VpJ-vnNx731pBw_r5APaosj';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let mode='',room='',playerId='',token='',snapshot=null,channel=null,refreshTimer=null;
const show=id=>['home','host','player'].forEach(v=>$(v).classList.toggle('hidden',v!==id));
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notice=m=>{const el=$('feedback');el.textContent=m;setTimeout(()=>{if(el.textContent===m)el.textContent=''},4000)};
async function action(p_action,other={}){
 const {data,error}=await db.rpc('ribbit_action',{p_action,p_code:room||null,p_token:token||null,p_name:null,p_word:null,p_target:null,p_power:null,...other});
 if(error)throw Error(error.message);
 return data;
}
async function safe(fn){try{await fn()}catch(e){const message=e.message||'Something went wrong';if(mode==='player')notice(message);else alert(message)}}
function tiles(letters){return (letters||[]).map(l=>'<div class="tile">'+escapeHtml(l)+'</div>').join('')}
function lane(p,goal){return '<div class="lane"><div class="lane-head"><b>'+escapeHtml(p.name)+(p.boost?' ⚡2×':'')+'</b><span>'+p.score+' / '+goal+'</span></div><div class="track"><div class="bar" style="width:'+Math.min(100,100*p.score/goal)+'%"></div></div></div>'}
async function refresh(){
 if(!room)return;
 try{const r=await action('state');snapshot=r;render(r)}catch(e){console.warn('Room refresh failed',e)}
}
function render(r){
 if(mode==='host'){
  $('roomCode').textContent=r.code;
  $('joinUrl').textContent=location.origin+'/Stick_Grow/stick_grow.html?room='+r.code;
  $('hostLetters').innerHTML=tiles(r.letters);
  $('lanes').innerHTML=r.players.map(p=>lane(p,r.goal)).join('');
  $('hostStatus').textContent=r.status==='lobby'?r.players.length+' / 12 players ready':r.status==='finished'?'🏆 '+(r.players.find(p=>p.id===r.winner)?.name||'Someone')+' wins!':'Race to '+r.goal+'!';
  $('start').classList.toggle('hidden',r.status!=='lobby');
  $('again').classList.toggle('hidden',r.status!=='finished');
 }
 if(mode==='player'){
  const me=r.players.find(p=>p.id===playerId);
  $('playerStatus').textContent=r.status==='lobby'?'Waiting for host to start…':r.status==='finished'?(r.winner===playerId?'🏆 YOU WIN!':'Race over!'):'GO GO GO!';
  $('playerInfo').textContent='Room '+r.code+' · '+r.players.length+'/12 players';
  $('playerLetters').innerHTML=tiles(r.letters);
  $('playControls').classList.toggle('hidden',r.status!=='playing');
  $('myProgress').innerHTML=me?lane(me,r.goal):'';
  $('targets').innerHTML=r.players.filter(p=>p.id!==playerId).map(p=>'<div><strong>'+escapeHtml(p.name)+'</strong> <button data-type="snap" data-id="'+p.id+'" '+(me?.snapUsed?'disabled':'')+'>Snap</button> <button data-type="freeze" data-id="'+p.id+'" '+(me?.freezeUsed?'disabled':'')+'>Freeze</button></div>').join('');
  $('targets').querySelectorAll('button').forEach(b=>b.onclick=()=>safe(async()=>{await action('power',{p_power:b.dataset.type,p_target:b.dataset.id});notice('Sabotage sent!');await refresh()}));
  if(me?.frozenUntil&&new Date(me.frozenUntil)>new Date())notice('❄️ Frozen for 5 seconds!');
 }
}
async function connect(){
 if(channel)await db.removeChannel(channel);
 channel=db.channel('ribbit-'+room).on('postgres_changes',{event:'UPDATE',schema:'public',table:'ribbit_updates',filter:'room_code=eq.'+room},()=>refresh()).subscribe();
 if(refreshTimer)clearInterval(refreshTimer);
 refreshTimer=setInterval(refresh,4000); // fallback if realtime delivery is interrupted
 await refresh();
}
$('launch').onclick=()=>safe(async()=>{
 const r=await action('create');room=r.code;token=r.token;mode='host';
 sessionStorage.setItem('ribbit-host',JSON.stringify({room,token}));show('host');await connect();
});
$('join').onclick=()=>safe(async()=>{
 const code=$('joinCode').value.trim().toUpperCase(),name=$('name').value.trim();
 if(!code||!name)throw Error('Enter room code and name');
 room=code;
 const r=await action('join',{p_name:name});room=r.code;playerId=r.id;token=r.token;mode='player';
 sessionStorage.setItem('ribbit-player',JSON.stringify({room,playerId,token}));show('player');await connect();
});
$('start').onclick=()=>safe(async()=>{await action('start');await refresh()});
$('again').onclick=()=>safe(async()=>{await action('reset');await refresh()});
$('submit').onclick=()=>safe(async()=>{
 const word=$('word').value.trim();if(!word)return;
 const r=await action('word',{p_word:word});
 notice('+'+r.points+' growth!'+(r.boost?' 2× active!':''));
 $('word').value='';$('word').focus();await refresh();
});
$('word').addEventListener('keydown',e=>{if(e.key==='Enter')$('submit').click()});
const q=new URLSearchParams(location.search);
if(q.has('room'))$('joinCode').value=q.get('room').toUpperCase();
if(q.has('name'))$('name').value=q.get('name');
(async()=>{
 try{
  const savedHost=JSON.parse(sessionStorage.getItem('ribbit-host')||'null');
  const savedPlayer=JSON.parse(sessionStorage.getItem('ribbit-player')||'null');
  const saved=q.has('room')?(savedPlayer?.room===q.get('room').toUpperCase()?savedPlayer:null):(savedPlayer||savedHost);
  if(saved){room=saved.room;token=saved.token;playerId=saved.playerId||'';mode=saved.playerId?'player':'host';show(mode);await connect();return}
  if(q.has('room')&&q.has('name'))$('join').click();
 }catch(e){console.warn(e)}
})();
