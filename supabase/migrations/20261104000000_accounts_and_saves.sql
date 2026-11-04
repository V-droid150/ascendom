-- Ascendom, step 1: accounts and cloud saves.
--
-- The game stays local-first. The device keeps playing offline; the cloud
-- holds one save document per player so it can follow them across devices,
-- and a profile with what the server needs to act on their behalf (time zone
-- for reminders, a private token for the calendar feed).

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- IANA zone, e.g. 'Asia/Jakarta'. Reminders fire in the player's local time.
  timezone text not null default 'UTC',
  -- Secret part of the calendar feed URL. Regenerated to revoke an old link.
  calendar_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Players read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Players update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Every new account gets a profile, so the app never has to create one.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Game saves ----------------------------------------------------------------

create table public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- The same bundle the app's export produces: { app, version, game, settings }.
  data jsonb not null,
  -- Bundle format version, so the server can refuse a save it can't read.
  schema_version integer not null default 1,
  -- Doubles as the optimistic-concurrency token: a device only overwrites the
  -- save if it still matches the timestamp it last saw.
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

create policy "Players read their own save"
  on public.game_saves for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players create their own save"
  on public.game_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players update their own save"
  on public.game_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- updated_at is stamped by the database, never trusted from a client clock.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger game_saves_touch before update on public.game_saves
  for each row execute function public.touch_updated_at();

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
