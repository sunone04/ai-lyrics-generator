import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      const reason = searchParams.get('error_description') || error
      const url = new URL(`/auth/signin?error=auth_failed&reason=${encodeURIComponent(reason)}`, request.url)
      return NextResponse.redirect(url)
    }

    if (code) {
      const supabase = createServerComponentClient()
      // 服务端交换 code，设置 HttpOnly 会话 cookie，更稳定
      await supabase.auth.exchangeCodeForSession(code)

      // 尝试为首次登录用户自动开通 3 天试用（失败不阻断登录流程）
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: canUseTrial } = await supabase.rpc('can_user_use_trial', { user_uuid: user.id })
          if (canUseTrial) {
            await supabase.rpc('activate_user_trial', { user_uuid: user.id })
          }
        }
      } catch (_) {
        // 忽略试用开通过程中的错误，确保登录可继续
      }
    }

    // 成功后回首页（如需保留 returnTo，可在发起登录时把它拼到 redirectTo）
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  } catch (e) {
    const url = new URL('/auth/signin?error=unexpected_error', request.url)
    return NextResponse.redirect(url)
  }
}
