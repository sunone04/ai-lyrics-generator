'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, profile, loading } = useAuth();

  const goResetPassword = async () => {
    // 这里可以添加重置密码的逻辑
    toast.info('Reset password functionality coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="space-y-1">
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{user.email}</span></div>
          <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{profile.status === 'active' ? 'Pro' : 'Free'}</span></div>
          {profile.status === 'active' && (
            <>
              <div><span className="text-gray-500">Start:</span> <span className="font-medium">{profile.subscription_start_date ? new Date(profile.subscription_start_date).toLocaleString() : '-'}</span></div>
              <div><span className="text-gray-500">End:</span> <span className="font-medium">{profile.subscription_end_date ? new Date(profile.subscription_end_date).toLocaleString() : '-'}</span></div>
            </>
          )}
        </div>
        
        <div className="pt-4 space-y-3">
          <button
            onClick={goResetPassword}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}


