import { hashEmail } from './account-provisioning'
import { getStripeServer } from './stripe-server'
import { revokeAppleAuthorizationCode } from './apple-server'

// Carries an HTTP status + message so route handlers can surface the right error
// without re-implementing the deletion sequence. Plain (untyped) Errors thrown by
// the data-deletion steps fall through to a generic 500 in the caller.
export class AccountDeletionError extends Error {
  constructor(message, { statusCode = 500, stage } = {}) {
    super(message)
    this.name = 'AccountDeletionError'
    this.statusCode = statusCode
    this.stage = stage
  }
}

async function deleteRows(admin, table, column, value) {
  const { error } = await admin.from(table).delete().eq(column, value)
  if (error) throw new Error(`Could not delete ${table}: ${error.message}`)
}

async function deleteAvatarFiles(admin, userId) {
  const bucket = admin.storage.from('avatars')
  const { data: files, error: listError } = await bucket.list(userId)
  if (listError) throw new Error(`Could not inspect avatar files: ${listError.message}`)
  if (!files?.length) return

  const paths = files.map(file => `${userId}/${file.name}`)
  const { error: removeError } = await bucket.remove(paths)
  if (removeError) throw new Error(`Could not delete avatar files: ${removeError.message}`)
}

async function cancelStripeSubscription(admin, userId) {
  const { data: sub, error: subscriptionLookupError } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (subscriptionLookupError) {
    throw new AccountDeletionError('Your billing status could not be checked. Please try again.', {
      statusCode: 500,
      stage: 'billing-lookup',
    })
  }

  if (sub?.stripe_subscription_id && sub.status !== 'cancelled') {
    try {
      const stripe = getStripeServer()
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (error) {
      console.error('Stripe cancellation before account deletion failed', {
        userId,
        message: error.message,
      })
      throw new AccountDeletionError(
        'Your Stripe subscription could not be cancelled, so the account was not deleted. Please try again.',
        { statusCode: 502, stage: 'stripe-cancel' }
      )
    }
  }
}

// Runs the full account teardown in the order required for safety:
//   1. Cancel Stripe (no orphaned billing)
//   2. Revoke Apple authorization — a HARD GATE before any data is deleted
//   3. Delete owned data, then the auth user
// `appleClient` selects the Apple client/redirect used for revocation; pass it
// only when `appleAuthorizationCode` is present.
export async function deleteUserAccount(admin, user, options = {}) {
  const userId = user.id
  const userEmail = user.email

  if (!userEmail) {
    throw new AccountDeletionError('This account does not include an email address.', {
      statusCode: 400,
      stage: 'validation',
    })
  }

  await cancelStripeSubscription(admin, userId)

  const { appleAuthorizationCode, appleClient } = options
  if (appleAuthorizationCode) {
    try {
      await revokeAppleAuthorizationCode(appleAuthorizationCode, {
        clientId: appleClient?.clientId,
        redirectUri: appleClient?.redirectUri,
      })
    } catch (error) {
      console.error('Apple revocation before account deletion failed', {
        userId,
        message: error.message,
      })
      throw new AccountDeletionError(
        'Your Apple authorization could not be revoked, so the account was not deleted. Please try again.',
        { statusCode: 502, stage: 'apple-revoke' }
      )
    }
  }

  await deleteAvatarFiles(admin, userId)
  await deleteRows(admin, 'followup_responses', 'user_id', userId)
  await deleteRows(admin, 'followup_requests', 'user_id', userId)
  await deleteRows(admin, 'assessments', 'user_id', userId)
  await deleteRows(admin, 'patients', 'user_id', userId)
  await deleteRows(admin, 'subscriptions', 'user_id', userId)
  await deleteRows(admin, 'app_store_subscriptions', 'user_id', userId)
  await deleteRows(admin, 'profiles', 'id', userId)

  const { error: deletedAccountError } = await admin
    .from('deleted_accounts')
    .upsert({ email_hash: hashEmail(userEmail) })
  if (deletedAccountError) throw new Error(`Could not record account deletion: ${deletedAccountError.message}`)

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId)
  if (authDeleteError) throw new Error(`Could not delete authentication account: ${authDeleteError.message}`)
}
