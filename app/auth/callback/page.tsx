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
    redirect('/auth/signin?error=missing_code')
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code!)
    if (error) {
      const reason = encodeURIComponent(error.message || 'auth_failed')
      redirect(`/auth/signin?error=auth_failed&reason=${reason}`)
    }
    redirect(redirectTo)
  } catch (error: any) {
    const reason = encodeURIComponent(error?.message || 'unexpected_error')
    redirect(`/auth/signin?error=unexpected_error&reason=${reason}`)
  }
}