import { getAdminClient } from '../../lib/supabase-admin'
import { buildReferenceCardPdf, REFERENCE_CARD_FILENAME } from '../../lib/clinical/referenceCard'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_ROLES = new Set([
  'Physiotherapist',
  'Student',
  'Other allied health',
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

  const email = normalize(req.body?.email, 254).toLowerCase()
  const name  = normalize(req.body?.name, 120)
  const role  = normalize(req.body?.role, 60)

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' })
  }
  if (role && !ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Please choose a role from the list.' })
  }

  // Capture the lead. Failure to record should not block the download —
  // we still want the visitor to get the PDF they came for.
  try {
    const admin = getAdminClient()
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500)
    await admin.from('leads').insert({
      email,
      name,
      role: role || null,
      source: 'reference-card',
      ip_address: ip === 'unknown' ? null : ip,
      user_agent: userAgent || null,
    })
  } catch (err) {
    console.error('Lead capture failed', { message: err?.message })
  }

  let pdfBytes
  try {
    pdfBytes = await buildReferenceCardPdf()
  } catch (err) {
    console.error('Reference card PDF generation failed', { message: err?.message })
    return res.status(500).json({ error: 'Could not generate the reference card. Please try again later.' })
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${REFERENCE_CARD_FILENAME}"`)
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(Buffer.from(pdfBytes))
}
