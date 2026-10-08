-- Run this entire file once in Supabase SQL Editor.
-- Ribbit multiplayer: no public writes to scores, rooms, or players.
create table if not exists public.ribbit_rooms (
 code text primary key, host_token uuid not null default gen_random_uuid(),
 status text not null default 'lobby' check (status in ('lobby','playing','finished')),
 letters text not null default '', goal integer not null default 180,
 winner uuid, round integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.ribbit_players (
 id uuid primary key default gen_random_uuid(),
 room_code text not null references public.ribbit_rooms(code) on delete cascade,
 player_token uuid not null default gen_random_uuid(),
 name text not null, score integer not null default 0,
 boost boolean not null default false, snap_used boolean not null default false,
 freeze_used boolean not null default false, frozen_until timestamptz,
 unique(room_code,player_token)
);
create table if not exists public.ribbit_used_words (
 room_code text not null, round integer not null, player_id uuid not null,
 word text not null, primary key(room_code,round,player_id,word)
);
create table if not exists public.ribbit_words (word text primary key);
-- Curated starter dictionary. Expand this table with a licensed word list.
insert into public.ribbit_words(word) values
('bookkeeper'),('bookkeepers'),('book'),('books'),('keeper'),('keep'),('keeps'),
('seek'),('seeker'),('peep'),('peeper'),('rope'),('rose'),('sore'),('bore'),
('broke'),('broker'),('probe'),('probes'),('poker'),('pokes'),('poke'),
('spoke'),('spokes'),('spook'),('spooks'),('spree'),('sober'),('robe'),
('robes'),('beep'),('beeps'),('beeper'),('peers'),('peer'),('peek'),
('peeks'),('pore'),('pores'),('rebook'),('rebooks'),('repeeks'),
('crossroads'),('crossroad'),('cross'),('road'),('roads'),('roast'),
('roasts'),('toast'),('toasts'),('cost'),('costs'),('coast'),('coasts'),
('cast'),('casts'),('cart'),('carts'),('card'),('cards'),('scar'),
('scars'),('star'),('stars'),('start'),('starts'),('toss'),('sort'),
('sorts'),('sorter'),('sorters'),('door'),('doors'),('odor'),('odors'),
('soda'),('sodas'),('sard'),('dart'),('darts'),('data'),('taco'),('tacos')
on conflict do nothing;
create table if not exists public.ribbit_updates (
 room_code text primary key references public.ribbit_rooms(code) on delete cascade,
 version bigint not null default 0
);
alter table public.ribbit_rooms enable row level security;
alter table public.ribbit_players enable row level security;
alter table public.ribbit_used_words enable row level security;
alter table public.ribbit_words enable row level security;
alter table public.ribbit_updates enable row level security;
drop policy if exists "Ribbit realtime room ticks" on public.ribbit_updates;
create policy "Ribbit realtime room ticks" on public.ribbit_updates for select to anon, authenticated using (true);
revoke all on public.ribbit_rooms, public.ribbit_players, public.ribbit_used_words, public.ribbit_words, public.ribbit_updates from anon, authenticated;
grant select on public.ribbit_updates to anon, authenticated;

create or replace function public.ribbit_action(p_action text, p_code text default null, p_token text default null, p_name text default null, p_word text default null, p_target uuid default null, p_power text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 r public.ribbit_rooms%rowtype;
 p public.ribbit_players%rowtype;
 t public.ribbit_players%rowtype;
 v_code text := upper(trim(coalesce(p_code,'')));
 v_token uuid;
 v_word text := lower(trim(coalesce(p_word,'')));
 v_points integer;
 v_letters text;
 v_count integer;
 v_result jsonb;
begin
 if p_action = 'create' then
   for i in 1..12 loop
     v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
     begin
       insert into public.ribbit_rooms(code) values(v_code) returning * into r;
       exit;
     exception when unique_violation then null;
     end;
   end loop;
   if r.code is null then raise exception 'Could not create a room. Try again.'; end if;
   insert into public.ribbit_updates(room_code) values(r.code);
   return jsonb_build_object('code',r.code,'token',r.host_token);
 end if;
 if v_code !~ '^[A-Z0-9]{5}$' then raise exception 'Enter a valid five-character room code.'; end if;
 select * into r from public.ribbit_rooms where code=v_code for update;
 if not found then raise exception 'Room not found.'; end if;
 if p_action = 'join' then
   if r.status <> 'lobby' then raise exception 'This race has already started.'; end if;
   if length(trim(coalesce(p_name,''))) < 1 or length(trim(p_name)) > 20 then raise exception 'Name must be 1–20 characters.'; end if;
   select count(*) into v_count from public.ribbit_players where room_code=v_code;
   if v_count >= 12 then raise exception 'Room is full.'; end if;
   insert into public.ribbit_players(room_code,name) values(v_code,trim(p_name)) returning * into p;
   update public.ribbit_updates set version=version+1 where room_code=v_code;
   return jsonb_build_object('code',v_code,'id',p.id,'token',p.player_token);
 end if;
 if p_action <> 'state' then
   begin v_token := p_token::uuid; exception when others then raise exception 'Invalid session. Rejoin the room.'; end;
 end if;
 if p_action in ('start','reset') then
   if r.host_token is distinct from v_token then raise exception 'Host access required.'; end if;
   if p_action = 'start' then
     if r.status <> 'lobby' then raise exception 'Race is not in lobby.'; end if;
     select count(*) into v_count from public.ribbit_players where room_code=v_code;
     if v_count = 0 then raise exception 'At least one player must join.'; end if;
     -- Both pools contain exactly two vowels and five consonants,
     -- and each has a curated 10-letter word.
     v_letters := case when random()<0.5 then 'BEKOPRS' else 'ACDORST' end;
     update public.ribbit_rooms set status='playing',letters=v_letters,round=round+1,winner=null where code=v_code;
     update public.ribbit_players set score=0,boost=false,snap_used=false,freeze_used=false,frozen_until=null where room_code=v_code;
   else
     if r.status <> 'finished' then raise exception 'Race has not finished.'; end if;
     update public.ribbit_rooms set status='lobby',letters='',winner=null where code=v_code;
   end if;
   update public.ribbit_updates set version=version+1 where room_code=v_code;
   return jsonb_build_object('ok',true);
 end if;
 if p_action in ('word','power') then
   if r.status <> 'playing' then raise exception 'Race is not running.'; end if;
   select * into p from public.ribbit_players where room_code=v_code and player_token=v_token for update;
   if not found then raise exception 'Player session not found.'; end if;
   if p_action='word' then
     if p.frozen_until is not null and p.frozen_until > now() then raise exception 'Frozen! Wait a moment.'; end if;
     if length(v_word) < 2 or length(v_word) > 30 or v_word !~ '^[a-z]+$' then raise exception 'Enter a word of 2–30 letters.'; end if;
     if exists (select 1 from regexp_split_to_table(v_word,'') c where position(upper(c) in r.letters)=0) then raise exception 'Use only the seven letters.'; end if;
     if not exists(select 1 from public.ribbit_words where word=v_word) then raise exception 'Word not in dictionary.'; end if;
     insert into public.ribbit_used_words(room_code,round,player_id,word)
       values(v_code,r.round,p.id,v_word) on conflict do nothing;
     if not found then raise exception 'You already played that word.'; end if;
     v_points := length(v_word) * (case when p.boost or length(v_word)>=10 then 2 else 1 end);
     update public.ribbit_players set score=score+v_points,boost=boost or length(v_word)>=10 where id=p.id;
     if p.score+v_points >= r.goal then
       update public.ribbit_rooms set status='finished',winner=p.id where code=v_code;
     end if;
     v_result := jsonb_build_object('points',v_points,'boost',p.boost or length(v_word)>=10);
   else
     if p_target is null or p_target=p.id then raise exception 'Choose another player.'; end if;
     select * into t from public.ribbit_players where id=p_target and room_code=v_code for update;
     if not found then raise exception 'Player not found.'; end if;
     if p_power='snap' then
       if p.snap_used then raise exception 'Snap already used.'; end if;
       update public.ribbit_players set score=greatest(0,score-15) where id=t.id;
       update public.ribbit_players set snap_used=true where id=p.id;
     elsif p_power='freeze' then
       if p.freeze_used then raise exception 'Freeze already used.'; end if;
       update public.ribbit_players set frozen_until=greatest(coalesce(frozen_until,now()),now())+interval '5 seconds' where id=t.id;
       update public.ribbit_players set freeze_used=true where id=p.id;
     else raise exception 'Unknown power.'; end if;
     v_result := jsonb_build_object('ok',true);
   end if;
   update public.ribbit_updates set version=version+1 where room_code=v_code;
   return v_result;
 end if;
 if p_action='state' then
   return (select jsonb_build_object(
     'code',r.code,'status',r.status,'letters',to_jsonb(regexp_split_to_array(r.letters,'')),
     'goal',r.goal,'winner',r.winner,
     'players',coalesce(jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'score',x.score,'boost',x.boost,
       'snapUsed',x.snap_used,'freezeUsed',x.freeze_used,'frozenUntil',x.frozen_until) order by x.name) filter(where x.id is not null),'[]'::jsonb)
   ) from public.ribbit_players x where x.room_code=v_code);
 end if;
 raise exception 'Unknown action.';
end $$;
revoke all on function public.ribbit_action(text,text,text,text,text,uuid,text) from public;
grant execute on function public.ribbit_action(text,text,text,text,text,uuid,text) to anon, authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ribbit_updates') then
   alter publication supabase_realtime add table public.ribbit_updates;
 end if;
end $$;
