-- Migration: extend_followups_for_questionnaires
-- Purpose:
--   Link public follow-up requests to a patient-reported questionnaire
--   and the assessment row created when the patient submits it.

BEGIN;

ALTER TABLE public.followup_requests
  ADD COLUMN IF NOT EXISTS measure_id text,
  ADD COLUMN IF NOT EXISTS source_assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL;

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_measure_id_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_measure_id_check
  CHECK (
    measure_id IS NULL
    OR measure_id IN ('ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI')
  );

CREATE INDEX IF NOT EXISTS followup_requests_measure_created_idx
ON public.followup_requests (user_id, patient_id, measure_id, created_at DESC);

CREATE INDEX IF NOT EXISTS followup_requests_completed_assessment_idx
ON public.followup_requests (completed_assessment_id)
WHERE completed_assessment_id IS NOT NULL;

COMMENT ON COLUMN public.followup_requests.measure_id IS
  'Eligible patient-reported questionnaire measure requested for this public follow-up link.';

COMMENT ON COLUMN public.followup_requests.source_assessment_id IS
  'Clinician-recorded assessment that made this questionnaire eligible for patient follow-up.';

COMMENT ON COLUMN public.followup_requests.completed_assessment_id IS
  'Patient-reported assessment inserted after the public follow-up link is submitted.';

COMMIT;
