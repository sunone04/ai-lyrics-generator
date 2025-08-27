import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AuthCallbackPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const codeParam = searchParams?.code
  const redirectToParam = searchParams?.redirect_to
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