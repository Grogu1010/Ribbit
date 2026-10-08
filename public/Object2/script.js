const SUPABASE_URL='https://enekvsumzfgeafimjfai.supabase.co';
const SUPABASE_KEY='sb_publishable_p53PUyE4VpJ-vnNx731pBw_r5APaosj';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let mode='',room='',channel=null,hostState=null,playerId='',playerName='',latestState=null;
let joinTimer=null,advanceTimer=null,toastTimer=null,lastEditorRound='';

function showScreen(name){['home','host','player'].forEach(id=>$(id).classList.toggle('hidden',id!==name))}
function toast(message,bad=false){
  clearTimeout(toastTimer);const el=$('toast');el.textContent=message;el.className='toast show'+(bad?' bad':'');
  toastTimer=setTimeout(()=>el.className='toast',2300);
}
function randomCode(){return Array.from({length:5},()=>ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('')}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function playerById(id){return hostState?.players.get(id)}
function stopChannel(){
  if(joinTimer){clearInterval(joinTimer);joinTimer=null}
  if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null}
  if(channel){db.removeChannel(channel).catch(()=>{});channel=null}
}
async function send(event,payload={}){
  if(!channel)return;
  try{await channel.send({type:'broadcast',event,payload})}catch(e){console.warn('Object2 broadcast failed',e)}
}

function makePublicState(){
  const s=hostState,players=[...s.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,submitted:!!p.submitted}));
  let currentMatch=null;
  if(s.currentMatch){
    const left=playerById(s.currentMatch.left),right=playerById(s.currentMatch.right);
    currentMatch={
      round:s.currentMatch.round,number:s.currentMatch.number,
      left:{id:left.id,name:left.name,image:s.submissions.get(left.id)},
      right:{id:right.id,name:right.name,image:s.submissions.get(right.id)},
      votes:{...s.currentMatch.votes},votesNeeded:Math.max(1,s.players.size-2)
    };
  }
  const winner=s.winner?playerById(s.winner):null;
  return {
    status:s.status,round:s.round,levelIndex:s.levelIndex,players,currentMatch,lastResult:s.lastResult,
    winner:winner?{id:winner.id,name:winner.name,image:s.submissions.get(winner.id),score:winner.score}:null
  };
}
function broadcastState(){if(mode==='host'&&hostState){renderHost();send('state',makePublicState())}}

