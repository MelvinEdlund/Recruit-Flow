# RecruitFlow – Mini ATS

RecruitFlow är ett litet, produktionsredo ATS (Applicant Tracking System) byggt för att snabbt kunna sättas i händerna på en första kund. Det är en single-page React‑app med Supabase som backend (auth + databas).

## Funktioner

- **Admin**
  - Skapa konton (både admin och kund).
  - Se alla kunder, deras companies, jobs och candidates.
  - Ta bort users, companies, jobs och candidates.
  - **Agera som kund** – klicka "Act as" bredvid en kund för att se exakt vad kunden ser och arbeta på deras behalf.
- **Kund**
  - Logga in via e‑post/lösenord.
  - Skapa companies och jobs.
  - Lägga till candidates med profilinfo (namn, e‑post, telefon, LinkedIn‑länk).
  - Se kandidater i en kompakt Kanban‑vy (per jobb eller alla jobb samlat).
  - Filtrera Kanban på jobb och kandidatnamn.
  - Dra och släpp kandidater mellan stages.
  - Hantera sitt data i vyn `My data` (ta bort companies, jobs, candidates).

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn‑ui
- @tanstack/react-query
- @dnd-kit (drag & drop)
- Supabase (auth + Postgres + RLS)

---

## Kom igång lokalt

### 1. Förutsättningar

- Node.js (LTS)
- Ett [Supabase](https://supabase.com)-konto och ett nytt projekt

### 2. Installera beroenden

```sh
npm install
```

### 3. Konfigurera miljövariabler

Kopiera exempelfilen och fyll i dina Supabase‑uppgifter:

```sh
cp .env.example .env
```

Öppna `.env` och ersätt värdena med dina egna:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Hitta värdena i Supabase Dashboard under **Project Settings → API**.

### 4. Sätt upp databasen

Öppna **SQL Editor** i Supabase Dashboard och kör följande SQL‑skript i ordning:

---

#### Migration 1 – Tabeller, RLS‑policies & enum

```sql
-- Core ATS schema

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

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
  for select using (role = 'admin');
```

---

#### Migration 2 – RLS‑policies för companies, jobs och candidates

```sql
-- Companies: ägaren kan läsa/skriva; admin kan allt
create policy "Owner can manage their companies" on public.companies
  for all using (auth.uid() = owner_id);

create policy "Admins can manage all companies" on public.companies
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Jobs: via company ownership
create policy "Owner can manage their jobs" on public.jobs
  for all using (
    exists (
      select 1 from public.companies
      where id = jobs.company_id and owner_id = auth.uid()
    )
  );

create policy "Admins can manage all jobs" on public.jobs
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Candidates: via job → company ownership
create policy "Owner can manage their candidates" on public.candidates
  for all using (
    exists (
      select 1 from public.jobs j
      join public.companies c on c.id = j.company_id
      where j.id = candidates.job_id and c.owner_id = auth.uid()
    )
  );

create policy "Admins can manage all candidates" on public.candidates
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

---

#### Migration 3 – Funktion för att ta bort användare (admin only)

```sql
create or replace function public.delete_user(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role != 'admin' then
    raise exception 'Only admins can delete users';
  end if;
  delete from auth.users where id = user_id;
end;
$$;

grant execute on function public.delete_user(uuid) to authenticated;
```

---

#### Migration 4 – Lägg till created_at på companies

```sql
alter table public.companies
  add column if not exists created_at timestamptz not null default now();
```

---

### 5. Skapa ditt första admin‑konto

1. Gå till **Authentication → Users** i Supabase Dashboard.
2. Klicka **Add user** och skapa en användare med e‑post och lösenord.
3. Kopiera det nya användar‑ID:t (UUID).
4. Kör följande SQL (ersätt värdena):

```sql
insert into public.profiles (id, email, role)
values ('ditt-user-id-här', 'admin@example.com', 'admin');
```

### 6. Starta utvecklingsservern

```sh
npm run dev
```

Öppna URL:en som Vite skriver ut (t.ex. `http://localhost:5173`).

---

## Projektstruktur

```
src/
  components/   – AppLayout, KanbanBoard, KanbanColumn, CandidateCard, UI-komponenter
  hooks/        – useAuth (Supabase auth + rollhantering + impersonation)
  lib/          – supabase.ts (klient)
  pages/        – Login, Dashboard, Kanban, JobDetail, Admin, Manage
  services/     – authService, jobService, candidateService, adminService
  types/        – database.ts (genererade Supabase-typer)
supabase/
  migrations/   – SQL-migrationsfiler
```

## Bygga för produktion

```sh
npm run build
```

Skapar en `dist/`‑mapp redo att deployas på Netlify, Vercel eller GitHub Pages.
