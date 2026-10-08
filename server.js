import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import wordListPath from 'word-list';
const app=express(),http=createServer(app),io=new Server(http);
app.use(express.static('public'));
const dictionary=new Set(fs.readFileSync(wordListPath,'utf8').toLowerCase().split(/\r?\n/));
const vowels='aeiou';
const sets=[...new Set([...dictionary].filter(w=>w.length===10&&/^[a-z]+$/.test(w)).map(w=>[...new Set(w)].sort().join('')).filter(s=>s.length===7&&[...s].filter(c=>vowels.includes(c)).length===2))];
const rooms=new Map();
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GOAL=60;
function roomCode(){let c;do{c=Array.from({length:5},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('')}while(rooms.has(c));return c}
function view(r){return {code:r.code,status:r.status,letters:r.letters,goal:GOAL,winner:r.winner,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,boost:p.boost}))}}
function update(r){io.to(r.code).emit('state',view(r))}
function fail(cb,error){cb?.({ok:false,error})}
function scoreWord(w,boost){let points=w.length;if(w.length>=5)points+=3;if(w.length>=7)points+=4;if(w.length>=9)points+=5;if(boost||w.length>=10)points*=2;return points*3}
io.on('connection',s=>{
s.on('host:create',(_,cb)=>{const code=roomCode(),r={code,host:s.id,status:'lobby',letters:[],winner:null,players:new Map()};rooms.set(code,r);s.join(code);s.data.host=code;cb?.({ok:true,code});update(r)});
s.on('room:join',({code,name},cb)=>{const r=rooms.get(String(code).toUpperCase());if(!r)return fail(cb,'Room not found');if(r.status!=='lobby')return fail(cb,'Race already started');if(r.players.size>=12)return fail(cb,'Room full');const id=randomUUID();r.players.set(id,{id,name:String(name||'Frog').slice(0,20),score:0,boost:false,used:new Set(),powers:new Set(),freezeUntil:0});s.data.player={code:r.code,id};s.join(r.code);cb?.({ok:true,id,code:r.code});update(r)});
s.on('host:start',(_,cb)=>{const r=rooms.get(s.data.host);if(!r||r.host!==s.id)return fail(cb,'Host only');if(!r.players.size)return fail(cb,'Need a player');r.letters=[...sets[Math.floor(Math.random()*sets.length)]];r.status='playing';r.winner=null;for(const p of r.players.values()){p.score=0;p.boost=false;p.used.clear();p.powers.clear();p.freezeUntil=0}cb?.({ok:true});update(r)});
s.on('word:submit',({word},cb)=>{const info=s.data.player,r=rooms.get(info?.code),p=r?.players.get(info?.id);if(!p||r.status!=='playing')return fail(cb,'Race not active');if(Date.now()<p.freezeUntil)return fail(cb,'Frozen');const w=String(word||'').toLowerCase().trim();if(w.length<2||w.length>30||!dictionary.has(w)||![...w].every(c=>r.letters.includes(c)))return fail(cb,'Invalid word');if(p.used.has(w))return fail(cb,'Word already used');p.used.add(w);const points=scoreWord(w,p.boost);if(w.length>=10)p.boost=true;p.score+=points;io.to(r.code).emit('effect',{type:'grow',id:p.id,word:w,points});if(p.score>=GOAL){r.status='finished';r.winner=p.id}cb?.({ok:true,points,boost:p.boost});update(r)});
s.on('power:use',({type,target},cb)=>{const info=s.data.player,r=rooms.get(info?.code),p=r?.players.get(info?.id),t=r?.players.get(target);if(!p||!t||p.id===t.id||r.status!=='playing'||!['snap','freeze'].includes(type))return fail(cb,'Invalid target');if(p.powers.has(type))return fail(cb,'Already used');p.powers.add(type);if(type==='snap')t.score=Math.max(0,t.score-10);else t.freezeUntil=Date.now()+5000;io.to(r.code).emit('effect',{type,id:t.id});cb?.({ok:true});update(r)});
s.on('host:reset',(_,cb)=>{const r=rooms.get(s.data.host);if(!r||r.host!==s.id)return fail(cb,'Host only');r.status='lobby';r.winner=null;r.letters=[];cb?.({ok:true});update(r)});
s.on('disconnect',()=>{const hosted=s.data.host;if(hosted){const r=rooms.get(hosted);if(r?.host===s.id){io.to(hosted).emit('room:ended');rooms.delete(hosted)}}const info=s.data.player,r=rooms.get(info?.code);if(r?.status==='lobby'){r.players.delete(info.id);update(r)}});
});
http.listen(process.env.PORT||3000,()=>console.log('Ribbit ready'));
