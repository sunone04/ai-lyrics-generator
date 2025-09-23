'use client';

import { useState } from 'react';
import { usePaddle } from '@/lib/hooks/use-paddle';
import toast from 'react-hot-toast';
import { useOptionalAuth } from '@/lib/contexts/auth-context';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  priceId: string | null;
  popular?: boolean;
  cta: string;
}

interface PricingCardProps {
  plan: PricingPlan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  const { openCheckout, isLoaded } = usePaddle();
  const auth = useOptionalAuth();
  const user = auth?.user;
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!isLoaded) {
      // still allow user to click; soft-warn only
      console.warn('Paddle is still loading');
    }

    if (!user?.email) {
      toast.error('Please sign in to subscribe');
      const ret = encodeURIComponent('/pricing');
      window.location.href = `/auth/signin?returnTo=${ret}`;
      return;
    }

    try {
      const result = await openCheckout({
        priceId: plan.priceId || undefined,
        customerEmail: user.email,
        // No redirect by default; keep in overlay and handle via events
        customData: { plan_name: plan.name, user_id: user.id }
      });

      if (result.status === 'completed') {
        toast.success('Payment successful. Updating membership...');
        // 先尝试立即刷新
        try { await auth?.refreshProfile?.(true); } catch {}

        // 轮询最多 ~20s 等待后端（webhook/队列）完成写入，避免用户手动刷新
        const waitUntilActive = async (timeoutMs = 15000, intervalMs = 2500) => {
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            try {
              const res = await fetch('/api/subscription/status', { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                const st = data?.status;
                if (st === 'active') return true;
              }
            } catch {}
            await new Promise((r) => setTimeout(r, intervalMs));
          }
          return false;
        };

        try { await waitUntilActive(); } catch {}

        try { await auth?.refreshProfile?.(true); } catch {}
        toast.success('Membership updated! Redirecting...');

        // 成功后跳回首页
        try { router.push('/'); } catch { window.location.href = '/'; }
      } else if (result.status === 'error') {
        toast.error('Payment failed. Please try again.');
      } else {
        // closed
        // No toast needed; user just closed the checkout
      }
    } catch (error: any) {
      console.error('Failed to open checkout:', error);
      toast.error(error?.message || 'Failed to open payment page');
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border-2 transition-transform duration-200 hover:-translate-y-1 ${plan.popular
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
