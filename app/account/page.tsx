'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        router.replace('/auth/signin?returnTo=' + encodeURIComponent('/account'));
        return;
      }
      setEmail(user.email || '');
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const profile = await res.json();
          setStatus(profile?.status || 'free');
        }
      } catch {}
      setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, [router, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.replace('/');
  };

  const goResetPassword = async () => {
    router.push('/auth/reset-password');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="space-y-1">
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{email}</span></div>
          <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{status === 'active' ? 'Pro' : 'Free'}</span></div>
        </div>
        <div className="pt-4 flex gap-3">
          <button onClick={goResetPassword} className="px-4 py-2 bg-gray-100 rounded-md">Forgot / Reset Password</button>
          <button onClick={signOut} className="px-4 py-2 bg-red-600 text-white rounded-md">Sign Out</button>
        </div>
      </div>
    </div>
  );
}


