import { supabase } from './client';

export type AccessReason = 'trial' | 'stripe' | 'app_store' | 'none';

export interface AccessStatus {
  hasAccess: boolean;
  reason: AccessReason;
}

export async function checkAccess(userId: string): Promise<AccessStatus> {
  const [profileResult, stripeResult, appStoreResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('trial_end_date')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('app_store_subscriptions')
      .select('is_active, expiration_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (profileResult.error) throw new Error('Access check unavailable.');
  if (stripeResult.error) throw new Error('Access check unavailable.');
  if (appStoreResult.error) throw new Error('Access check unavailable.');

  const profile = profileResult.data;
  const stripeSubscription = stripeResult.data;
  const appStoreSubscription = appStoreResult.data;
  const now = new Date();

  const isTrialActive = profile?.trial_end_date
    ? new Date(profile.trial_end_date) > now
    : false;

  const isSubscriptionActive =
    stripeSubscription?.status === 'active' &&
    !!stripeSubscription?.current_period_end &&
    new Date(stripeSubscription.current_period_end) > now;

  const isAppStoreActive =
    appStoreSubscription?.is_active === true &&
    !!appStoreSubscription?.expiration_at &&
    new Date(appStoreSubscription.expiration_at) > now;

  if (isSubscriptionActive) return { hasAccess: true, reason: 'stripe' };
  if (isAppStoreActive) return { hasAccess: true, reason: 'app_store' };
  if (isTrialActive) return { hasAccess: true, reason: 'trial' };
  return { hasAccess: false, reason: 'none' };
}
