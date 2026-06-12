import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '../../lib/supabase-admin'
import {
  hashEmail,
  normalizeEmail,
  trialEndDate,
} from '../../lib/account-provisioning'
import { createRateLimiter, getClientIp } from '../../lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isRateLimited = createRateLimiter({ windowMs: 60_000, max: 5 })

function getEmailRedirectUrl(req, source) {
  if (source === 'mobile') return 'rehabmetricsiq://sign-in?verified=1'

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (configuredUrl) return `${configuredUrl.replace(/\/$/, '')}/app`

  const forwardedProto = req.headers['x-forwarded-proto']
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
  const protocol = proto || 'http'
  const host = req.headers.host || 'localhost:3000'
  return `${protocol}://${host}/app`
}

function isAlreadyRegistered(error) {
  const text = [
    error?.message,
    error?.error_description,
    error?.code,
    error?.status,
  ].filter(Boolean).join(' ').toLowerCase()
  return text.includes('already') || text.includes('registered') || text.includes('exists')
}

// Translates a Supabase GoTrue signUp error into a user-facing status + message.
// GoTrue returns a `code` (e.g. 'weak_password') and an HTTP `status`; without this
// mapping every failure was reported as "verification email could not be sent",
// which hid real causes like a weak password or an invalid email.
function classifySignupError(error) {
  const code = String(error?.code || '').toLowerCase()
  const status = Number(error?.status) || 0
  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : ''
  const message = rawMessage && rawMessage !== '{}' ? rawMessage : ''

  if (isAlreadyRegistered(error)) {
    return { status: 409, error: 'An account with this email already exists. Try logging in instead.' }
  }

  if (code === 'weak_password' || (status === 422 && /password/i.test(message))) {
    return {
      status: 422,
      error: message
        || 'That password is too weak or has appeared in a known data breach. Please choose a stronger, unique password.',
    }
  }

  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return { status: 400, error: message || 'Please enter a valid email address.' }
  }

  if (code.includes('rate_limit') || status === 429) {
    return { status: 429, error: 'Too many attempts. Please wait a minute and then try again.' }
  }

  if (code === 'signup_disabled' || code === 'email_provider_disabled') {
    return { status: 403, error: 'New sign-ups are temporarily disabled. Please contact support.' }
  }

  // Genuine mail-delivery failure: GoTrue surfaces this as a 5xx, usually with an
  // "Error sending confirmation email" message.
  if (status >= 500 || /error sending|sending.*email/i.test(message)) {
    return {
      status: 502,
      error: 'We could not send your verification email just now. Please try again in a few minutes.',
    }
  }

  // Anything else: prefer GoTrue's own user-facing message over a misleading one.
  return {
    status: 400,
    error: message || 'We could not create your account. Please check your details and try again.',
  }
}

function getSignupClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Supabase public credentials not configured')

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function deleteCreatedAccount(admin, userId) {
  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileDeleteError) {
    console.error('Signup rollback profile delete failed', {
      userId,
      code: profileDeleteError.code,
      message: profileDeleteError.message,
      details: profileDeleteError.details,
    })
  }

  await admin.auth.admin.deleteUser(userId)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = getClientIp(req)
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many signup attempts. Please wait a minute and try again.' })

  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password ?? '')
  const source = req.body?.source === 'mobile' ? 'mobile' : 'web'

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  const admin = getAdminClient()
  const { data: deletedAccount, error: deletedLookupError } = await admin
    .from('deleted_accounts')
    .select('id')
    .eq('email_hash', hashEmail(email))
    .maybeSingle()

  if (deletedLookupError) return res.status(500).json({ error: 'Signup is temporarily unavailable. Please try again.' })
  if (deletedAccount) {
    return res.status(403).json({
      error: 'An account with this email has been permanently deleted and is not eligible for a new free trial.',
    })
  }

  const signupClient = getSignupClient()
  const { data, error: signUpError } = await signupClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(req, source),
      data: { signup_source: source },
    },
  })

  if (signUpError) {
    const { status, error } = classifySignupError(signUpError)
    // Only log server-side failures (5xx); 4xx are normal user input errors.
    if (status >= 500) {
      console.error('Signup email delivery failed', {
        code: signUpError.code,
        message: signUpError.message,
        status: signUpError.status,
      })
    }
    return res.status(status).json({ error })
  }

  const user = data?.user
  if (!user?.id) return res.status(502).json({ error: 'Account creation is temporarily unavailable. Please try again.' })

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      trial_end_date: trialEndDate(),
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Signup profile setup failed', {
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
    })
    await deleteCreatedAccount(admin, user.id)
    return res.status(500).json({ error: 'Account setup failed. Please try again.' })
  }

  return res.status(201).json({ ok: true, needsEmailConfirmation: true })
}
