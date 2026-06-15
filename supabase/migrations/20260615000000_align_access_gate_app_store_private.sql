-- Migration: align_access_gate_app_store_private
-- Date:      2026-06-15
-- Applied:   2026-06-15 — the private.user_has_active_access() body was first
--            corrected manually in production via the Supabase SQL editor while
--            diagnosing missing patients for an App Store subscriber; this
--            migration captures that fix and reconciles the repo with production.
--
-- Purpose:
--   Two problems are fixed here:
--
--   1. App Store subscribers lost access to their own clinical data once their
--      trial expired. The access-gate helper only recognised an active trial or
--      an active Stripe subscription, so RLS returned zero rows for users whose
--      access came from an Apple In-App Purchase — even though the app let them
--      in (the app's entry check reads app_store_subscriptions directly).
--
--   2. Schema drift. Production enforces the gated RLS policies through
--      private.user_has_active_access() (moved out of the API-exposed public
--      schema for hardening, outside this migration history), while the repo
--      still defined the helper as public.user_has_active_access(). A fresh
--      build therefore did not match production.
--
--   This migration makes the repo authoritative and matches production:
--     * Defines private.user_has_active_access() with trial + Stripe + App Store.
--     * Repoints every gated policy (patients, assessments, followup_requests,
--       followup_responses) to the private helper.
--     * Drops the now-unused public.user_has_active_access(), which also clears
--       the Supabase "SECURITY DEFINER executable via API" advisories
--       (lints 0028 / 0029).
--
-- Access logic (any one grants access):
--   Active trial:     profiles.trial_end_date              >= now()
--   Active Stripe:    subscriptions.status = 'active'      AND current_period_end >= now()
--   Active App Store: app_store_subscriptions.is_active    AND expiration_at      >= now()
--
-- SECURITY DEFINER + search_path = '' is required so the helper can read
-- profiles / subscriptions / app_store_subscriptions while evaluating RLS,
-- without granting those table reads to the authenticated role directly.
-- The helper lives in the private schema, which is not exposed by PostgREST,
-- so it is not callable as an API RPC.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.user_has_active_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.trial_end_date >= now()
  )
  or exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status = 'active'
      and s.current_period_end >= now()
  )
  or exists (
    select 1
    from public.app_store_subscriptions a
    where a.user_id = auth.uid()
      and a.is_active = true
      and a.expiration_at >= now()
  );
$$;

REVOKE EXECUTE ON FUNCTION private.user_has_active_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.user_has_active_access() TO authenticated;

-- ============================================================
-- Repoint gated policies to private.user_has_active_access()
-- (DROP + CREATE; definitions are unchanged except the schema-
--  qualified helper reference.)
-- ============================================================

-- patients ---------------------------------------------------
DROP POLICY IF EXISTS "patients_select_gated" ON public.patients;
CREATE POLICY "patients_select_gated"
ON public.patients FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "patients_insert_gated" ON public.patients;
CREATE POLICY "patients_insert_gated"
ON public.patients FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "patients_update_gated" ON public.patients;
CREATE POLICY "patients_update_gated"
ON public.patients FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "patients_delete_gated" ON public.patients;
CREATE POLICY "patients_delete_gated"
ON public.patients FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

-- assessments ------------------------------------------------
DROP POLICY IF EXISTS "assessments_select_gated" ON public.assessments;
CREATE POLICY "assessments_select_gated"
ON public.assessments FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "assessments_insert_gated" ON public.assessments;
CREATE POLICY "assessments_insert_gated"
ON public.assessments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "assessments_update_gated" ON public.assessments;
CREATE POLICY "assessments_update_gated"
ON public.assessments FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "assessments_delete_gated" ON public.assessments;
CREATE POLICY "assessments_delete_gated"
ON public.assessments FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

-- followup_requests ------------------------------------------
DROP POLICY IF EXISTS "followup_requests_select_gated" ON public.followup_requests;
CREATE POLICY "followup_requests_select_gated"
ON public.followup_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "followup_requests_insert_gated" ON public.followup_requests;
CREATE POLICY "followup_requests_insert_gated"
ON public.followup_requests FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (SELECT private.user_has_active_access())
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "followup_requests_update_gated" ON public.followup_requests;
CREATE POLICY "followup_requests_update_gated"
ON public.followup_requests FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "followup_requests_delete_gated" ON public.followup_requests;
CREATE POLICY "followup_requests_delete_gated"
ON public.followup_requests FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

-- followup_responses -----------------------------------------
DROP POLICY IF EXISTS "followup_responses_select_gated" ON public.followup_responses;
CREATE POLICY "followup_responses_select_gated"
ON public.followup_responses FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "followup_responses_insert_gated" ON public.followup_responses;
CREATE POLICY "followup_responses_insert_gated"
ON public.followup_responses FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (SELECT private.user_has_active_access())
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "followup_responses_update_gated" ON public.followup_responses;
CREATE POLICY "followup_responses_update_gated"
ON public.followup_responses FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

DROP POLICY IF EXISTS "followup_responses_delete_gated" ON public.followup_responses;
CREATE POLICY "followup_responses_delete_gated"
ON public.followup_responses FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT private.user_has_active_access()));

-- The public helper is now unreferenced. Dropping it also removes the
-- Supabase advisories about a SECURITY DEFINER function being callable via the
-- exposed API.
DROP FUNCTION IF EXISTS public.user_has_active_access();

COMMIT;

-- ============================================================
-- VERIFICATION (run after applying)
-- ============================================================
-- Confirm the helper now recognises App Store access:
--   SELECT pg_get_functiondef('private.user_has_active_access'::regproc);
--   -- expect three EXISTS branches incl. public.app_store_subscriptions
--
-- Confirm every gated policy references the private helper:
--   SELECT tablename, policyname, qual::text, with_check::text
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('patients','assessments','followup_requests','followup_responses')
--   ORDER BY tablename, policyname;
--
-- Confirm the public helper is gone:
--   SELECT to_regprocedure('public.user_has_active_access()');  -- expect NULL
