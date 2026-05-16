import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const projectRef = (() => {
    try {
      const u = new URL(supabaseUrl)
      const host = u.hostname
      const ref = host.replace('.supabase.co', '')
      return ref || 'supabase'
    } catch {
      return 'supabase'
    }
  })()

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storageKey: `sb-${projectRef}-auth-token`,
    },
  })
}

export { createClient as createBrowserClient }

