-- Migration: add_profiles_clinical_focus
-- Purpose:
--   Store the clinician's workspace focus (Neuro/Rehab, MSK, or Both).
--   Used to filter the measure picker and sidebar tools to the clinician's
--   discipline. It never gates patient data — recorded assessments always
--   render regardless of focus.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clinical_focus text NOT NULL DEFAULT 'both';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_clinical_focus_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_clinical_focus_check
  CHECK (clinical_focus IN ('rehab', 'msk', 'both'));

COMMIT;
