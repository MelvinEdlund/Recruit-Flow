-- Core ATS schema matching assignment specification

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade
);
alter table public.companies enable row level security;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.jobs enable row level security;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  linkedin_url text,
  job_id uuid not null references public.jobs (id) on delete cascade,
  stage text not null check (
    stage in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')
  ) default 'applied',
  created_at timestamptz not null default now()
);
alter table public.candidates enable row level security;

-- Minimal RLS policies to prepare for secure access.
-- You can refine these further in Supabase dashboard.

create policy "Users can read own profile" on public.profiles
  for select
  using (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
  for select
  using (role = 'admin');

