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
  const rawRedirectTo = Array.isArray(redirectToParam) ? redirectToParam[0] : redirectToParam || '/'
  // 仅允许站内路径，防止外链或协议问题；并对可疑/异常值回退至首页
  const redirectTo = (typeof rawRedirectTo === 'string' && rawRedirectTo.startsWith('/')) ? rawRedirectTo : '/'

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
  } catch (error: any) {
    // 忽略 Next.js 为 redirect 抛出的内部信号
    if (error?.digest === 'NEXT_REDIRECT' || error?.message === 'NEXT_REDIRECT') {
      throw error
    }
    // 记录捕获的真实异常
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

  // 成功交换会话后进行跳转（可能触发 NEXT_REDIRECT，但已被上方逻辑忽略）
  redirect(redirectTo)
}