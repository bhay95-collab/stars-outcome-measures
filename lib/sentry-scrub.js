const BLOCKED_HEADERS = new Set(['cookie', 'set-cookie', 'authorization', 'x-supabase-auth'])

function scrubEvent(event) {
  if (event.request?.headers) {
    const safeHeaders = Object.fromEntries(
      Object.entries(event.request.headers).filter(
        ([key]) => !BLOCKED_HEADERS.has(key.toLowerCase())
      )
    )
    event = { ...event, request: { ...event.request, headers: safeHeaders } }
  }
  if (event.request?.data !== undefined) {
    event = { ...event, request: { ...event.request, data: '[redacted]' } }
  }
  if (event.user) {
    const { email, ...safeUser } = event.user
    event = { ...event, user: safeUser }
  }
  return event
}

module.exports = { scrubEvent }
