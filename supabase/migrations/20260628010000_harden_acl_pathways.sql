-- Migration: harden_acl_pathways
-- Purpose:
--   Follow-up hardening for public.acl_pathways from the security/code review:
--   (1) cap graft_type free-text length (defence-in-depth; the UI also sets
--       maxLength=200 in components/ACLPathwayPanel.js), and
--   (2) auto-maintain updated_at via a BEFORE UPDATE trigger so the column never
--       goes stale if a future code path updates a row without setting it.
-- Deploy order: apply after 20260628000000_add_acl_pathways.sql. Idempotent.

ALTER TABLE public.acl_pathways DROP CONSTRAINT IF EXISTS acl_pathways_graft_type_len;
ALTER TABLE public.acl_pathways ADD CONSTRAINT acl_pathways_graft_type_len
  CHECK (graft_type IS NULL OR char_length(graft_type) <= 200);

CREATE OR REPLACE FUNCTION public.acl_pathways_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS acl_pathways_set_updated_at ON public.acl_pathways;
CREATE TRIGGER acl_pathways_set_updated_at
  BEFORE UPDATE ON public.acl_pathways
  FOR EACH ROW EXECUTE FUNCTION public.acl_pathways_set_updated_at();
