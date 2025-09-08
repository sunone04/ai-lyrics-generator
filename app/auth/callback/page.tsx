'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        if (!code) {
          await supabase.auth.getUser();
        }
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
