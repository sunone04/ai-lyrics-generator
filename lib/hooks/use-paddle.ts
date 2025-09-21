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
        window.Paddle.Checkout.open({
          ...checkoutOptions,
          onLoaded: () => {
            // Paddle checkout loaded
          },
          onError: (error: any) => {
            console.error('Paddle checkout error:', error);
            // Treat as closed so UI can recover
            resolve({ status: 'error', error });
          },
          onComplete: (data: any) => {
            // Paddle checkout completed
            resolve({ status: 'completed', data });
          },
          onClose: () => {
            // Ensure callers can stop loading when user closes overlay
            resolve({ status: 'closed' });
          }
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
