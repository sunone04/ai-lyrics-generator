'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPriceId } from '@/lib/paddle';

declare global {
  interface Window {
    Paddle: any;
  }
}

export interface PaddleCheckoutOptions {
  plan?: 'monthly' | 'yearly';
  priceId?: string; // allow direct priceId override
  customerEmail?: string;
  successUrl?: string;
  customData?: Record<string, any>;
}

export type PaddleCheckoutResult =
  | { status: 'completed'; data?: any }
  | { status: 'closed' }
  | { status: 'error'; error: any };

export function usePaddle() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let intervalId: any = null;
    let attempts = 0;
    const maxAttempts = 50; // ~10s at 200ms

    const checkPaddleLoaded = () => {
      try {
        if (window.Paddle && (window.Paddle.Initialized || typeof window.Paddle.Checkout?.open === 'function')) {
          setIsLoaded(true);
          if (intervalId) { clearInterval(intervalId); intervalId = null; }
          return;
        }
      } catch {}
      attempts += 1;
      if (attempts >= maxAttempts && intervalId) {
        // Stop polling after max attempts to avoid fluid CPU usage
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Immediate check, then short-term polling until ready
    checkPaddleLoaded();
    intervalId = setInterval(checkPaddleLoaded, 200);

    // Also respond to explicit provider event
    const onReady = () => {
      setIsLoaded(true);
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };
    window.addEventListener('paddle:ready', onReady);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('paddle:ready', onReady);
    };
  }, []);

  const openCheckout = useCallback(async (options: PaddleCheckoutOptions): Promise<PaddleCheckoutResult> => {
    if (!isLoaded) {
      throw new Error('Paddle not loaded');
    }

    setIsLoading(true);
    
    try {
      const priceId = options.priceId || (options.plan ? getPriceId(options.plan) : undefined);
      if (!priceId) {
        throw new Error('Missing priceId');
      }
      
      const checkoutOptions: any = {
        items: [{
          priceId: priceId,
          quantity: 1
        }],
        settings: {
          // Do not force a redirect by default; keep overlay UX
          ...(options.successUrl ? { successUrl: options.successUrl } : {}),
          locale: 'en'
        }
      };

      // 添加客户信息
      if (options.customerEmail) {
        checkoutOptions.customer = {
          email: options.customerEmail
        };
      }

      // 添加自定义数据
      if (options.customData) {
        checkoutOptions.customData = options.customData;
      }

      return new Promise<PaddleCheckoutResult>((resolve) => {
        let settled = false;

        const onLoaded = (e: Event) => { /* no-op, keep for potential UI hooks */ };
        const onClosed = (e: Event) => {
          if (!settled) { settled = true; cleanup(); resolve({ status: 'closed' }); }
        };
        const onCompleted = (e: Event) => {
          if (!settled) { settled = true; cleanup(); resolve({ status: 'completed', data: (e as CustomEvent).detail }); }
        };
        const onError = (e: Event) => {
          if (!settled) { settled = true; cleanup(); resolve({ status: 'error', error: (e as CustomEvent).detail }); }
        };

        const cleanup = () => {
          try { window.removeEventListener('paddle:checkoutLoaded', onLoaded); } catch {}
          try { window.removeEventListener('paddle:checkoutClosed', onClosed); } catch {}
          try { window.removeEventListener('paddle:checkoutCompleted', onCompleted); } catch {}
          try { window.removeEventListener('paddle:checkoutError', onError); } catch {}
          try { clearTimeout(timeoutId); } catch {}
        };

        // Attach listeners for this open call
        window.addEventListener('paddle:checkoutLoaded', onLoaded);
        window.addEventListener('paddle:checkoutClosed', onClosed);
        window.addEventListener('paddle:checkoutCompleted', onCompleted);
        window.addEventListener('paddle:checkoutError', onError);

        // Safety timeout to avoid hanging forever
        const timeoutId = setTimeout(() => {
          if (!settled) { settled = true; cleanup(); resolve({ status: 'error', error: new Error('Checkout timeout') }); }
        }, 120000);

        window.Paddle.Checkout.open({
          ...checkoutOptions
        });
      });
    } catch (error) {
      console.error('Failed to open Paddle checkout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!isLoaded) {
      throw new Error('Paddle not loaded');
    }

    // 这里需要调用后端API来取消订阅
    // 因为取消订阅需要服务器端权限
    throw new Error('Subscription cancellation must be done through the server');
  }, [isLoaded]);

  return {
    isLoaded,
    isLoading,
    openCheckout,
    cancelSubscription
  };
}
