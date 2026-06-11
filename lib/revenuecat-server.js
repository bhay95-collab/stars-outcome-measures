const ENTITLEMENT_ID = 'pro'
const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1'

function getRevenueCatSecretKey() {
  const key = process.env.REVENUECAT_SECRET_API_KEY
  if (!key) throw new Error('RevenueCat server credentials are not configured')
  return key
}

function entitlementStatus(entitlement, subscription, now = new Date()) {
  const expiresAt = entitlement?.expires_date ?? subscription?.expires_date ?? null
  const expiration = expiresAt ? new Date(expiresAt) : null
  const isActive = !!expiration && !Number.isNaN(expiration.getTime()) && expiration > now

  if (isActive && subscription?.billing_issues_detected_at) return 'billing_issue'
  if (isActive && subscription?.unsubscribe_detected_at) return 'cancelled'
  if (isActive) return 'active'
  return 'expired'
}

export async function getRevenueCatSubscriber(userId) {
  const response = await fetch(`${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${getRevenueCatSecretKey()}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`RevenueCat subscriber lookup failed (${response.status})${detail ? `: ${detail}` : ''}`)
  }

  return response.json()
}

export async function syncRevenueCatSubscription(admin, userId, options = {}) {
  const payload = await getRevenueCatSubscriber(userId)
  const subscriber = payload?.subscriber ?? {}
  const entitlement = subscriber.entitlements?.[ENTITLEMENT_ID] ?? null
  const productIdentifier = entitlement?.product_identifier ?? null
  const subscription = productIdentifier
    ? subscriber.subscriptions?.[productIdentifier] ?? null
    : null
  const status = entitlementStatus(entitlement, subscription)
  const expirationAt = entitlement?.expires_date ?? subscription?.expires_date ?? null

  const record = {
    user_id: userId,
    product_identifier: productIdentifier,
    status,
    is_active: status !== 'expired',
    expiration_at: expirationAt,
    environment: subscription?.is_sandbox ? 'sandbox' : 'production',
    updated_at: new Date().toISOString(),
  }

  if (options.originalTransactionId) {
    record.original_transaction_id = options.originalTransactionId
  }

  const { error } = await admin
    .from('app_store_subscriptions')
    .upsert(record, { onConflict: 'user_id' })

  if (error) throw new Error(`Could not save App Store subscription: ${error.message}`)
  return record
}

export function isRevenueCatWebhookAuthorized(req) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION
  if (!expected) return false
  return req.headers?.authorization === expected
}

export function isRevenueCatSyntheticTestEvent(event) {
  return event?.type === 'TEST' || event?.product_id === 'test_product'
}

export function revenueCatWebhookUserIds(event) {
  const candidates = [
    event?.app_user_id,
    ...(Array.isArray(event?.transferred_to) ? event.transferred_to : []),
    ...(Array.isArray(event?.transferred_from) ? event.transferred_from : []),
  ]
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return [...new Set(candidates.filter(value => typeof value === 'string' && uuidPattern.test(value)))]
}

function isMissingAuthUser(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return error?.status === 404
    || error?.code === 'user_not_found'
    || message.includes('user not found')
}

export async function existingRevenueCatUserIds(admin, userIds) {
  const results = await Promise.all(userIds.map(async userId => {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error) {
      if (isMissingAuthUser(error)) return null
      throw new Error(`Could not verify RevenueCat App User ID: ${error.message}`)
    }
    return data?.user?.id === userId ? userId : null
  }))

  return results.filter(Boolean)
}