function hostJoin(payload){
  const id=String(payload?.id||''),name=String(payload?.name||'').trim().slice(0,20);if(!id||!name)return;
  if(hostState.players.has(id)){send('state',makePublicState());return}
  if(hostState.status!=='lobby'){send('reject',{to:id,message:'That round has already started.'});return}
  if(hostState.players.size>=8){send('reject',{to:id,message:'This Object² room is full.'});return}
  hostState.players.set(id,{id,name,score:0,submitted:false});broadcastState();
}
function hostSubmit(payload){
  if(hostState.status!=='morph')return;
  const p=hostState.players.get(payload?.id),image=payload?.image;
  if(!p||typeof image!=='string'||!image.startsWith('data:image/')||image.length>220000)return;
  hostState.submissions.set(p.id,image);p.submitted=true;broadcastState();
  if([...hostState.players.values()].every(x=>x.submitted))startBracket();
}
function eligibleVoters(match){return [...hostState.players.keys()].filter(id=>id!==match.left&&id!==match.right)}
function hostVote(payload){
  if(hostState.status!=='vote'||!hostState.currentMatch)return;
  const voter=hostState.players.get(payload?.id),m=hostState.currentMatch,choice=payload?.choice;
  if(!voter||voter.id===m.left||voter.id===m.right||!([m.left,m.right].includes(choice)))return;
  m.votes[voter.id]=choice;broadcastState();
  if(eligibleVoters(m).every(id=>m.votes[id]))resolveMatch();
}
function setupHostChannel(){
  stopChannel();
  channel=db.channel('object2-'+room)
    .on('broadcast',{event:'join'},({payload})=>hostJoin(payload))
    .on('broadcast',{event:'submit'},({payload})=>hostSubmit(payload))
    .on('broadcast',{event:'vote'},({payload})=>hostVote(payload))
    .on('broadcast',{event:'state_request'},()=>send('state',makePublicState()))
    .subscribe(status=>{if(status==='SUBSCRIBED')broadcastState()});
}
function createHost(){
  room=randomCode();mode='host';latestState=null;
  hostState={status:'lobby',round:0,levelIndex:-1,players:new Map(),submissions:new Map(),bracket:null,currentMatch:null,lastResult:null,winner:null};
  showScreen('host');setupHostChannel();updateQR();renderHost();
}
function startRound(){
  if(hostState.players.size<3){toast('Object² needs at least 3 players.',true);return}
  hostState.status='morph';hostState.round++;hostState.levelIndex=Object2Level.random(hostState.levelIndex);
  hostState.submissions=new Map();hostState.bracket=null;hostState.currentMatch=null;hostState.lastResult=null;hostState.winner=null;
  for(const p of hostState.players.values())p.submitted=false;
  broadcastState();
}
function startBracket(){
  if(hostState.status!=='morph')return;
  const entrants=[...hostState.players.values()].filter(p=>p.submitted).map(p=>p.id);
  if(entrants.length<3){toast('Need at least 3 submitted morphs.',true);return}
  hostState.status='vote';hostState.lastResult=null;hostState.winner=null;
  hostState.bracket={round:1,queue:shuffle(entrants),winners:[],matchIndex:0};hostState.currentMatch=null;setNextMatch();
}
function setNextMatch(){
  if(hostState.status!=='vote')return;const b=hostState.bracket;
  while(true){
    const idx=b.matchIndex*2;
    if(idx>=b.queue.length){
      if(b.winners.length===1){finishRound(b.winners[0]);return}
      b.queue=[...b.winners];b.winners=[];b.round++;b.matchIndex=0;continue;
    }
    const left=b.queue[idx],right=b.queue[idx+1];
    if(!right){b.winners.push(left);b.matchIndex++;continue}
    hostState.currentMatch={left,right,votes:{},round:b.round,number:b.matchIndex+1};broadcastState();return;
  }
}
function resolveMatch(){
  if(hostState.status!=='vote'||!hostState.currentMatch)return;
  const m=hostState.currentMatch;let leftVotes=0,rightVotes=0;
  Object.values(m.votes).forEach(choice=>{if(choice===m.left)leftVotes++;else if(choice===m.right)rightVotes++});
  const winner=leftVotes===rightVotes?(Math.random()<.5?m.left:m.right):(leftVotes>rightVotes?m.left:m.right);
  hostState.lastResult={winner,left:m.left,right:m.right,leftVotes,rightVotes,tie:leftVotes===rightVotes};
  hostState.bracket.winners.push(winner);hostState.bracket.matchIndex++;hostState.currentMatch=null;broadcastState();
  clearTimeout(advanceTimer);advanceTimer=setTimeout(setNextMatch,1400);
}
function finishRound(winnerId){
  hostState.status='finished';hostState.winner=winnerId;hostState.currentMatch=null;
  const winner=playerById(winnerId);if(winner)winner.score++;broadcastState();
}
function updateQR(){
  $('hostRoomCode').textContent=room;const url=`${location.origin}/Object2/index.html?room=${encodeURIComponent(room)}`;
  $('joinUrl').textContent=url;$('qrCode').replaceChildren();
  if(window.QRCode)new QRCode($('qrCode'),{text:url,width:230,height:230,colorDark:'#102016',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  else $('qrCode').textContent='Use room '+room;
}
function phaseName(status){return ({lobby:'LOBBY',morph:'MORPHING',vote:'VOTING',finished:'ROUND OVER'})[status]||status.toUpperCase()}
function setHostPrompt(){
  const l=Object2Level.get(hostState.levelIndex);
  $('hostRoundNumber').textContent=hostState.round;$('hostSourceEmoji').textContent=l.sourceEmoji;$('hostTargetEmoji').textContent=l.targetEmoji;
  $('hostSourceName').textContent=l.source;$('hostTargetName').textContent=l.target;
}
function renderHost(){
  if(mode!=='host'||!hostState)return;const s=hostState;
  $('hostRoomCode').textContent=room;$('hostPhase').textContent=phaseName(s.status);
  $('hostLobby').classList.toggle('hidden',s.status!=='lobby');$('hostRound').classList.toggle('hidden',s.status==='lobby');
  if(s.status==='lobby'){
    $('hostPlayerCount').textContent=s.players.size;
    $('hostPlayers').innerHTML=s.players.size?[...s.players.values()].map(p=>`<div class="playerChip">${esc(p.name)}</div>`).join(''):'<div class="empty">Waiting for phones to join…</div>';
    $('startButton').disabled=s.players.size<3;return;
  }
  setHostPrompt();$('hostMorphPanel').classList.toggle('hidden',s.status!=='morph');$('hostVotePanel').classList.toggle('hidden',s.status!=='vote');$('hostFinishedPanel').classList.toggle('hidden',s.status!=='finished');
  if(s.status==='morph'){
    $('hostPromptText').textContent='Everyone has the same source and target. Drag specific parts with the four tools.';
    const players=[...s.players.values()],done=players.filter(p=>p.submitted).length;
    $('submitCount').textContent=`${done} / ${players.length}`;$('submitGrid').innerHTML=players.map(p=>`<div class="submitPlayer${p.submitted?' done':''}"><i></i><b>${esc(p.name)}</b></div>`).join('');
    $('forceVoteButton').disabled=done<3;
  }else if(s.status==='vote'){
    $('hostPromptText').textContent='Vote on the phones. Match winners advance until one morph survives.';
    const m=s.currentMatch;
    if(!m){
      const w=s.lastResult?playerById(s.lastResult.winner):null;$('matchTitle').textContent=s.lastResult?(s.lastResult.tie?`${w?.name||'Winner'} advances on a tie-break`:`${w?.name||'Winner'} advances!`):'Building the bracket…';
      $('voteProgress').textContent='';$('hostMatch').innerHTML='<div class="empty" style="grid-column:1/-1;min-height:220px">Next matchup incoming…</div>';return;
    }
    const left=playerById(m.left),right=playerById(m.right),votes=Object.keys(m.votes).length,need=eligibleVoters(m).length;
    $('matchTitle').textContent=`Bracket ${m.round} · Match ${m.number}`;$('voteProgress').textContent=`${votes} / ${need} votes`;
    $('hostMatch').innerHTML=`<article class="matchCard"><img src="${s.submissions.get(left.id)}" alt="${esc(left.name)} morph"><b>${esc(left.name)}</b></article><div class="versus">VS</div><article class="matchCard"><img src="${s.submissions.get(right.id)}" alt="${esc(right.name)} morph"><b>${esc(right.name)}</b></article>`;
    const b=s.bracket;$('bracketTrail').innerHTML=b.queue.map(id=>`<span>${esc(playerById(id)?.name||'?')}</span>`).join('')+b.winners.map(id=>`<span class="advanced">✓ ${esc(playerById(id)?.name||'?')}</span>`).join('');
  }else if(s.status==='finished'){
    const winner=playerById(s.winner);$('hostPromptText').textContent='The bracket has spoken.';$('winnerName').textContent=(winner?.name||'Winner')+' wins!';$('winnerImage').src=s.submissions.get(s.winner)||'';
    $('scoreboard').innerHTML=[...s.players.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).map((p,i)=>`<div class="scoreRow"><span>#${i+1} ${esc(p.name)}</span><strong>${p.score} win${p.score===1?'':'s'}</strong></div>`).join('');
  }
}

function setupPlayerChannel(){
  stopChannel();
  channel=db.channel('object2-'+room)
    .on('broadcast',{event:'state'},({payload})=>receiveState(payload))
    .on('broadcast',{event:'reject'},({payload})=>{if(payload?.to===playerId){toast(payload.message||'Could not join.',true);sessionStorage.removeItem('object2-player')}})
    .subscribe(status=>{
      if(status==='SUBSCRIBED'){
        requestJoin();joinTimer=setInterval(()=>{if(!latestState?.players?.some(p=>p.id===playerId))requestJoin();else{clearInterval(joinTimer);joinTimer=null}},1500);
      }
    });
}
function requestJoin(){send('join',{id:playerId,name:playerName})}
function receiveState(state){
  if(mode!=='player'||!state)return;latestState=state;
  if(state.players?.some(p=>p.id===playerId)&&joinTimer){clearInterval(joinTimer);joinTimer=null}
  renderPlayer(state);
}
function joinRoom(){
  const code=$('joinCode').value.trim().toUpperCase(),name=$('playerName').value.trim();
  if(!/^[A-Z0-9]{5}$/.test(code)){toast('Enter the five-character room code.',true);return}
  if(!name){toast('Enter your name.',true);return}
  room=code;playerName=name.slice(0,20);playerId=crypto.randomUUID();mode='player';latestState=null;
  sessionStorage.setItem('object2-player',JSON.stringify({room,playerId,playerName}));
  $('playerRoomCode').textContent=room;showScreen('player');setupPlayerChannel();renderPlayer({status:'lobby',players:[]});
}
function setPlayerPanel(which){['playerLobby','editorPanel','playerVotePanel','playerResultPanel'].forEach(id=>$(id).classList.toggle('hidden',id!==which))}
async function renderPlayer(s){
  const me=s.players?.find(p=>p.id===playerId);$('playerScore').textContent=me?.score??0;
  if(s.status==='lobby'){
    setPlayerPanel('playerLobby');$('playerLobbyTitle').textContent=me?'You’re in!':'Joining room…';
    $('playerLobbyInfo').textContent=me?`${s.players.length} / 8 players · host starts at 3+`:'Looking for the host screen…';return;
  }
  const l=Object2Level.get(s.levelIndex);
  if(s.status==='morph'){
    setPlayerPanel('editorPanel');$('playerSourceEmoji').textContent=l.sourceEmoji;$('playerTargetEmoji').textContent=l.targetEmoji;$('playerSourceName').textContent=l.source;$('playerTargetName').textContent=l.target;
    const key=`${s.round}:${s.levelIndex}`;
    if(lastEditorRound!==key){lastEditorRound=key;Object2Editor.setEnabled(false);await Object2Editor.setEmoji(l.sourceEmoji)}
    Object2Editor.setEnabled(true);$('submittedNote').classList.toggle('hidden',!me?.submitted);$('submitMorphButton').querySelector('b').textContent=me?.submitted?'UPDATE SUBMISSION':'SUBMIT MORPH';return;
  }
  Object2Editor.setEnabled(false);
  if(s.status==='vote'){setPlayerPanel('playerVotePanel');renderPlayerVote(s);return}
  if(s.status==='finished'){
    setPlayerPanel('playerResultPanel');$('resultEmoji').textContent=s.winner?.id===playerId?'🏆':'🌀';
    $('playerResultTitle').textContent=s.winner?.id===playerId?'YOU WON THE BRACKET!':`${s.winner?.name||'Someone'} won this round`;
    $('playerResultInfo').textContent='The host can launch another random object with the same room.';
  }
}
function renderPlayerVote(s){
  const m=s.currentMatch;
  if(!m){$('playerMatchTitle').textContent=s.lastResult?'A morph advances!':'Building the bracket…';$('voteInstruction').textContent='Next matchup incoming…';$('playerMatch').innerHTML='';$('playerVoteProgress').textContent='';return}
  const playing=m.left.id===playerId||m.right.id===playerId,vote=m.votes?.[playerId];
  $('playerMatchTitle').textContent=`Bracket ${m.round} · Which got closer?`;
  $('voteInstruction').textContent=playing?'Your morph is in this matchup — you sit this vote out.':'Tap the transformation that looks closest to the target.';
  $('playerMatch').innerHTML=[m.left,m.right].map(side=>`<button class="voteChoice${vote===side.id?' selected':''}" data-choice="${side.id}" type="button" ${playing?'disabled':''}><img src="${side.image}" alt="${esc(side.name)} morph"><b>${esc(side.name)}</b></button>`).join('');
  $('playerMatch').querySelectorAll('.voteChoice').forEach(btn=>btn.onclick=()=>{if(!playing)send('vote',{id:playerId,choice:btn.dataset.choice})});
  $('playerVoteProgress').textContent=`${Object.keys(m.votes||{}).length} / ${m.votesNeeded} votes in`;
}

$('hostButton').onclick=createHost;
$('joinButton').onclick=joinRoom;
$('startButton').onclick=startRound;
$('forceVoteButton').onclick=startBracket;
$('resolveButton').onclick=resolveMatch;
$('nextRoundButton').onclick=startRound;
$('copyLink').onclick=async()=>{const url=`${location.origin}/Object2/index.html?room=${room}`;try{await navigator.clipboard.writeText(url);toast('Join link copied.')}catch{toast('Could not copy the link.',true)}};
$('submitMorphButton').onclick=()=>{
  if(latestState?.status!=='morph'||!Object2Editor.isReady())return;
  send('submit',{id:playerId,image:Object2Editor.export()});$('submittedNote').classList.remove('hidden');toast('Morph submitted!');
};

const q=new URLSearchParams(location.search);
if(q.has('room')){
  const code=q.get('room').trim().toUpperCase().slice(0,5);$('joinCode').value=code;$('joinRoomValue').textContent=code;$('joinRoomPill').classList.remove('hidden');$('roomField').classList.add('hidden');setTimeout(()=>$('playerName').focus(),100);
}
window.addEventListener('beforeunload',stopChannel);
showScreen('home');