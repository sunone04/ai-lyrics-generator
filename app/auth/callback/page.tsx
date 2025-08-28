import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AuthCallbackPage(props: any) {
  // 兼容不同 Next 版本：searchParams 可能是对象或 Promise
  const sp = props?.searchParams && typeof props.searchParams.then === 'function'
    ? await props.searchParams
    : (props?.searchParams || {})

  const codeParam = sp?.code
  const redirectToParam = sp?.redirect_to
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam
  const redirectTo = Array.isArray(redirectToParam) ? redirectToParam[0] : redirectToParam || '/'

  if (!code) {
    // 记录缺少 code 的情况，便于排查回调失败
    try {
      console.error('[Auth] OAuth callback missing code', {
        searchParams: sp,
        redirectTo: redirectTo
      });
    } catch {}
    redirect('/auth/signin?error=missing_code')
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code!)
    if (error) {
      // 记录换取会话失败详情
      try {
        console.error('[Auth] exchangeCodeForSession error', {
          message: error.message,
          name: (error as any)?.name,
          stack: (error as any)?.stack,
          codeParam: code,
          redirectTo
        });
      } catch {}
      const reason = encodeURIComponent(error.message || 'auth_failed')
      redirect(`/auth/signin?error=auth_failed&reason=${reason}`)
    }
    redirect(redirectTo)
  } catch (error: any) {
    // 记录捕获的意外异常
    try {
      console.error('[Auth] OAuth callback unexpected error', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        codeParam: code,
        redirectTo
      });
    } catch {}
    const reason = encodeURIComponent(error?.message || 'unexpected_error')
    redirect(`/auth/signin?error=unexpected_error&reason=${reason}`)
  }
}