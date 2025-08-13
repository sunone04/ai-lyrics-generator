'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { PRICING } from '@/lib/constants';
import { Profile } from '@/lib/types';
import { CheckIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import SubscribeButton from '@/components/SubscribeButton';

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSubscribe = async (priceId: string, planType: 'monthly' | 'yearly') => {
    if (!user) {
      // 直接跳转到登录页面
      window.location.href = '/auth/signin';
      return;
    }
  };

  const features = {
    free: [
      '1 lyrics generation per day',
      'Basic AI model',
      'Download as TXT file',
      'Up to 3 favorites',
      'Standard support'
    ],
    monthly: [
      '30 lyrics generations per day',
      '30 AI rewrites per day',
      '📊 Monthly total: 900 generations!',
      'Pro AI model (higher quality)',
      'Download as TXT file',
      'Up to 100 favorites',
      'Advanced editing tools',
      'Commercial usage rights',
      'Audio preview feature',
      'Priority support'
    ],
    yearly: [
      '30 lyrics generations per day',
      '30 AI rewrites per day',
      '📊 Yearly total: 21,600 generations!',
      'Pro AI model (higher quality)',
      'Download as TXT file',
      'Up to 100 favorites',
      'Advanced editing tools',
      'Commercial usage rights',
      'Audio preview feature',
      'Priority support'
    ]
  };

  return (
    <>
      <Head>
        <title>AI Lyrics Generator Pricing - Affordable Plans for Musicians & Rappers</title>
        <meta name="description" content="Choose the perfect AI lyrics generator plan for your music creation needs. Free and premium options available. Generate unlimited song lyrics, rap lyrics, and hip-hop verses with our professional AI lyric generator." />
        <meta name="keywords" content="ai lyrics generator pricing, song lyrics generator cost, rap lyrics generator plans, lyric generator subscription, ai songwriting pricing, music lyrics generator plans" />
        <link rel="canonical" href="/pricing" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "AI Lyrics Generator Premium",
            "description": "Professional AI lyrics generator for musicians and songwriters",
            "offers": [
              {
                "@type": "Offer",
                "name": "Free Plan",
                "price": "0",
                "priceCurrency": "USD",
                "description": "1 generation per day"
              },
              {
                "@type": "Offer",
                "name": "Premium Plan",
                "price": "19.9",
                "priceCurrency": "USD",
                "priceValidUntil": "2025-12-31",
                "description": "30 generations per day, advanced features"
              }
            ]
          })}
        </script>
      </Head>
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI Lyrics Generator Pricing Plans
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your music creation needs. Start free or upgrade to unlock professional AI lyrics generator features for unlimited song lyrics and rap lyrics creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 flex flex-col">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for trying out</p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {user && profile?.status === 'free' ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-800 py-4 px-8 rounded-md font-semibold cursor-not-allowed text-lg"
                  >
                    Current Plan
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => window.location.href = '/auth/signin'}
                    className="w-full bg-gray-200 text-gray-800 py-4 px-8 rounded-md font-semibold hover:bg-gray-300 transition-colors cursor-pointer text-lg"
                  >
                    Get Started
                  </button>
                ) : null}
              </div>
            </div>

            {/* Monthly Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 relative flex flex-col">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${PRICING.monthly.price}
                  <span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Auto-renews monthly • Cancel anytime</p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {features.monthly.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {profile?.status === 'active' ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-800 py-4 px-8 rounded-md font-semibold cursor-not-allowed text-lg"
                  >
                    当前套餐
                  </button>
                ) : (
                  <SubscribeButton
                    priceId={process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!}
                    planType="monthly"
                    className="w-full py-4 px-8 rounded-md font-semibold transition-colors text-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    订阅月度套餐
                  </SubscribeButton>
                )}
              </div>
            </div>

            {/* Yearly Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Best Value
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${PRICING.yearly.price}
                  <span className="text-lg text-gray-600">/year</span>
                </div>
                <p className="text-gray-600">
                  Auto-renews yearly • Save {PRICING.yearly.discount}% • ${((PRICING.monthly.price * 12) - PRICING.yearly.price).toFixed(0)} off
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {features.yearly.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {profile?.status === 'active' ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-800 py-4 px-8 rounded-md font-semibold cursor-not-allowed text-lg"
                  >
                    当前套餐
                  </button>
                ) : (
                  <SubscribeButton
                    priceId={process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!}
                    planType="yearly"
                    className="w-full py-4 px-8 rounded-md font-semibold transition-colors text-lg bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-500 ring-offset-2"
                  >
                    订阅年度套餐
                  </SubscribeButton>
                )}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can cancel your subscription at any time. You&apos;ll continue to have access 
                  to premium features until the end of your billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What&apos;s the difference between Basic and Pro AI models?
                </h3>
                <p className="text-gray-600">
                  The Pro model uses advanced AI technology that produces higher quality, more creative 
                  lyrics with better understanding of context and style. It&apos;s perfect for professional use.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I use the generated lyrics commercially?
                </h3>
                <p className="text-gray-600">
                  Premium subscribers can use generated lyrics for commercial purposes. Free users 
                  can use lyrics for personal projects only.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long are my lyrics stored?
                </h3>
                <p className="text-gray-600">
                  For privacy protection, unfavorited lyrics are automatically deleted after 24 hours. 
                  Favorited lyrics are stored permanently in your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}