-- Migration: add_followup_reviewed_at
-- Purpose: Allow clinicians to mark a flagged follow-up response as reviewed,
--          clearing the amber/red attention signal across all views.

BEGIN;

ALTER TABLE public.followup_requests
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMIT;
