-- Harden the subscription access gate.
--
-- 1. public.user_has_active_access() -> SECURITY INVOKER.
--    Clears Supabase lint 0029 (authenticated SECURITY DEFINER function
--    exposed at /rest/v1/rpc). Every table it reads already has a
--    "select own row" policy (profiles, subscriptions,
--    app_store_subscriptions), and every check is scoped to auth.uid(),
--    so the result is unchanged. If one of those read policies is ever
--    removed, the gate fails closed (no access), never open.
--    Do NOT revoke EXECUTE from authenticated: the RLS policies on
--    patients, assessments, followup_* and acl_pathways call it.
--
-- 2. profiles: clients may only write the columns the app edits
--    (ProfileModal upsert). Previously any signed-in user could set their
--    own trial_end_date / subscription fields via the REST API and bypass
--    the paywall. Billing columns are now written by the service role
--    (signup + OAuth provisioning) only.
--    A new client-editable profiles column must be added to the GRANT below.

BEGIN;

ALTER FUNCTION public.user_has_active_access() SECURITY INVOKER;

REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

GRANT INSERT (id, email, first_name, last_name, avatar_url, clinical_focus)
  ON public.profiles TO authenticated;
GRANT UPDATE (id, email, first_name, last_name, avatar_url, clinical_focus)
  ON public.profiles TO authenticated;

COMMIT;

-- Verification:
-- SELECT prosecdef FROM pg_proc WHERE proname = 'user_has_active_access';
--   Expected: false
-- SELECT grantee, privilege_type, column_name
-- FROM information_schema.column_privileges
-- WHERE table_schema = 'public' AND table_name = 'profiles'
--   AND grantee IN ('anon', 'authenticated')
--   AND privilege_type IN ('INSERT', 'UPDATE');
--   Expected: authenticated only, on the six columns above.

-- Rollback:
-- ALTER FUNCTION public.user_has_active_access() SECURITY DEFINER;
-- GRANT INSERT, UPDATE ON public.profiles TO anon, authenticated;
