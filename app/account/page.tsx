'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getProfileFromCacheNoTTL, setProfileCache, clearProfileCache } from '@/lib/profile-cache';

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Check if we already have data from cache
      const cached = getProfileFromCacheNoTTL();
      if (cached && cached.status) {
        // Use cached data immediately
        setStatus(cached.status);
        setStartDate(cached.subscription_start_date ?? null);
        setEndDate(cached.subscription_end_date ?? null);
        setLoading(false);
        
        // Only fetch fresh data if we don't have a user email yet
        if (!email) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!mounted || !user) {
            if (!user) router.replace('/auth/signin?returnTo=' + encodeURIComponent('/account'));
            return;
          }
          setEmail(user.email || '');
        }
        return; // Exit early if we have cached data
      }

      // No cache, fetch everything
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        router.replace('/auth/signin?returnTo=' + encodeURIComponent('/account'));
        return;
      }
      setEmail(user.email || '');

      try {
        // Read plan and dates from profiles
        const { data: prof } = await supabase
          .from('profiles')
          .select('status, subscription_start_date, subscription_end_date')
          .eq('id', user.id)
          .single();
        const statusValue = (prof as any)?.status || 'free';
        const start = (prof as any)?.subscription_start_date ?? null;
        const end = (prof as any)?.subscription_end_date ?? null;
        setStatus(statusValue);
        setStartDate(start);
        setEndDate(end);
        // Cache the fresh data
        setProfileCache({ status: statusValue, subscription_start_date: start, subscription_end_date: end });
      } catch {}
      setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, []); // Remove dependencies to prevent re-runs

  const signOut = async () => {
    await supabase.auth.signOut();
    clearProfileCache();
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
          {status === 'active' && (
            <>
              <div><span className="text-gray-500">Start:</span> <span className="font-medium">{startDate ? new Date(startDate).toLocaleString() : '-'}</span></div>
              <div><span className="text-gray-500">End:</span> <span className="font-medium">{endDate ? new Date(endDate).toLocaleString() : '-'}</span></div>
            </>
          )}
        </div>
        <div className="pt-4 flex gap-3">
          <button onClick={goResetPassword} className="px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">Forgot / Reset Password</button>
          <button onClick={signOut} className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700">Sign Out</button>
        </div>
      </div>
    </div>
  );
}


