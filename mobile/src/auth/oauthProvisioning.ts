import { Session } from '@supabase/supabase-js';
import { apiRequest } from '../api/client';

interface ProvisioningOptions {
  firstName?: string | null;
  lastName?: string | null;
}

export async function provisionOAuthProfile(
  session: Session,
  options: ProvisioningOptions = {},
): Promise<void> {
  await apiRequest('/api/oauth/provision', {
    method: 'POST',
    accessToken: session.access_token,
    body: JSON.stringify({
      firstName: options.firstName || undefined,
      lastName: options.lastName || undefined,
    }),
  });
}
