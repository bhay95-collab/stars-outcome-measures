import crypto from 'crypto'
import { getAdminClient } from '../../lib/supabase-admin'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TRIAL_DAYS = 14

function pruneExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}

function isRateLimited(ip) {
  pruneExpiredEntries()
  const now = Date.now()
  const existing = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  const isExpired = now > existing.resetAt
  const entry = {
    count: isExpired ? 1 : existing.count + 1,
    resetAt: isExpired ? now + RATE_LIMIT_WINDOW_MS : existing.resetAt,
  }
  rateLimitMap.set(ip, entry)
  return entry.count > RATE_LIMIT_MAX
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(normalizeEmail(email))
    .digest('hex')
}

function trialEndDate() {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown'
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many signup attempts. Please wait a minute and try again.' })

  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password ?? '')

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

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      email_verified: true,
      signup_source: 'web',
    },
  })

  if (createError) {
    if (isAlreadyRegistered(createError)) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in instead.' })
    }
    return res.status(502).json({ error: 'Account creation is temporarily unavailable. Please try again.' })
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
    await admin.auth.admin.deleteUser(user.id)
    return res.status(500).json({ error: 'Account setup failed. Please try again.' })
  }

  return res.status(201).json({ ok: true })
}
