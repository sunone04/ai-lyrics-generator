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
        customData: { plan_name: plan.name, user_id: user.id }
      });

      if (result.status === 'completed') {
        toast.success('Payment successful. Updating membership...');
        try { await auth?.refreshProfile?.(true); } catch {}

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
        try { router.push('/'); } catch { window.location.href = '/'; }
      } else if (result.status === 'error') {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to open checkout:', error);
      toast.error(error?.message || 'Failed to open payment page');
    }
  };

  return (
    <div className={`relative rounded-2xl border transition-transform duration-200 hover:-translate-y-1 ${
      plan.popular
        ? 'border-violet-500/30 bg-violet-600/5 ring-1 ring-violet-500/20'
        : 'border-white/5 bg-white/[0.02]'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-8 pb-24 min-h-[640px] flex flex-col">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
          <p className="text-xs text-zinc-500 mb-6">{plan.description}</p>
          <div className="mb-4">
            <span className="text-4xl font-bold text-white">{plan.price}</span>
            <span className="text-zinc-500 ml-2 text-sm">/{plan.period}</span>
          </div>
        </div>

        <div className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckIcon className="w-4 h-4 text-emerald-400 mt-0.5 mr-2.5 flex-shrink-0" />
              <span className="text-xs text-zinc-400">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center absolute left-8 right-8 bottom-6">
          {plan.priceId ? (
            <button
              onClick={handleSubscribe}
              disabled={false}
              className={`w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                plan.popular
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {plan.cta}
            </button>
          ) : (
            <a
              href="/auth/signin"
              className={`block w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-center ${
                plan.popular
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {plan.cta}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
