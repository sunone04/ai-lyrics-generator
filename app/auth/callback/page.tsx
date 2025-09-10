'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/contexts/auth-context';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      router.replace(`/auth/signin?error=auth_failed&reason=${encodeURIComponent(error)}`);
      return;
    }

    const sync = async () => {
      try {
        if (code) {
          // Ensure the OAuth code is exchanged for a session and cookies are set
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          await supabase.auth.getUser();
        }

        // Auto-activate 3-day free trial for new users (no credit card)
        try {
          const statusResp = await fetch('/api/trial/activate', { method: 'GET' });
          if (statusResp.ok) {
            const statusData = await statusResp.json();
            if (statusData?.canUseTrial) {
              const activateResp = await fetch('/api/trial/activate', { method: 'POST' });
              if (activateResp.ok) {
                toast.success('Your 3-day free trial is now active');
              }
            }
          }
        } catch (_) {
          // Non-blocking: ignore trial activation failures here
        }

        // Refresh profile to reflect trial/subscription changes
        try {
          await refreshProfile();
        } catch {}

        toast.success('Signed in');
        router.replace('/');
      } catch {
        router.replace('/auth/signin?error=unexpected_error');
      }
    };
    sync();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-gray-600">Finishing sign-in...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8"><div className="text-gray-600">Loading...</div></div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
