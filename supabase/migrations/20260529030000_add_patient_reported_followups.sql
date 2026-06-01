-- Migration: add_patient_reported_followups
-- Purpose:
--   Store clinician-created patient-reported follow-up links and
--   patient-submitted core weekly check-in responses.
--
-- Public patient submission is handled only through server API routes with
-- the service-role client. The anon role receives no table access.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.followup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  due_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK (expires_at > created_at),
  CHECK (due_at >= created_at - interval '1 day')
);

CREATE TABLE IF NOT EXISTS public.followup_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.followup_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  falls_count integer NOT NULL CHECK (falls_count >= 0 AND falls_count <= 99),
  confidence_score integer NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 10),
  fatigue_score integer NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 10),
  symptoms_change text NOT NULL CHECK (symptoms_change IN ('better', 'same', 'worse')),
  adherence_level text NOT NULL CHECK (adherence_level IN ('all', 'most', 'some', 'none', 'not_applicable')),
  global_status text NOT NULL CHECK (global_status IN ('better', 'same', 'worse')),
  concern_text text NOT NULL DEFAULT '' CHECK (char_length(concern_text) <= 1000),
  attention_level text NOT NULL CHECK (attention_level IN ('green', 'amber', 'red')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS followup_requests_user_patient_created_idx
ON public.followup_requests (user_id, patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS followup_responses_user_patient_created_idx
ON public.followup_responses (user_id, patient_id, created_at DESC);

ALTER TABLE public.followup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "followup_requests_select_gated" ON public.followup_requests;
DROP POLICY IF EXISTS "followup_requests_insert_gated" ON public.followup_requests;
DROP POLICY IF EXISTS "followup_requests_update_gated" ON public.followup_requests;
DROP POLICY IF EXISTS "followup_requests_delete_gated" ON public.followup_requests;
DROP POLICY IF EXISTS "followup_responses_select_gated" ON public.followup_responses;
DROP POLICY IF EXISTS "followup_responses_insert_gated" ON public.followup_responses;
DROP POLICY IF EXISTS "followup_responses_update_gated" ON public.followup_responses;
DROP POLICY IF EXISTS "followup_responses_delete_gated" ON public.followup_responses;

CREATE POLICY "followup_requests_select_gated"
ON public.followup_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "followup_requests_insert_gated"
ON public.followup_requests FOR INSERT TO authenticated
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

CREATE POLICY "followup_requests_update_gated"
ON public.followup_requests FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "followup_requests_delete_gated"
ON public.followup_requests FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "followup_responses_select_gated"
ON public.followup_responses FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "followup_responses_insert_gated"
ON public.followup_responses FOR INSERT TO authenticated
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

CREATE POLICY "followup_responses_update_gated"
ON public.followup_responses FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "followup_responses_delete_gated"
ON public.followup_responses FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

COMMIT;
