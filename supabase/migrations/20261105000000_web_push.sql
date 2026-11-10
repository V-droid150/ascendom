-- Ascendom, step 2: Web Push reminders.
--
-- A browser can't wake itself up at 07:00, so on the web the server sends
-- reminders. Each browser that turns reminders on registers a push
-- subscription; every five minutes pg_cron calls the `send-reminders` Edge
-- Function, which reads each player's save, works out what is due in their
-- time zone, and pushes it.

-- Push subscriptions ----------------------------------------------------------

create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- One row per browser. The push service URL is unique to that browser.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Players read their own subscriptions"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

-- Writes go through these two functions rather than table policies, because a
-- browser that switches accounts has to move its row to the new player, and
-- RLS would (rightly) refuse to let one player update another's row.

create function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth;
end;
$$;

create function public.unregister_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions
  where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function public.register_push_subscription(text, text, text) from public, anon;
revoke execute on function public.unregister_push_subscription(text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text) to authenticated;
grant execute on function public.unregister_push_subscription(text) to authenticated;

-- Sent log ----------------------------------------------------------------------

-- The cron looks back over a window wider than its interval so a late run
-- never skips a reminder; this table is what stops the overlap from sending
-- one twice. Only the Edge Function (service role) touches it.
create table public.push_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key text not null,
  -- 'habit:<id>' or 'evening'.
  tag text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, day_key, tag)
);

alter table public.push_sent enable row level security;

-- Schedule ------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The shared secret lives in Vault, created once by hand:
--   select vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret');
-- It must match the CRON_SECRET secret of the Edge Function.
select cron.schedule(
  'send-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://uzlbqwncgptreitbtgwf.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'reminders_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
