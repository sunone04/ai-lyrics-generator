'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Service unavailable');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send');
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mb-4">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-sm text-zinc-400 mb-4">
                We&apos;ve sent a password reset link to <span className="text-violet-400">{email}</span>
              </p>
              <p className="text-xs text-zinc-600">
                Click the link in the email to set a new password. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-sm text-zinc-500 mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={onSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 text-white border border-white/10 rounded-lg bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 placeholder-zinc-600 transition-colors"
                />
                <button
                  disabled={loading}
                  className="w-full bg-violet-600 text-white rounded-lg px-4 py-3 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/20"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
