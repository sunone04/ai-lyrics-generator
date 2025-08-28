import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSsrServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const rawRedirectTo = url.searchParams.get('redirect_to') || '/'
  const redirectTo = rawRedirectTo.startsWith('/') ? rawRedirectTo : '/'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=missing_code', url.origin))
  }

  const res = NextResponse.next()

  const supabase = createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            res.cookies.set(name, value, options)
          } catch {}
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const reason = encodeURIComponent(error.message || 'auth_failed')
    return NextResponse.redirect(new URL(`/auth/signin?error=auth_failed&reason=${reason}`, url.origin))
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin))
}


