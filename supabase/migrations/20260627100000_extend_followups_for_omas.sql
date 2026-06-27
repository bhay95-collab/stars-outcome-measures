-- Migration: extend_followups_for_omas
-- Purpose:
--   Allow the Olerud–Molander Ankle Score (OMAS) to be sent as a follow-up
--   link. Must stay in sync with FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS in
--   lib/followupQuestionnaires.js (both edited in the same commit).
-- Deploy order: apply this migration BEFORE deploying the web build that lists
--   OMAS as an eligible follow-up measure.

BEGIN;

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_measure_id_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_measure_id_check
  CHECK (
    measure_id IS NULL
    OR measure_id IN ('ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI', 'NPRS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'HAGOS', 'CAIT', 'ATRS', 'FABQ', 'OMAS')
  );

COMMIT;
