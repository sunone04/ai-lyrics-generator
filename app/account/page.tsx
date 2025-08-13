'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { LoadingPage } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import SubscriptionManager from '@/components/subscription-manager';
import { 
  UserIcon,
  CreditCardIcon,
  KeyIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/signin');
          return;
        }
        
        setUser(user);

        // Get user profile
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load account information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const getStatusBadge = () => {
    if (!profile) return null;

    if (profile.status === 'free') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Free Plan
        </span>
      );
    } else if (profile.status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Premium Member
        </span>
      );
    }
    return null;
  };

  // 移除getRemainingDays函数，因为数据库中没有subscription_end_date字段

  if (isLoading) {
    return <LoadingPage text="Loading your account..." />;
  }

  if (!user || !profile) {
    return <div>Account information not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Account Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your account information and subscription
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-6">
                <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="text-gray-900">{user.email}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status
                  </label>
                  <div>{getStatusBadge()}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <div className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-6">
                <CreditCardIcon className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              </div>
              
              <div className="space-y-4">
                {profile.status === 'active' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Plan
                      </label>
                      <div className="text-gray-900">
                        Premium Subscription
                      </div>
                    </div>
                    
                    {profile.active_price_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price ID
                        </label>
                        <div className="text-gray-900 text-sm">
                          {profile.active_price_id}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer ID
                      </label>
                      <div className="text-gray-900 text-sm">
                        {profile.paddle_customer_id || 'Not available'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      You are currently on the free plan. Upgrade to unlock premium features!
                    </p>
                  </div>
                )}
                
                <div className="pt-4">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    {profile.status === 'active' ? 'Manage Subscription' : 'Upgrade Plan'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-6">
                <CalendarIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Usage Today</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lyrics Generated
                  </label>
                  <div className="text-gray-900">
                    {profile.generation_count || 0} / {profile.status === 'active' ? '30' : '1'} per day
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Rewrites Used
                  </label>
                  <div className="text-gray-900">
                    {profile.rewrite_count || 0} / {profile.status === 'active' ? '30' : '3'} per day
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <button
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <KeyIcon className="h-4 w-4 mr-2" />
                    {isResettingPassword ? 'Sending...' : 'Reset Password'}
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send you an email with instructions to reset your password
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          <div className="mt-8">
            <SubscriptionManager />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Dashboard
              </Link>
              
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}