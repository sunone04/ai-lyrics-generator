'use client';

import { useAuth } from '@/lib/contexts/auth-context';
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
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isInTrial } = useTrial();

  useEffect(() => {
    try {
      if (!user) {
        // no-op
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
      toast.success('Force signed out successfully');
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
      <div className="min-h-screen noise-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-sm text-zinc-500">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen noise-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-sm text-zinc-500 mb-6">Please sign in to access your account.</p>
          <Link href="/auth/signin" className="inline-flex items-center bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-bg py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">Account Information</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-zinc-500">Email:</span>
              <span className="text-sm font-medium text-white">{user.email}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-zinc-500">Plan:</span>
              {profile.status === 'active' ? (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Pro</span>
              ) : isInTrial ? (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Trial</span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Free</span>
              )}
            </div>
            
            {profile.status === 'active' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-500">Start Date:</span>
                  <span className="text-sm font-medium text-white">
                    {profile.subscription_start_date 
                      ? new Date(profile.subscription_start_date).toLocaleDateString() 
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-500">End Date:</span>
                  <span className="text-sm font-medium text-white">
                    {profile.subscription_end_date 
                      ? new Date(profile.subscription_end_date).toLocaleDateString() 
                      : '-'
                    }
                  </span>
                </div>
              </>
            )}

            {profile.status !== 'active' && isInTrial && (
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-500">Trial Ends:</span>
                <span className="text-sm font-medium text-white">
                  {profile.trial_end_date ? new Date(profile.trial_end_date).toLocaleDateString() : '-'}
                </span>
              </div>
            )}
          </div>
        </div>

        <TrialStatus />

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-between w-full p-3 text-left rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-zinc-300">View Dashboard</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
            </Link>

            <Link
              href="/pricing"
              className="flex items-center justify-between w-full p-3 text-left rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <CurrencyDollarIcon className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-zinc-300">View Pricing</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
            </Link>

            <button
              onClick={goResetPassword}
              className="flex items-center justify-between w-full p-3 text-left rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <KeyIcon className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-zinc-300">Reset Password</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 group-hover:text-zinc-400 transition-all" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Sign Out</h2>
              <p className="text-xs text-zinc-500 mt-1">Sign out of your account</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              title="Click to sign out of your account"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
