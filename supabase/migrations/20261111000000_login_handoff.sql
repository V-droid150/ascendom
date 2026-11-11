-- Ascendom, Google sign-in for the app installed on an iPhone home screen.
--
-- That app can't finish an OAuth redirect (Google opens in a browser whose
-- storage it can't see), so sign-in is handed off through Safari:
--
--   1. The app makes a random id + secret and opens Safari on
--      /auth/handoff?id=<id>&h=<sha256(secret)>. Only the hash leaves the app.
--   2. In Safari the player signs in with Google and approves. That files the
--      handoff here against their account and shows a 6-digit code.
--   3. The player types the code into the app, which sends id + secret + code
--      to the redeem-login-handoff Edge Function. That claims the handoff
--      below and returns a one-time login token for the account.
--
-- The secret proves the redeemer is the app that started it; the code proves
-- the player who signed in is the one holding that app. Someone who tricks a
-- player into opening their link still never sees the code, which appears
-- only on the player's own screen.

create table public.login_handoffs (
  id uuid primary key,
  secret_hash text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  consumed_at timestamptz
);

create index login_handoffs_user_created on public.login_handoffs (user_id, created_at);

-- Nobody reads or writes the table directly; only the functions below do.
alter table public.login_handoffs enable row level security;
revoke all on public.login_handoffs from anon, authenticated;

-- Step 2: a signed-in player approves a handoff and gets its code.
create function public.approve_login_handoff(p_id uuid, p_secret_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_secret_hash is null or p_secret_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid handoff';
  end if;

  delete from public.login_handoffs where expires_at < now() - interval '1 day';

  if (
    select count(*) from public.login_handoffs
    where user_id = auth.uid() and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'too many handoffs';
  end if;

  v_code := lpad(
    (abs(('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text,
    6,
    '0'
  );

  -- Approving the same handoff again (a reload in Safari) issues a new code,
  -- but only for the same player and secret, and never resets the attempts.
  insert into public.login_handoffs (id, secret_hash, user_id, code_hash)
  values (
    p_id,
    p_secret_hash,
    auth.uid(),
    encode(extensions.digest(p_id::text || ':' || v_code, 'sha256'), 'hex')
  )
  on conflict (id) do update
    set code_hash = excluded.code_hash,
        expires_at = now() + interval '10 minutes'
    where public.login_handoffs.user_id = auth.uid()
      and public.login_handoffs.secret_hash = excluded.secret_hash
      and public.login_handoffs.consumed_at is null;

  if not found then
    raise exception 'handoff already used';
  end if;

  return v_code;
end;
$$;

revoke all on function public.approve_login_handoff(uuid, text) from public, anon;
grant execute on function public.approve_login_handoff(uuid, text) to authenticated;

-- Step 3: the Edge Function claims a handoff. Returns {status, user_id}.
-- status: ok | not_found | expired | locked | wrong_code
create function public.claim_login_handoff(p_id uuid, p_secret text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.login_handoffs;
begin
  select * into v_row from public.login_handoffs where id = p_id for update;

  -- A wrong secret looks exactly like a missing handoff and costs no attempt,
  -- so nobody without the secret can lock a player out.
  if not found
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v_row.secret_hash then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_row.consumed_at is not null or v_row.expires_at < now() then
    return jsonb_build_object('status', 'expired');
  end if;
  if v_row.attempts >= 5 then
    return jsonb_build_object('status', 'locked');
  end if;

  if encode(extensions.digest(p_id::text || ':' || p_code, 'sha256'), 'hex') <> v_row.code_hash then
    update public.login_handoffs set attempts = attempts + 1 where id = p_id;
    return jsonb_build_object('status', 'wrong_code');
  end if;

  update public.login_handoffs set consumed_at = now() where id = p_id;
  return jsonb_build_object('status', 'ok', 'user_id', v_row.user_id);
end;
$$;

revoke all on function public.claim_login_handoff(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_login_handoff(uuid, text, text) to service_role;
