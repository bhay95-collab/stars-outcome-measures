-- Migration: add_rls_access_gate_patients_assessments
-- Applied:   2026-05-24 manually via Supabase SQL Editor
-- Verified:  function SECURITY DEFINER + search_path confirmed;
--            4 gated policies on patients, 4 on assessments confirmed;
--            active mobile user unaffected; expired user blocked;
--            web app unaffected.
--
-- Purpose:
--   Enforce that authenticated users can only read or write their own
--   patients and assessments while their trial or subscription is active.
--   This is database-level enforcement, separate from the mobile UX gate
--   added in commit d3b4362.
--
-- Access logic:
--   Active subscription: subscriptions.status = 'active'
--                        AND subscriptions.current_period_end > now()
--   Active trial:        profiles.trial_end_date > now()
--
-- The service-role client used in pages/api/delete-account.js bypasses
-- RLS entirely and is unaffected by these policies.

-- ============================================================
-- PREFLIGHT (read-only — run before applying to confirm types)
-- ============================================================
-- SELECT table_name, column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND (
--     (table_name = 'profiles'         AND column_name = 'trial_end_date')
--     OR (table_name = 'subscriptions' AND column_name = 'current_period_end')
--     OR (table_name IN ('patients', 'assessments') AND column_name = 'user_id')
--   )
-- ORDER BY table_name, column_name;
-- Expected: user_id = uuid; trial_end_date and current_period_end = date or timestamptz

-- ============================================================
-- APPLIED TRANSACTION
-- ============================================================

BEGIN;

-- SECURITY DEFINER: runs as function owner, bypassing RLS on
--   public.profiles and public.subscriptions.
-- SET search_path = '': prevents search_path hijacking.
-- STABLE: result does not change within a single statement.
CREATE OR REPLACE FUNCTION public.user_has_active_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND s.current_period_end > now()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.trial_end_date > now()
    )
$$;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.patients',
      policy_record.policyname
    );
  END LOOP;
END $$;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assessments'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.assessments',
      policy_record.policyname
    );
  END LOOP;
END $$;

-- (SELECT ...) evaluates the function once per statement, not per row.
-- TO authenticated: anon role receives nothing.

CREATE POLICY "patients_select_gated"
ON public.patients FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "patients_insert_gated"
ON public.patients FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "patients_update_gated"
ON public.patients FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "patients_delete_gated"
ON public.patients FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "assessments_select_gated"
ON public.assessments FOR SELECT TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "assessments_insert_gated"
ON public.assessments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "assessments_update_gated"
ON public.assessments FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()))
WITH CHECK (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

CREATE POLICY "assessments_delete_gated"
ON public.assessments FOR DELETE TO authenticated
USING (user_id = auth.uid() AND (SELECT public.user_has_active_access()));

COMMIT;

-- ============================================================
-- VERIFICATION (run after applying)
-- ============================================================
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname = 'user_has_active_access';
-- Expected: prosecdef = true, proconfig includes 'search_path='
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('patients', 'assessments')
-- ORDER BY tablename, cmd, policyname;
-- Expected: 4 gated policies per table; roles includes 'authenticated'

-- ============================================================
-- ROLLBACK (revert to ownership-only if needed)
-- ============================================================
-- BEGIN;
--
-- DROP POLICY IF EXISTS "patients_select_gated"    ON public.patients;
-- DROP POLICY IF EXISTS "patients_insert_gated"    ON public.patients;
-- DROP POLICY IF EXISTS "patients_update_gated"    ON public.patients;
-- DROP POLICY IF EXISTS "patients_delete_gated"    ON public.patients;
--
-- DROP POLICY IF EXISTS "assessments_select_gated" ON public.assessments;
-- DROP POLICY IF EXISTS "assessments_insert_gated" ON public.assessments;
-- DROP POLICY IF EXISTS "assessments_update_gated" ON public.assessments;
-- DROP POLICY IF EXISTS "assessments_delete_gated" ON public.assessments;
--
-- DROP FUNCTION IF EXISTS public.user_has_active_access();
--
-- CREATE POLICY "patients_select_ownership"
-- ON public.patients FOR SELECT TO authenticated
-- USING (user_id = auth.uid());
--
-- CREATE POLICY "patients_insert_ownership"
-- ON public.patients FOR INSERT TO authenticated
-- WITH CHECK (user_id = auth.uid());
--
-- CREATE POLICY "patients_update_ownership"
-- ON public.patients FOR UPDATE TO authenticated
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());
--
-- CREATE POLICY "patients_delete_ownership"
-- ON public.patients FOR DELETE TO authenticated
-- USING (user_id = auth.uid());
--
-- CREATE POLICY "assessments_select_ownership"
-- ON public.assessments FOR SELECT TO authenticated
-- USING (user_id = auth.uid());
--
-- CREATE POLICY "assessments_insert_ownership"
-- ON public.assessments FOR INSERT TO authenticated
-- WITH CHECK (user_id = auth.uid());
--
-- CREATE POLICY "assessments_update_ownership"
-- ON public.assessments FOR UPDATE TO authenticated
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());
--
-- CREATE POLICY "assessments_delete_ownership"
-- ON public.assessments FOR DELETE TO authenticated
-- USING (user_id = auth.uid());
--
-- COMMIT;
