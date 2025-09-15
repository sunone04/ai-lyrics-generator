import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// 浏览器端客户端
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const projectRef = (() => {
    try {
      const u = new URL(supabaseUrl)
      const host = u.hostname // e.g. <ref>.supabase.co
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
      // Make sure the browser looks up the same key as the server writes
      storageKey: `sb-${projectRef}-auth-token`,
    },
  })
}

// 兼容旧引用
export { createClient as createBrowserClient }

