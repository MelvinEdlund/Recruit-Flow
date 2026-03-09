# RecruitFlow – Mini ATS

RecruitFlow är ett litet, produktionsredo ATS (Applicant Tracking System) byggt för att snabbt kunna sättas i händerna på en första kund. Det är en single-page React‑app med Supabase som backend (auth + databas).

## Funktioner

- **Admin**
  - Skapa konton (både admin och kund).
  - Se alla kunder, deras companies, jobs och candidates.
  - Ta bort users, companies, jobs och candidates.
- **Kund**
  - Logga in via e‑post/lösenord.
  - Skapa companies och jobs.
  - Lägga till candidates med profilinfo (namn, e‑post, telefon, LinkedIn‑länk).
  - Se kandidater i en kompakt Kanban‑vy per jobb.
  - Filtrera på kandidatnamn.
  - Hantera sitt data i vyn `My data` (ta bort companies, jobs, candidates).

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn‑ui
- @tanstack/react-query
- Supabase (auth + Postgres)

## Kom igång lokalt

### Förutsättningar

- Node.js (LTS)
- Ett Supabase‑konto och ett projekt

### Installera beroenden

```sh
npm install
```

### Konfigurera Supabase

Skapa en `.env` i projektroten:

```env
VITE_SUPABASE_PROJECT_ID="din-project-id"
VITE_SUPABASE_URL="https://din-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="din-anon-nyckel"
```

1. Öppna Supabase‑dashboarden för projektet.
2. Kör SQL‑skriptet i `supabase/migrations/20260309085906_f68b5fcd-11bf-4095-b014-6cc55db6b802.sql` för att skapa tabellerna:
   - `profiles`, `companies`, `jobs`, `candidates`.
3. Skapa minst ett admin‑konto:
   - Lägg till en user under **Authentication → Users**.
   - Lägg till en rad i `profiles` med samma `id`, `email` och `role = 'admin'`.

### Utvecklingsserver

```sh
npm run dev
```

Öppna sedan URL:en som Vite skriver ut (t.ex. `http://localhost:5173`).

## Projektstruktur

- `src/components` – layout, Kanban‑board, UI‑komponenter.
- `src/pages` – `Login`, `Dashboard`, `JobDetail`, `Admin`, `Manage`, `NotFound`.
- `src/hooks` – t.ex. `useAuth` för Supabase‑auth + rollhantering.
- `src/lib` – `supabase.ts` som initierar Supabase‑klienten.
- `src/services` – data‑access lager, t.ex. `authService`, `jobService`, `candidateService`, `adminService`.
- `src/types` – delade typer inklusive genererade Supabase‑typer.

## Bygga för produktion

```sh
npm run build
```

Detta skapar en `dist/`‑mapp som kan deployas på t.ex. Netlify, Vercel eller GitHub Pages. Ingen Git‑remote eller CI‑konfiguration är inbakad, så du kan skapa ett nytt GitHub‑repo och pusha projektet dit som det är.
