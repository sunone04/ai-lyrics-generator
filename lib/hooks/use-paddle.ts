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

export function usePaddle() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkPaddleLoaded = () => {
      if (window.Paddle && (window.Paddle.Initialized || typeof window.Paddle.Checkout?.open === 'function')) {
        setIsLoaded(true);
      }
    };

    // 检查Paddle是否已加载
    checkPaddleLoaded();
    
    // 监听Paddle加载完成
    const interval = setInterval(checkPaddleLoaded, 200);
    
    return () => clearInterval(interval);
  }, []);

  const openCheckout = useCallback(async (options: PaddleCheckoutOptions) => {
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
          successUrl: options.successUrl || `${window.location.origin}/dashboard`,
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

      return new Promise<void>((resolve, reject) => {
        window.Paddle.Checkout.open({
          ...checkoutOptions,
          onLoaded: () => {
            // Paddle checkout loaded
          },
          onError: (error: any) => {
            console.error('Paddle checkout error:', error);
            // Treat as closed so UI can recover
            resolve();
          },
          onComplete: (data: any) => {
            // Paddle checkout completed
            resolve();
          },
          onClose: () => {
            // Ensure callers can stop loading when user closes overlay
            resolve();
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
