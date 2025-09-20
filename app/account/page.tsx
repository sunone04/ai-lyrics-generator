'use client';

import { useAuth, hasAuthHintCookie } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  UserIcon,
  KeyIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useTrial } from '@/lib/hooks/use-trial';
import { TrialStatus } from '@/components/ui/trial-activation';

export default function AccountPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isInTrial } = useTrial();

  useEffect(() => {
    // 仅在存在登录提示 Cookie 时尝试拉取用户信息，避免游客访问产生请求
    try {
      if (!user && hasAuthHintCookie()) {
        void refreshProfile();
      }
    } catch {}
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const goResetPassword = async () => {
    try {
      // 跳转到重置密码页面
      router.push('/auth/reset-password');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to navigate to reset password page');
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      
      toast.success('Signed out successfully');
      
      // 延迟重定向，让用户看到成功消息
      timeoutRef.current = setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleForceSignOut = async () => {
    try {
      setSigningOut(true);
      
      // 强制清除本地状态 - 通过重定向来触发重新认证
      toast.success('Force signed out successfully');
      
      // 延迟重定向
      timeoutRef.current = setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (error) {
      console.error('Force sign out error:', error);
      toast.error('Force sign out failed. Please try again.');
    } finally {
      setSigningOut(false);
    }
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Plan:</span>
              {profile.status === 'active' ? (
                <span className="font-medium px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Pro</span>
              ) : isInTrial ? (
                <span className="font-medium px-2 py-1 rounded-full text-sm bg-orange-100 text-orange-700">Trial</span>
              ) : (
                <span className="font-medium px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">Free</span>
              )}
            </div>
            
            {profile.status === 'active' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-medium text-gray-900">
                    {profile.subscription_start_date 
                      ? new Date(profile.subscription_start_date).toLocaleDateString() 
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-medium text-gray-900">
                    {profile.subscription_end_date 
                      ? new Date(profile.subscription_end_date).toLocaleDateString() 
                      : '-'
                    }
                  </span>
                </div>
              </>
            )}

            {/* Trial info when active */}
            {profile.status !== 'active' && isInTrial && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Trial Ends:</span>
                <span className="font-medium text-gray-900">
                  {profile.trial_end_date ? new Date(profile.trial_end_date).toLocaleDateString() : '-'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trial Status Only (auto-activation handled globally) */}
        <TrialStatus />

        {/* Quick Actions Card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          
          <div className="space-y-3">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className="flex items-center justify-between w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">View Dashboard</span>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Pricing Link */}
            <Link
              href="/pricing"
              className="flex items-center justify-between w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">View Pricing</span>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Reset Password */}
            <button
              onClick={goResetPassword}
              className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <KeyIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Reset Password</span>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sign Out</h2>
              <p className="text-sm text-gray-500 mt-1">Sign out of your account</p>
            </div>
                         <button
               onClick={handleSignOut}
               className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
               title="Click to sign out of your account"
             >
               <ArrowRightOnRectangleIcon className="w-5 h-5" />
               <span>Sign Out</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
