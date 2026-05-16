'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    supabase.auth.getUser().then(() => setReady(true));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Service unavailable');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen noise-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl shadow-black/40 text-center">
            <p className="text-zinc-400">Service is temporarily unavailable. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl shadow-black/40">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mb-4">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Password Updated</h1>
              <p className="text-sm text-zinc-400">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Update Password</h1>
              {!ready ? (
                <div className="text-zinc-500 text-sm">Preparing...</div>
              ) : (
                <>
                  <p className="text-sm text-zinc-500 mb-6">
                    Enter your new password below.
                  </p>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full px-4 py-3 text-white border border-white/10 rounded-lg bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 placeholder-zinc-600 transition-colors"
                      minLength={6}
                    />
                    <button
                      disabled={loading}
                      className="w-full bg-violet-600 text-white rounded-lg px-4 py-3 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/20"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
