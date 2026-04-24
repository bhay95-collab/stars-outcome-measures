import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function cookieStorage() {
  if (typeof window === 'undefined') return undefined
  return {
    getItem(key) {
      const m = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/[.+*?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
      return m ? decodeURIComponent(m[1]) : null
    },
    setItem(key, value) {
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`
    },
    removeItem(key) {
      document.cookie = `${key}=; path=/; max-age=0`
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'stars-auth',
    storage: cookieStorage(),
    persistSession: true,
    detectSessionInUrl: true
  }
})
