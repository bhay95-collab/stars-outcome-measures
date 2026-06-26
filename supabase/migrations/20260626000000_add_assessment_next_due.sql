-- Migration: add_assessment_next_due
-- Purpose: Let clinicians set an explicit reassessment date when recording an
--          encounter. The directory follow-up panel falls back to
--          created_at + 28 days when this column is null.

BEGIN;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS next_assessment_at timestamptz;

COMMENT ON COLUMN public.assessments.next_assessment_at IS
  'Clinician-set target date for the next reassessment. NULL means fall back to the 28-day default.';

COMMIT;
