-- Ascendom, hardening after the 2026-11-09 security review.
--
-- Every value below is written by a signed-in player's own client, so the
-- database bounds what it will store instead of trusting the app.

-- Push subscriptions only go to the real browser push services. The Edge
-- Function checks this too (`_shared/pushEndpoint.ts`); this stops a bad row
-- from being filed in the first place.
create or replace function public.register_push_subscription(
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

  if length(p_endpoint) > 2048
     or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
     or length(p_p256dh) not between 1 and 256
     or length(p_auth) not between 1 and 64 then
    raise exception 'invalid push subscription';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth;
end;
$$;

-- Drop any row filed before this check existed that the check would refuse.
delete from public.push_subscriptions
where endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/';

-- A browser can file at most a handful of subscriptions per player.
create function public.limit_push_subscriptions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.push_subscriptions where user_id = new.user_id) >= 10 then
    raise exception 'too many push subscriptions';
  end if;
  return new;
end;
$$;

create trigger push_subscriptions_limit before insert on public.push_subscriptions
  for each row execute function public.limit_push_subscriptions();

-- A year of heavy play (ten quests a day) is well under 1 MB of logs, stored
-- compressed. 8 MB leaves years of headroom yet stops the table from being
-- used as free bulk storage.
alter table public.game_saves
  add constraint game_saves_size check (pg_column_size(data) < 8388608);

-- IANA zone names are short; anything else is not a zone.
alter table public.profiles
  add constraint profiles_timezone_shape check (length(timezone) between 1 and 64);
