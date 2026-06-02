-- Migration: extend_leads_for_pilot
-- Purpose:
--   Add fields to public.leads to support pilot programme applications
--   submitted at /pilot. Existing reference-card rows are unaffected
--   (new columns are nullable).

BEGIN;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS clinic   TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS caseload TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS message  TEXT;

COMMIT;
