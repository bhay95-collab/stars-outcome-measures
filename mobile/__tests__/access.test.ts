import { supabase } from '../src/supabase/client';
import { checkAccess } from '../src/supabase/access';

jest.mock('../src/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

function queryResult(data: unknown) {
  const query: {
    select: jest.Mock;
    eq: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };
  query.select.mockImplementation(() => query);
  query.eq.mockImplementation(() => query);
  query.maybeSingle.mockImplementation(() => Promise.resolve({ data, error: null }));
  return query;
}

describe('combined mobile access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAccess({
    trialEnd = '2000-01-01T00:00:00.000Z',
    stripe = null,
    appStore = null,
  }: {
    trialEnd?: string;
    stripe?: unknown;
    appStore?: unknown;
  }) {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') return queryResult({ trial_end_date: trialEnd });
      if (table === 'subscriptions') return queryResult(stripe);
      if (table === 'app_store_subscriptions') return queryResult(appStore);
      throw new Error(`Unexpected table ${table}`);
    });
  }

  it('prefers an active Stripe subscription when multiple grants exist', async () => {
    mockAccess({
      trialEnd: '2999-01-01T00:00:00.000Z',
      stripe: { status: 'active', current_period_end: '2999-01-01T00:00:00.000Z' },
      appStore: { is_active: true, expiration_at: '2999-01-01T00:00:00.000Z' },
    });

    await expect(checkAccess('user-1')).resolves.toEqual({ hasAccess: true, reason: 'stripe' });
  });

  it('accepts an App Store entitlement without a Stripe subscription', async () => {
    mockAccess({
      appStore: { is_active: true, expiration_at: '2999-01-01T00:00:00.000Z' },
    });

    await expect(checkAccess('user-1')).resolves.toEqual({ hasAccess: true, reason: 'app_store' });
  });

  it('falls back to the one-time trial and denies fully expired accounts', async () => {
    mockAccess({ trialEnd: '2999-01-01T00:00:00.000Z' });
    await expect(checkAccess('user-1')).resolves.toEqual({ hasAccess: true, reason: 'trial' });

    mockAccess({});
    await expect(checkAccess('user-1')).resolves.toEqual({ hasAccess: false, reason: 'none' });
  });
});
