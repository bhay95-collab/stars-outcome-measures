import revenueCatWebhook from '../pages/api/webhooks/revenuecat'
import {
  existingRevenueCatUserIds,
  isRevenueCatSyntheticTestEvent,
  revenueCatWebhookUserIds,
  syncRevenueCatSubscription,
} from '../lib/revenuecat-server'
import { getAdminClient } from '../lib/supabase-admin'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
}))

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status: jest.fn(code => {
      res.statusCode = code
      return res
    }),
    json: jest.fn(body => {
      res.body = body
      return res
    }),
    end: jest.fn(() => res),
  }
  return res
}

function makeAdmin({
  existingEvent = null,
  existingUserIds = ['55b470d5-5a09-4f6e-8f83-d1e1f9f49766'],
} = {}) {
  const state = {
    existingEvent,
    existingUserIds,
    insertedEvents: [],
    updatedEvents: [],
    deletedEvents: [],
    subscription: null,
  }

  function queryFor(table) {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      maybeSingle: jest.fn(() => Promise.resolve({
        data: table === 'revenuecat_webhook_events' ? state.existingEvent : null,
        error: null,
      })),
      insert: jest.fn(payload => {
        state.insertedEvents.push(payload)
        return Promise.resolve({ error: null })
      }),
      upsert: jest.fn(payload => {
        state.subscription = payload
        return Promise.resolve({ error: null })
      }),
      update: jest.fn(payload => ({
        eq: jest.fn(() => {
          state.updatedEvents.push(payload)
          return Promise.resolve({ error: null })
        }),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => {
          state.deletedEvents.push(table)
          return Promise.resolve({ error: null })
        }),
      })),
    }
    return query
  }

  return {
    admin: {
      from: jest.fn(queryFor),
      auth: {
        admin: {
          getUserById: jest.fn(userId => {
            if (state.existingUserIds.includes(userId)) {
              return Promise.resolve({ data: { user: { id: userId } }, error: null })
            }
            return Promise.resolve({
              data: { user: null },
              error: { status: 404, code: 'user_not_found', message: 'User not found' },
            })
          }),
        },
      },
    },
    state,
  }
}

const userId = '55b470d5-5a09-4f6e-8f83-d1e1f9f49766'
const subscriberPayload = {
  subscriber: {
    entitlements: {
      pro: {
        product_identifier: 'com.rehabmetricsiq.app.subscription.pro.annual',
        expires_date: '2999-06-10T00:00:00.000Z',
      },
    },
    subscriptions: {
      'com.rehabmetricsiq.app.subscription.pro.annual': {
        expires_date: '2999-06-10T00:00:00.000Z',
        is_sandbox: true,
        unsubscribe_detected_at: null,
        billing_issues_detected_at: null,
      },
    },
  },
}

describe('RevenueCat subscription synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.REVENUECAT_SECRET_API_KEY = 'rc-secret'
    process.env.REVENUECAT_WEBHOOK_AUTHORIZATION = 'Bearer webhook-secret'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => subscriberPayload,
      text: async () => '',
    })
  })

  it('stores an active App Store entitlement without touching Stripe state', async () => {
    const { admin, state } = makeAdmin()

    const result = await syncRevenueCatSubscription(admin, userId)

    expect(result).toEqual(expect.objectContaining({
      user_id: userId,
      status: 'active',
      is_active: true,
      environment: 'sandbox',
    }))
    expect(state.subscription.product_identifier).toBe('com.rehabmetricsiq.app.subscription.pro.annual')
    expect(admin.from).toHaveBeenCalledWith('app_store_subscriptions')
    expect(admin.from).not.toHaveBeenCalledWith('subscriptions')
  })

  it('collects only valid unique Supabase UUIDs from transfer events', () => {
    expect(revenueCatWebhookUserIds({
      app_user_id: userId,
      transferred_to: [userId, 'not-a-uuid'],
      transferred_from: ['f5b7d81c-d0bb-4b8a-aadc-16e347f7393e'],
    })).toEqual([
      userId,
      'f5b7d81c-d0bb-4b8a-aadc-16e347f7393e',
    ])
  })

  it('recognizes dashboard synthetic lifecycle events by their test product', () => {
    expect(isRevenueCatSyntheticTestEvent({
      type: 'INITIAL_PURCHASE',
      product_id: 'test_product',
    })).toBe(true)
  })

  it('keeps only App User IDs backed by Supabase Auth users', async () => {
    const missingUserId = '9d531a53-e4f7-4b9c-9611-236bdbef95c7'
    const { admin } = makeAdmin()

    await expect(existingRevenueCatUserIds(admin, [userId, missingUserId]))
      .resolves.toEqual([userId])
  })

  it('acknowledges TEST events without persisting or synchronizing them', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer webhook-secret' },
      body: {
        event: {
          id: 'test-event-1',
          type: 'TEST',
          app_user_id: 'fake-app-user-id',
          product_id: 'test_product',
        },
      },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, test: true })
    expect(getAdminClient).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('acknowledges dashboard synthetic lifecycle events without persistence', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer webhook-secret' },
      body: {
        event: {
          id: 'synthetic-purchase-event',
          type: 'INITIAL_PURCHASE',
          app_user_id: '9d531a53-e4f7-4b9c-9611-236bdbef95c7',
          product_id: 'test_product',
        },
      },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true, test: true })
    expect(getAdminClient).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('still requires authorization for TEST events', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer incorrect-secret' },
      body: {
        event: {
          id: 'test-event-1',
          type: 'TEST',
          app_user_id: 'fake-app-user-id',
          product_id: 'test_product',
        },
      },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Invalid webhook authorization' })
    expect(getAdminClient).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('marks an event processed without syncing a missing Supabase Auth user', async () => {
    const missingUserId = '9d531a53-e4f7-4b9c-9611-236bdbef95c7'
    const { admin, state } = makeAdmin({ existingUserIds: [] })
    getAdminClient.mockReturnValue(admin)
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer webhook-secret' },
      body: {
        event: {
          id: 'event-for-deleted-user',
          type: 'RENEWAL',
          app_user_id: missingUserId,
          product_id: 'com.rehabmetricsiq.app.subscription.pro.monthly',
        },
      },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.statusCode).toBe(200)
    expect(state.insertedEvents).toEqual([{
      event_id: 'event-for-deleted-user',
      event_type: 'RENEWAL',
    }])
    expect(state.subscription).toBeNull()
    expect(state.updatedEvents).toHaveLength(1)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('processes a webhook once and marks it complete', async () => {
    const { admin, state } = makeAdmin()
    getAdminClient.mockReturnValue(admin)
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer webhook-secret' },
      body: {
        event: {
          id: 'event-1',
          type: 'RENEWAL',
          app_user_id: userId,
          original_transaction_id: 'transaction-1',
        },
      },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.statusCode).toBe(200)
    expect(state.insertedEvents).toEqual([{ event_id: 'event-1', event_type: 'RENEWAL' }])
    expect(state.subscription.original_transaction_id).toBe('transaction-1')
    expect(state.updatedEvents).toHaveLength(1)
  })

  it('returns success without reprocessing a duplicate webhook', async () => {
    const { admin } = makeAdmin({ existingEvent: { event_id: 'event-1' } })
    getAdminClient.mockReturnValue(admin)
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer webhook-secret' },
      body: { event: { id: 'event-1', type: 'RENEWAL', app_user_id: userId } },
    }
    const res = makeRes()

    await revenueCatWebhook(req, res)

    expect(res.body).toEqual({ received: true, duplicate: true })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
