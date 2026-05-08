-- Hip Hop Coach App — Initial Schema
-- Applied via Supabase SQL Editor 2026-05-08

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  artist_name text,
  preferred_style text,
  subscription_status text not null default 'free' check (subscription_status in ('free','trial','active','cancelled')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('yung_bing','hustle_flow','open_genre')),
  input_type text not null check (input_type in ('bars','audio')),
  bars text not null,
  audio_metadata jsonb,
  artist_ref text,
  style text,
  coaching_response text not null,
  otr_score numeric(3,1),
  pillar_scores jsonb,
  created_at timestamptz not null default now()
);

create index sessions_user_id_created_at_idx on public.sessions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, subscription_status)
  values (new.id, coalesce(new.email, ''), 'free');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
