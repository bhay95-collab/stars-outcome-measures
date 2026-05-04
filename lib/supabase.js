import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const authCookieName = 'stars-auth'

function setAuthCookie(session) {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  if (!session?.access_token) {
    document.cookie = `${authCookieName}=; path=/; max-age=0; SameSite=Lax${secure}`
    return
  }

  const cookieSession = JSON.stringify({ access_token: session.access_token })
  document.cookie = `${authCookieName}=${encodeURIComponent(cookieSession)}; path=/; max-age=2592000; SameSite=Lax${secure}`
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storageKey: authCookieName,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data }) => setAuthCookie(data.session))
  supabase.auth.onAuthStateChange((_event, session) => setAuthCookie(session))
}

export function getAppRedirectUrl() {
  if (typeof window !== 'undefined') return `${window.location.origin}/app`
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rehabmetricsiq.com'}/app`
}
