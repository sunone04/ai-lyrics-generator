'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border rounded-md px-3 py-2"
        />
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded-md px-4 py-2">
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>
    </div>
  );
}


