
-- Profile enum
do $$ begin
  create type public.user_profile as enum (
    'entrepreneur',
    'entreprise',
    'agence_publique',
    'institution_financiere',
    'association',
    'investisseur',
    'prestataire',
    'competence',
    'ecole_universite'
  );
exception when duplicate_object then null; end $$;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  profile public.user_profile not null,
  country text,
  data_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grants (PostgREST requires explicit grants)
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile from auth.users metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_profile text;
  resolved_profile public.user_profile;
begin
  meta_profile := coalesce(new.raw_user_meta_data->>'profile', 'entrepreneur');
  begin
    resolved_profile := meta_profile::public.user_profile;
  exception when invalid_text_representation then
    resolved_profile := 'entrepreneur'::public.user_profile;
  end;

  insert into public.profiles (id, first_name, last_name, phone, profile, country)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    resolved_profile,
    nullif(new.raw_user_meta_data->>'country', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
