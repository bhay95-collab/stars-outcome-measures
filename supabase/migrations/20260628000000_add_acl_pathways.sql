-- Migration: add_acl_pathways
-- Purpose:
--   Per-patient state for the ACL rehabilitation Phase Tracker (the tool's first
--   stateful, per-patient construct — all outcome data otherwise lives in the
--   stateless `assessments` table). One pathway row tracks which criterion-based
--   rehab phase a patient is in and the history of phase advances. The objective
--   gate tests (quad LSI, hop battery, etc.) are NOT duplicated here — the UI
--   reads the latest `assessments` rows and evaluates gates on the fly.
--
-- Access logic (mirrors followup_requests):
--   - RLS enabled; authenticated users may only touch their own rows
--     (user_id = auth.uid()) and only with active access
--     (public.user_has_active_access()). Insert also verifies the patient
--     belongs to the user.
--
-- Deploy order: apply this migration BEFORE deploying the web build that reads
--   or writes public.acl_pathways.

BEGIN;

CREATE TABLE IF NOT EXISTS public.acl_pathways (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id    UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  pathway_type  TEXT        NOT NULL DEFAULT 'surgical'
                            CHECK (pathway_type IN ('surgical', 'conservative')),
  index_date    DATE,       -- surgery date (surgical) or injury date (conservative)
  graft_type    TEXT,
  current_phase SMALLINT    NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 6),
  phase_history JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One pathway per patient in v1.
  CONSTRAINT acl_pathways_one_per_patient UNIQUE (user_id, patient_id)
);

CREATE INDEX IF NOT EXISTS acl_pathways_user_patient_idx
  ON public.acl_pathways (user_id, patient_id);

ALTER TABLE public.acl_pathways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acl_pathways_select_gated" ON public.acl_pathways;
DROP POLICY IF EXISTS "acl_pathways_insert_gated" ON public.acl_pathways;
DROP POLICY IF EXISTS "acl_pathways_update_gated" ON public.acl_pathways;
DROP POLICY IF EXISTS "acl_pathways_delete_gated" ON public.acl_pathways;

CREATE POLICY "acl_pathways_select_gated"
ON public.acl_pathways FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "acl_pathways_insert_gated"
ON public.acl_pathways FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (SELECT public.user_has_active_access())
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "acl_pathways_update_gated"
ON public.acl_pathways FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()))
WITH CHECK (
  user_id = auth.uid()
  AND (SELECT public.user_has_active_access())
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "acl_pathways_delete_gated"
ON public.acl_pathways FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

COMMIT;
