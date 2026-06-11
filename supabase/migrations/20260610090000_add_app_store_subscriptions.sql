-- Store App Store entitlements separately from Stripe so either provider can
-- independently grant access without overwriting the other provider's state.

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_store_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  product_identifier text,
  status text NOT NULL DEFAULT 'expired'
    CHECK (status IN ('active', 'cancelled', 'billing_issue', 'expired')),
  is_active boolean NOT NULL DEFAULT false,
  expiration_at timestamptz,
  original_transaction_id text,
  environment text NOT NULL DEFAULT 'production'
    CHECK (environment IN ('production', 'sandbox')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_store_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_store_subscriptions_select_own"
ON public.app_store_subscriptions;

CREATE POLICY "app_store_subscriptions_select_own"
ON public.app_store_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.revenuecat_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;

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
      FROM public.app_store_subscriptions a
      WHERE a.user_id = auth.uid()
        AND a.is_active = true
        AND a.expiration_at > now()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.trial_end_date > now()
    )
$$;

COMMIT;
