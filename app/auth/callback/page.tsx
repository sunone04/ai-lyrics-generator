'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // If error present, redirect back to signin with reason
    if (error) {
      toast.error('Authentication failed');
      router.replace(`/auth/signin?error=auth_failed&reason=${encodeURIComponent(error)}`);
      return;
    }

    // Supabase will process session in browser; do a light sync
    const sync = async () => {
      try {
        if (!code) {
          // Without code, still try to get user to sync session
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


