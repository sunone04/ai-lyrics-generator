'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePaddle } from '@/lib/hooks/use-paddle';
import { createClient } from '@/lib/supabase';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  priceId: string | null;
}

interface PricingCardProps {
  plan: Plan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  const [isLoading] = useState(false);
  const { openCheckout, isLoaded } = usePaddle();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 获取当前用户邮箱
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email || null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubscribe = async () => {
    if (!isLoaded) {
      // still allow user to click; soft-warn only
      console.warn('Paddle is still loading');
    }

    if (!userEmail) {
      alert('Please sign in to subscribe.');
      return;
    }

    try {
      const checkoutPromise = openCheckout({
        priceId: plan.priceId || undefined,
        customerEmail: userEmail,
        successUrl: `${window.location.origin}/dashboard`,
        customData: { plan_name: plan.name }
      });
      // No loading state; just fire and forget with a soft timeout to surface errors in console
      Promise.race([
        checkoutPromise,
        new Promise((resolve) => setTimeout(resolve, 10000))
      ]).catch(() => {});
    } catch (error) {
      console.error('Failed to open checkout:', error);
      alert('Failed to open payment page. Please try again.');
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border-2 transition-transform duration-200 hover:-translate-y-1 ${
      plan.popular 
        ? 'border-blue-500 ring-4 ring-blue-500/20' 
        : 'border-gray-200'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-8 pb-24 min-h-[640px] flex flex-col">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-6">{plan.description}</p>
          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
            <span className="text-gray-500 ml-2">/{plan.period}</span>
          </div>
        </div>

        <div className="space-y-4 mb-8 flex-1">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
          
          {/* no negative list */}
        </div>

        <div className="text-center absolute left-8 right-8 bottom-6">
          {plan.priceId ? (
            <button
              onClick={handleSubscribe}
              disabled={false}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              {plan.cta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
