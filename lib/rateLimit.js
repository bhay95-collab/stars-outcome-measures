// Shared in-memory IP rate limiter.
//
// NOTE: state lives in the process, so on serverless (Vercel) each instance
// keeps its own window. This is defense-in-depth against bursts hitting a single
// instance, not a globally enforced quota. For a hard global limit, back this
// with a shared store (e.g. Upstash/Redis).

export function createRateLimiter({ windowMs, max }) {
  const hits = new Map()

  function pruneExpired(now) {
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key)
    }
  }

  return function isRateLimited(key) {
    const now = Date.now()
    pruneExpired(now)

    const existing = hits.get(key) ?? { count: 0, resetAt: now + windowMs }
    const isExpired = now > existing.resetAt
    const entry = {
      count: isExpired ? 1 : existing.count + 1,
      resetAt: isExpired ? now + windowMs : existing.resetAt,
    }
    hits.set(key, entry)
    return entry.count > max
  }
}

export function getClientIp(req) {
  const realIp = req?.headers?.['x-real-ip']
  if (typeof realIp === 'string' && realIp) return realIp

  const forwarded = req?.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()

  return req?.socket?.remoteAddress || 'unknown'
}
