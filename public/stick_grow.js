
const s=io(),$=id=>document.getElementById(id);let mode='',room='',playerId='',snapshot=null,powers={snap:false,freeze:false};
const show=id=>{for(const v of ['home','host','player'])$(v).classList.toggle('hidden',v!==id)};
const notice=m=>{$('feedback').textContent=m;setTimeout(()=>{if($('feedback').textContent===m)$('feedback').textContent=''},3500)};
const request=(event,data,cb)=>s.emit(event,data,r=>{if(!r?.ok){alert(r?.error||'Something went wrong');return}cb?.(r)});
$('launch').onclick=()=>request('host:create',{},r=>{mode='host';room=r.code;show('host')});
$('join').onclick=()=>{const c=$('joinCode').value.trim().toUpperCase(),name=$('name').value.trim();if(!c||!name)return alert('Enter room code and name');request('room:join',{code:c,name},r=>{mode='player';room=r.code;playerId=r.id;sessionStorage.setItem('ribbit:'+room,JSON.stringify({playerId,name}));show('player')})};
$('start').onclick=()=>request('host:start',{},()=>{});
$('again').onclick=()=>request('host:reset',{},()=>{});
$('submit').onclick=()=>{const word=$('word').value.trim();if(!word)return;s.emit('word:submit',{word},r=>{if(r?.ok){notice('+'+r.points+' growth!'+(r.boost?' 2× ACTIVE!':''));$('word').value='';$('word').focus()}else notice(r?.error||'Try again')})};
$('word').addEventListener('keydown',e=>{if(e.key==='Enter')$('submit').click()});
const tiles=letters=>letters.map(l=>'<div class="tile">'+l+'</div>').join('');
const lane=(p,goal)=>'<div class="lane"><div class="lane-head"><b>'+escapeHtml(p.name)+(p.boost?' ⚡2×':'')+'</b><span>'+p.score+' / '+goal+'</span></div><div class="track"><div class="bar" style="width:'+Math.min(100,100*p.score/goal)+'%"></div></div></div>';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
s.on('state',r=>{if(r.code!==room)return;snapshot=r;
 if(mode==='host'){$('roomCode').textContent=r.code;$('joinUrl').textContent=location.host;$('hostLetters').innerHTML=tiles(r.letters);$('lanes').innerHTML=r.players.map(p=>lane(p,r.goal)).join('');$('hostStatus').textContent=r.status==='lobby'?r.players.length+' / 12 players ready':r.status==='finished'?'🏆 '+(r.players.find(p=>p.id===r.winner)?.name||'Someone')+' wins!':'Race to '+r.goal+'!';$('start').classList.toggle('hidden',r.status!=='lobby');$('again').classList.toggle('hidden',r.status!=='finished')}
 if(mode==='player'){const me=r.players.find(p=>p.id===playerId);$('playerStatus').textContent=r.status==='lobby'?'Waiting for host to start…':r.status==='finished'?(r.winner===playerId?'🏆 YOU WIN!':'Race over!'):'GO GO GO!';$('playerInfo').textContent='Room '+r.code+' · '+r.players.length+'/12 players';$('playerLetters').innerHTML=tiles(r.letters);$('playControls').classList.toggle('hidden',r.status!=='playing');$('myProgress').innerHTML=me?lane(me,r.goal):'';$('targets').innerHTML=r.players.filter(p=>p.id!==playerId).map(p=>'<div><strong>'+escapeHtml(p.name)+'</strong> <button data-type="snap" data-id="'+p.id+'" '+(powers.snap?'disabled':'')+'>Snap</button> <button data-type="freeze" data-id="'+p.id+'" '+(powers.freeze?'disabled':'')+'>Freeze</button></div>').join('');$('targets').querySelectorAll('button').forEach(b=>b.onclick=()=>s.emit('power:use',{type:b.dataset.type,target:b.dataset.id},a=>{if(a?.ok){powers[b.dataset.type]=true;notice('Sabotage sent!')}else notice(a?.error||'Failed')}));if(r.status==='lobby')powers={snap:false,freeze:false}}
});
s.on('effect',e=>{if(mode==='player'&&e.id===playerId&&e.type==='freeze')notice('❄️ Frozen for 5 seconds!');if(mode==='host'&&e.type==='grow'){$('hostStatus').textContent=(snapshot?.players.find(p=>p.id===e.id)?.name||'Frog')+' played '+e.word.toUpperCase()+' (+'+e.points+')'}});
const q=new URLSearchParams(location.search);if(q.has('room')){$('joinCode').value=q.get('room').toUpperCase();$('name').value=q.get('name')||'';if(q.get('name'))$('join').click()}
