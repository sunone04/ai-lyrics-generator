'use client'

import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  CreditCardIcon, 
  CalendarIcon, 
  ShieldCheckIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionStatusText, getSubscriptionStatusColor } from '@/lib/paddle'

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  status: string;
  usage_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  
  // Paddle 相关字段
  paddle_customer_id?: string;
  active_price_id?: string;
  paddle_subscription_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  
  // 使用统计字段
  generation_count: number;
  rewrite_count: number;
  usage_last_reset: string;
}

// 根据价格ID获取计划名称
function getPlanName(priceId?: string): string {
  if (!priceId) return 'Unknown Plan';
  
  const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
  
  if (priceId === monthlyPriceId) {
    return 'AI Lyrics Generator - Monthly Plan';
  } else if (priceId === yearlyPriceId) {
    return 'AI Lyrics Generator - Yearly Plan';
  }
  
  return 'Unknown Plan';
}

// 根据价格ID获取计费周期
function getBillingCycle(priceId?: string): string {
  if (!priceId) return 'unknown';
  
  const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
  
  if (priceId === monthlyPriceId) {
    return 'monthly';
  } else if (priceId === yearlyPriceId) {
    return 'yearly';
  }
  
  return 'unknown';
}

interface AccountManagementProps {
  user: User
  profile: Profile
}

export default function AccountManagement({ user, profile }: AccountManagementProps) {
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile)
  const router = useRouter()

  // 只在页面加载时刷新一次，确保数据最新
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data?.profile) {
            setCurrentProfile(data.profile as Profile)
          }
        }
      } catch (error) {
        console.error('Failed to refresh profile:', error)
      }
    }
    
    refreshProfile()
  }, [user.id])

  const handlePasswordReset = async () => {
    if (!user?.email) return

    setIsResettingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      toast.error(error.message || 'Failed to send password reset email')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUsageLimit = (type: 'generation' | 'rewrite') => {
    if (currentProfile.status === 'active') {
      return type === 'generation' ? 30 : 30
    }
    return type === 'generation' ? 2 : 1
  }

  const getFavoriteLimit = () => {
    return currentProfile.status === 'active' ? 1000 : 3
  }

  return (
    <div className="mt-12 space-y-8">
      {/* Account Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionStatusColor(profile.status)}`}>
              {getSubscriptionStatusText(profile.status)}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Since
            </label>
            <div className="text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          {currentProfile.paddle_customer_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <div className="text-gray-900 font-mono text-sm">
                {currentProfile.paddle_customer_id}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCardIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
          </div>
          {currentProfile.status === 'free' && (
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {currentProfile.status === 'active' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Plan
                </label>
                <div className="text-gray-900">
                  {getPlanName(currentProfile.active_price_id)}
                  {getBillingCycle(currentProfile.active_price_id) === 'monthly' || getBillingCycle(currentProfile.active_price_id) === 'yearly' ? ` (${getBillingCycle(currentProfile.active_price_id)})` : ''}
                </div>
              </div>
              {currentProfile.subscription_start_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid At</label>
                  <div className="text-gray-900">
                    {new Date(currentProfile.subscription_start_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              {currentProfile.subscription_start_date && currentProfile.subscription_end_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Period</label>
                  <div className="text-gray-900">
                    {new Date(currentProfile.subscription_start_date).toLocaleDateString()} → {new Date(currentProfile.subscription_end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You are currently on the free plan. Upgrade to unlock premium features!
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 30 AI lyrics generations per day</li>
                <li>• 30 partial optimizations per day</li>
                <li>• Advanced AI model (Gemini 2.5 Pro)</li>
                <li>• Up to 1000 favorite lyrics</li>
                <li>• Commercial usage rights</li>
                <li>• Manual lyrics editing</li>
                <li>• Audio preview feature</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <CalendarIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Usage Today</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lyrics Generated
            </label>
            <div className="text-gray-900">
              {currentProfile.generation_count} / {getUsageLimit('generation')} per day
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(currentProfile.generation_count / getUsageLimit('generation')) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Rewrites Used
            </label>
            <div className="text-gray-900">
              {currentProfile.rewrite_count} / {getUsageLimit('rewrite')} per day
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(currentProfile.rewrite_count / getUsageLimit('rewrite')) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Favorite Lyrics
            </label>
            <div className="text-gray-900">
              {currentProfile.favorite_count} / {getFavoriteLimit()}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${(currentProfile.favorite_count / getFavoriteLimit()) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Usage resets daily. Last reset: {new Date(currentProfile.usage_last_reset).toLocaleDateString()}
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

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Dashboard
          </button>
          
          <button
            onClick={() => router.push('/generate')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Generate Lyrics
          </button>

          {currentProfile.status === 'free' && (
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
          
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )
}
