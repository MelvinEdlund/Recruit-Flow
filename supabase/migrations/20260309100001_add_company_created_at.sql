-- Add created_at to companies (missing from initial schema)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
