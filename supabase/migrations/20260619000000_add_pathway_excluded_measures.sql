-- Migration: add_pathway_excluded_measures
-- Adds a per-patient list of measure IDs that a clinician has excluded from
-- the Smart Rehab Pathway. Excluded measures are filtered out of missing/due
-- calculations and the sidebar badge count.
-- Default is an empty JSON array so existing rows are unaffected.

BEGIN;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS pathway_excluded_measures JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
