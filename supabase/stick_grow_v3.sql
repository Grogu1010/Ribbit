-- Stick Grow v3: permissive words, one-screen controllers, and much faster rounds.
-- Run this after supabase/stick_grow_v2.sql in the Supabase SQL Editor.
--
-- Word policy is intentionally broad: any 2-30 letter sequence made only from
-- the round's seven letters is accepted. There is no profanity/content filter
-- and the small ribbit_words starter table is no longer used for validation.
-- Duplicate words by the same player in the same round are still blocked.
--
-- Scoring uses the v2 length/bonus formula, then multiplies the result by 3.

alter table public.ribbit_rooms alter column goal set default 60;
update public.ribbit_rooms set goal = 60 where status in ('lobby','finished');

create or replace function public.ribbit_action(
  p_action text,
  p_code text default null,
  p_token text default null,
  p_name text default null,
  p_word text default null,
  p_target uuid default null,
  p_power text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
        insert into public.ribbit_rooms(code,goal) values(v_code,60) returning * into r;
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;

    if r.code is null then
      raise exception 'Could not create a room. Try again.';
    end if;

    insert into public.ribbit_updates(room_code) values(r.code);
    return jsonb_build_object('code',r.code,'token',r.host_token);
  end if;

  if v_code !~ '^[A-Z0-9]{5}$' then
    raise exception 'Enter a valid five-character room code.';
  end if;

  select * into r from public.ribbit_rooms where code=v_code for update;
  if not found then
    raise exception 'Room not found.';
  end if;

  if p_action = 'join' then
    if r.status <> 'lobby' then
      raise exception 'This race has already started.';
    end if;
    if length(trim(coalesce(p_name,''))) < 1 or length(trim(p_name)) > 20 then
      raise exception 'Name must be 1–20 characters.';
    end if;

    select count(*) into v_count from public.ribbit_players where room_code=v_code;
    if v_count >= 12 then
      raise exception 'Room is full.';
    end if;

    insert into public.ribbit_players(room_code,name)
      values(v_code,trim(p_name))
      returning * into p;

    update public.ribbit_updates set version=version+1 where room_code=v_code;
    return jsonb_build_object('code',v_code,'id',p.id,'token',p.player_token);
  end if;

  if p_action <> 'state' then
    begin
      v_token := p_token::uuid;
    exception when others then
      raise exception 'Invalid session. Rejoin the room.';
    end;
  end if;

  -- A host refresh/restart can explicitly destroy its previous room.
  if p_action = 'end' then
    if r.host_token is distinct from v_token then
      raise exception 'Host access required.';
    end if;

    -- Wake connected players so their next state request immediately sees that
    -- the room is gone, then clean the per-round used-word rows as well.
    update public.ribbit_updates set version=version+1 where room_code=v_code;
    delete from public.ribbit_used_words where room_code=v_code;
    delete from public.ribbit_rooms where code=v_code;
    return jsonb_build_object('ok',true);
  end if;

  if p_action in ('start','reset') then
    if r.host_token is distinct from v_token then
      raise exception 'Host access required.';
    end if;

    if p_action = 'start' then
      if r.status <> 'lobby' then
        raise exception 'Race is not in lobby.';
      end if;

      select count(*) into v_count from public.ribbit_players where room_code=v_code;
      if v_count = 0 then
        raise exception 'At least one player must join.';
      end if;

      v_letters := case when random()<0.5 then 'BEKOPRS' else 'ACDORST' end;

      update public.ribbit_rooms
      set status='playing',letters=v_letters,goal=60,round=round+1,winner=null
      where code=v_code;

      update public.ribbit_players
      set score=0,boost=false,snap_used=false,freeze_used=false,frozen_until=null
      where room_code=v_code;
    else
      if r.status <> 'finished' then
        raise exception 'Race has not finished.';
      end if;

      update public.ribbit_rooms
      set status='lobby',letters='',winner=null,goal=60
      where code=v_code;
    end if;

    update public.ribbit_updates set version=version+1 where room_code=v_code;
    return jsonb_build_object('ok',true);
  end if;

  if p_action in ('word','power') then
    if r.status <> 'playing' then
      raise exception 'Race is not running.';
    end if;

    select * into p
    from public.ribbit_players
    where room_code=v_code and player_token=v_token
    for update;

    if not found then
      raise exception 'Player session not found.';
    end if;

    if p_action='word' then
      if p.frozen_until is not null and p.frozen_until > now() then
        raise exception 'Frozen! Wait a moment.';
      end if;

      if length(v_word) < 2 or length(v_word) > 30 or v_word !~ '^[a-z]+$' then
        raise exception 'Use 2–30 letters.';
      end if;

      if exists (
        select 1
        from regexp_split_to_table(v_word,'') c
        where position(upper(c) in r.letters)=0
      ) then
        raise exception 'Use only the seven letters.';
      end if;

      -- Deliberately no ribbit_words lookup here. The game accepts any letter
      -- sequence the players consider a word, including slang and profanity.
      insert into public.ribbit_used_words(room_code,round,player_id,word)
      values(v_code,r.round,p.id,v_word)
      on conflict do nothing;

      if not found then
        raise exception 'You already played that word.';
      end if;

      -- v2 scoring, then tripled:
      -- 2–4 letters: length
      -- 5–6 letters: length + 3
      -- 7–8 letters: length + 7
      -- 9+ letters: length + 12
      -- 10+ letters also unlocks permanent x2, including that word.
      v_points := length(v_word);
      if length(v_word) >= 5 then
        v_points := v_points + 3;
      end if;
      if length(v_word) >= 7 then
        v_points := v_points + 4;
      end if;
      if length(v_word) >= 9 then
        v_points := v_points + 5;
      end if;
      if p.boost or length(v_word) >= 10 then
        v_points := v_points * 2;
      end if;
      v_points := v_points * 3;

      update public.ribbit_players
      set score=score+v_points,
          boost=boost or length(v_word)>=10
      where id=p.id;

      if p.score+v_points >= r.goal then
        update public.ribbit_rooms
        set status='finished',winner=p.id
        where code=v_code;
      end if;

      v_result := jsonb_build_object(
        'points',v_points,
        'boost',p.boost or length(v_word)>=10
      );
    else
      if p_target is null or p_target=p.id then
        raise exception 'Choose another player.';
      end if;

      select * into t
      from public.ribbit_players
      where id=p_target and room_code=v_code
      for update;

      if not found then
        raise exception 'Player not found.';
      end if;

      if p_power='snap' then
        if p.snap_used then
          raise exception 'Snap already used.';
        end if;

        update public.ribbit_players
        set score=greatest(0,score-10)
        where id=t.id;

        update public.ribbit_players
        set snap_used=true
        where id=p.id;
      elsif p_power='freeze' then
        if p.freeze_used then
          raise exception 'Freeze already used.';
        end if;

        update public.ribbit_players
        set frozen_until=greatest(coalesce(frozen_until,now()),now())+interval '5 seconds'
        where id=t.id;

        update public.ribbit_players
        set freeze_used=true
        where id=p.id;
      else
        raise exception 'Unknown power.';
      end if;

      v_result := jsonb_build_object('ok',true);
    end if;

    update public.ribbit_updates set version=version+1 where room_code=v_code;
    return v_result;
  end if;

  if p_action='state' then
    return (
      select jsonb_build_object(
        'code',r.code,
        'status',r.status,
        'letters',to_jsonb(regexp_split_to_array(r.letters,'')),
        'goal',r.goal,
        'winner',r.winner,
        'players',coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id',x.id,
              'name',x.name,
              'score',x.score,
              'boost',x.boost,
              'snapUsed',x.snap_used,
              'freezeUsed',x.freeze_used,
              'frozenUntil',x.frozen_until
            )
            order by x.name
          ) filter(where x.id is not null),
          '[]'::jsonb
        )
      )
      from public.ribbit_players x
      where x.room_code=v_code
    );
  end if;

  raise exception 'Unknown action.';
end
$$;

revoke all on function public.ribbit_action(text,text,text,text,text,uuid,text) from public;
grant execute on function public.ribbit_action(text,text,text,text,text,uuid,text) to anon, authenticated;
