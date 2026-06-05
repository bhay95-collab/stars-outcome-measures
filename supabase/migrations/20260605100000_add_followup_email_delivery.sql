-- Migration: add_followup_email_delivery
-- Purpose:
--   Store optional patient email addresses and track email delivery
--   attempts for patient-reported questionnaire follow-up links.

BEGIN;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.patients
  DROP CONSTRAINT IF EXISTS patients_email_format_check;

ALTER TABLE public.patients
  ADD CONSTRAINT patients_email_format_check
  CHECK (
    email IS NULL
    OR (
      char_length(email) <= 254
      AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

ALTER TABLE public.followup_requests
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_status text,
  ADD COLUMN IF NOT EXISTS email_provider_message_id text,
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS last_email_attempt_at timestamptz;

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_email_status_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_email_status_check
  CHECK (
    email_status IS NULL
    OR email_status IN ('manual', 'sent', 'failed')
  );

ALTER TABLE public.followup_requests
  DROP CONSTRAINT IF EXISTS followup_requests_recipient_email_check;

ALTER TABLE public.followup_requests
  ADD CONSTRAINT followup_requests_recipient_email_check
  CHECK (
    recipient_email IS NULL
    OR (
      char_length(recipient_email) <= 254
      AND recipient_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

CREATE INDEX IF NOT EXISTS followup_requests_email_status_idx
ON public.followup_requests (user_id, patient_id, email_status, created_at DESC);

COMMENT ON COLUMN public.patients.email IS
  'Optional patient email address used by clinicians to send secure patient-reported questionnaire links.';

COMMENT ON COLUMN public.followup_requests.recipient_email IS
  'Email address snapshot used for this follow-up delivery attempt.';

COMMENT ON COLUMN public.followup_requests.email_status IS
  'Manual, sent, or failed delivery state for the follow-up link email.';

COMMIT;
