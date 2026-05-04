import { createClient } from '@supabase/supabase-js'

let _adminClient

export function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) throw new Error('Supabase admin credentials not configured')
    _adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _adminClient
}

export async function getUserFromRequest(req) {
  const rawCookie = req.cookies['stars-auth']
  if (!rawCookie) return null

  let accessToken
  try {
    const session = JSON.parse(decodeURIComponent(rawCookie))
    accessToken = session.access_token
    if (!accessToken) return null
  } catch {
    return null
  }

  const admin = getAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(accessToken)
  if (error || !user) return null
  return user
}
