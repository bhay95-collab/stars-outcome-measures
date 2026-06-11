-- Migration: extend_followups_for_ankle_questionnaires
-- Purpose:
--   Allow the Wave 2 patient-reported ankle/Achilles questionnaires (CAIT, ATRS)
--   to be sent as follow-up links. Must stay in sync with
--   FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS in lib/followupQuestionnaires.js.

BEGIN;

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_measure_id_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_measure_id_check
  CHECK (
    measure_id IS NULL
    OR measure_id IN ('ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI', 'NPRS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'CAIT', 'ATRS')
  );

COMMIT;
