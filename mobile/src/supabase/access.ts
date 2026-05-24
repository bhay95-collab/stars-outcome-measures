import { supabase } from './client';

export type AccessReason = 'trial' | 'subscription' | 'none';

export interface AccessStatus {
  hasAccess: boolean;
  reason: AccessReason;
}

export async function checkAccess(userId: string): Promise<AccessStatus> {
  const [profileResult, subResult] = await Promise.all([
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
  ]);

  if (profileResult.error) throw new Error('Access check unavailable.');
  if (subResult.error) throw new Error('Access check unavailable.');

  const profile = profileResult.data;
  const sub = subResult.data;
  const now = new Date();

  const isTrialActive = profile?.trial_end_date
    ? new Date(profile.trial_end_date) > now
    : false;

  const isSubscriptionActive =
    sub?.status === 'active' &&
    !!sub?.current_period_end &&
    new Date(sub.current_period_end) > now;

  if (isSubscriptionActive) return { hasAccess: true, reason: 'subscription' };
  if (isTrialActive) return { hasAccess: true, reason: 'trial' };
  return { hasAccess: false, reason: 'none' };
}
