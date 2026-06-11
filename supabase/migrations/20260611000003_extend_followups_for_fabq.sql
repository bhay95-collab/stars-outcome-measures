-- Migration: extend_followups_for_fabq
-- Purpose:
--   Allow the Wave 2 Fear-Avoidance Beliefs Questionnaire (FABQ) to be sent as
--   a follow-up link. Must stay in sync with FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS
--   in lib/followupQuestionnaires.js.

BEGIN;

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_measure_id_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_measure_id_check
  CHECK (
    measure_id IS NULL
    OR measure_id IN ('ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI', 'NPRS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'CAIT', 'ATRS', 'FABQ')
  );

COMMIT;
