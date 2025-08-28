'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // 也尝试获取用户
    supabase.auth.getUser().then(() => setReady(true));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Update Password</h1>
        {!ready ? (
          <div className="text-gray-600">Preparing...</div>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full border rounded-md px-3 py-2"
              minLength={6}
            />
            <button disabled={loading} className="w-full bg-blue-600 text-white rounded-md px-4 py-2">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}


