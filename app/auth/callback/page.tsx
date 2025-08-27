'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingPage } from '@/components/ui/loading';

// 独立的组件来处理 useSearchParams
function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect_to') || '/dashboard';
  
  return <AuthCallbackHandler code={code} redirectTo={redirectTo} />;
}

// 主要的回调处理组件
function AuthCallbackHandler({ code, redirectTo }: { code: string | null; redirectTo: string }) {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      
      try {
        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Auth callback error:', error);
            const reason = encodeURIComponent(error.message || 'auth_failed');
            router.push(`/auth/signin?error=auth_failed&reason=${reason}`);
            return;
          }

          // Ensure user profile exists
          if (data.user) {
            try {
              await fetch('/api/user/profile', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
            } catch (profileError) {
              console.error('Profile creation error during auth callback:', profileError);
              // 不阻塞登录
            }
          }

          // Redirect to dashboard or intended page
          router.push(redirectTo);
        } else {
          router.push('/auth/signin?error=missing_code');
        }
      } catch (error: any) {
        console.error('Unexpected error in auth callback:', error);
        const reason = encodeURIComponent(error?.message || 'unexpected_error');
        router.push(`/auth/signin?error=unexpected_error&reason=${reason}`);
      }
    };

    handleAuthCallback();
  }, [router, code, redirectTo]);

  return <LoadingPage text="Completing sign in..." />;
}

// 主导出组件，用 Suspense 包裹 useSearchParams
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingPage text="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}