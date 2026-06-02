import { getAdminClient } from '../../lib/supabase-admin'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ALLOWED_CASELOADS = new Set([
  'Neurological / stroke / TBI',
  'Spinal cord injury',
  'Amputee',
  'Aged care / community / falls',
  'NDIS-funded',
  'Other',
])

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

function normalize(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function normalizeCaseload(value) {
  if (!Array.isArray(value)) return ''
  const cleaned = value
    .map(v => String(v ?? '').trim())
    .filter(v => ALLOWED_CASELOADS.has(v))
  return Array.from(new Set(cleaned)).join(', ')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = req.headers['x-real-ip']
    || (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown'

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' })
  }

  const email    = normalize(req.body?.email, 254).toLowerCase()
  const name     = normalize(req.body?.name, 120)
  const clinic   = normalize(req.body?.clinic, 200)
  const message  = normalize(req.body?.message, 2000)
  const caseload = normalizeCaseload(req.body?.caseload)

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' })
  }
  if (clinic.length < 2) {
    return res.status(400).json({ error: 'Please enter your clinic or workplace.' })
  }

  try {
    const admin = getAdminClient()
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500)
    const { error: insertError } = await admin.from('leads').insert({
      email,
      name,
      role: 'Physiotherapist',
      source: 'pilot',
      clinic,
      caseload: caseload || null,
      message: message || null,
      ip_address: ip === 'unknown' ? null : ip,
      user_agent: userAgent || null,
    })
    if (insertError) throw insertError
  } catch (err) {
    console.error('Pilot application capture failed', { message: err?.message })
    return res.status(500).json({
      error: 'We could not record your application. Please email Support@RehabMetricsIQ.com and we will follow up directly.',
    })
  }

  return res.status(200).json({ ok: true })
}
