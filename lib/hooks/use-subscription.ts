'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface SubscriptionStatus {
  status: 'free' | 'active' | 'cancelled' | 'paused' | 'past_due';
  plan: 'monthly' | 'yearly' | null;
  nextBillingDate: string | null;
  paddleSubscriptionId: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription({
          status: 'free',
          plan: null,
          nextBillingDate: null,
          paddleSubscriptionId: null
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'cancel',
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // 重新获取订阅状态
      await fetchSubscription();
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    }
  };

  const pauseSubscription = async (subscriptionId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'pause',
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to pause subscription');
      }

      await fetchSubscription();
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'resume',
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      await fetchSubscription();
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const isPro = subscription?.status === 'active';
  const isFree = subscription?.status === 'free';

  return {
    subscription,
    loading,
    error,
    isPro,
    isFree,
    fetchSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
  };
}
