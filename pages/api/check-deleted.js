import crypto from 'crypto'
import { getAdminClient } from '../../lib/supabase-admin'

// In-memory rate limiter: 10 requests per minute per IP.
// NOTE: Resets on server/cold-start restart. Does not share state across serverless instances.
// Replace with Upstash Redis + @upstash/ratelimit for multi-instance production.
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Prefer x-real-ip (set by Vercel edge, not spoofable by clients) over x-forwarded-for.
  const ip = req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const { email } = req.body
  if (!email || typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  const emailHash = crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex')

  // Admin client bypasses RLS — correct here since this runs server-side only.
  const admin = getAdminClient()
  const { data, error: dbError } = await admin
    .from('deleted_accounts')
    .select('id')
    .eq('email_hash', emailHash)
    .maybeSingle()

  if (dbError) {
    return res.status(500).json({ error: 'Service unavailable' })
  }

  return res.status(200).json({ blocked: !!data })
}
