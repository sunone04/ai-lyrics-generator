import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const returnTo = searchParams.get('returnTo')

    if (error) {
      const reason = searchParams.get('error_description') || error
      const url = new URL(`/auth/signin?error=auth_failed&reason=${encodeURIComponent(reason)}`, request.url)
      return NextResponse.redirect(url)
    }

    // Build redirect response first so Set-Cookie can be attached to it
    const redirectUrl = new URL(returnTo ? decodeURIComponent(returnTo) : '/', request.url)
    const response = NextResponse.redirect(redirectUrl)

    if (code) {
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: async () => cookieStore.getAll(),
            setAll: async (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) => {
                const saneOptions: any = { sameSite: 'lax', ...options }
                if (process.env.NODE_ENV === 'production') {
                  saneOptions.secure = true
                }
                response.cookies.set(name, value, saneOptions)
              })
            },
          },
        }
      )

      await supabase.auth.exchangeCodeForSession(code)

      // Optional: auto-activate trial on first login
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: canUseTrial } = await supabase.rpc('can_user_use_trial', { user_uuid: user.id })
          if (canUseTrial) {
            await supabase.rpc('activate_user_trial', { user_uuid: user.id })
          }
        }
      } catch (_) {
        // ignore non-critical errors
      }
    }

    return response
  } catch (e) {
    const url = new URL('/auth/signin?error=unexpected_error', request.url)
    return NextResponse.redirect(url)
  }
}

