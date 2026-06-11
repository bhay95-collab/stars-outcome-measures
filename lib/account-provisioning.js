import crypto from 'crypto'

export const TRIAL_DAYS = 14

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(normalizeEmail(email))
    .digest('hex')
}

export function trialEndDate(now = Date.now()) {
  return new Date(now + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function provisionOAuthProfile(admin, user, names = {}) {
  const email = normalizeEmail(user?.email)
  if (!user?.id || !email) {
    return { error: 'Your account does not include an email address.', status: 400 }
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, trial_end_date')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLookupError) {
    return { error: 'Account setup is temporarily unavailable.', status: 500 }
  }

  const firstName = String(names.firstName ?? '').trim()
  const lastName = String(names.lastName ?? '').trim()

  if (existingProfile) {
    const updates = { email }
    if (firstName && !existingProfile.first_name) updates.first_name = firstName
    if (lastName && !existingProfile.last_name) updates.last_name = lastName

    if (Object.keys(updates).length > 1) {
      const { error: updateError } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (updateError) return { error: 'Account setup is temporarily unavailable.', status: 500 }
    }

    return {
      created: false,
      trialEndDate: existingProfile.trial_end_date,
    }
  }

  const { data: deletedAccount, error: deletedLookupError } = await admin
    .from('deleted_accounts')
    .select('id')
    .eq('email_hash', hashEmail(email))
    .maybeSingle()

  if (deletedLookupError) {
    return { error: 'Account setup is temporarily unavailable.', status: 500 }
  }

  if (deletedAccount) {
    await admin.auth.admin.deleteUser(user.id)
    return {
      error: 'An account with this email has been permanently deleted and is not eligible for a new free trial.',
      status: 403,
    }
  }

  const expiresAt = trialEndDate()
  const profile = {
    id: user.id,
    email,
    trial_end_date: expiresAt,
  }
  if (firstName) profile.first_name = firstName
  if (lastName) profile.last_name = lastName

  const { error: insertError } = await admin
    .from('profiles')
    .insert(profile)

  if (insertError) {
    return { error: 'Account setup is temporarily unavailable.', status: 500 }
  }

  return { created: true, trialEndDate: expiresAt }
}
