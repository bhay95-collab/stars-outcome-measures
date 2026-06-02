-- Migration: add_leads_table
-- Purpose:
--   Capture email leads from the public-facing "Free Reference Card" download
--   on /reference-card, and any future ungated content offers.
--
-- Access logic:
--   - Inserts come from the service-role client in pages/api/reference-card.js.
--   - RLS is enabled and NO policies are defined, so anon/authenticated clients
--     cannot read or write the table. Only service-role can access it, used
--     server-side via supabase-admin.

BEGIN;

CREATE TABLE IF NOT EXISTS public.leads (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL,
  name         TEXT        NOT NULL,
  role         TEXT,
  source       TEXT        NOT NULL DEFAULT 'reference-card',
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address   INET,
  user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS leads_email_idx       ON public.leads (lower(email));
CREATE INDEX IF NOT EXISTS leads_captured_at_idx ON public.leads (captured_at DESC);
CREATE INDEX IF NOT EXISTS leads_source_idx      ON public.leads (source);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

COMMIT;
