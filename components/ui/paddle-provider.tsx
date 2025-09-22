'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getPaddleConfig } from '@/lib/paddle';

declare global {
  interface Window {
    Paddle: any;
  }
}

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const injectedRef = useRef(false);

  useEffect(() => {
    const config = getPaddleConfig();

    // 仅在定价/账户页加载以减少全站开销；支持路由切换
    if (typeof window !== 'undefined') {
      const path = pathname || window.location.pathname;
      const shouldLoad = [/^\/pricing/, /^\/account/].some((re) => re.test(path));
      if (!shouldLoad) return;
    }

    if (!config.clientId) {
      console.warn('Paddle client ID not configured');
      return;
    }

    // 若已加载则不重复注入
    if (injectedRef.current || (typeof window !== 'undefined' && (window as any).Paddle?.Checkout)) {
      try { (window as any).Paddle && ((window as any).Paddle as any).Initialized !== true && (((window as any).Paddle as any).Initialized = true); } catch {}
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      if (window.Paddle) {
        if (config.environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        }
        window.Paddle.Initialize({ 
          token: config.clientId,
          // Relay Paddle events to window for local consumers
          eventCallback: (event: any) => {
            try {
              const name = event?.name || '';
              if (name === 'checkout.loaded') {
                window.dispatchEvent(new CustomEvent('paddle:checkoutLoaded', { detail: event }));
              } else if (name === 'checkout.closed') {
                window.dispatchEvent(new CustomEvent('paddle:checkoutClosed', { detail: event }));
              } else if (name === 'checkout.completed') {
                window.dispatchEvent(new CustomEvent('paddle:checkoutCompleted', { detail: event }));
              } else if (name === 'checkout.error') {
                window.dispatchEvent(new CustomEvent('paddle:checkoutError', { detail: event }));
              }
            } catch {}
          }
        });
        try { (window.Paddle as any).Initialized = true; } catch {}
        try { window.dispatchEvent(new Event('paddle:ready')); } catch {}
      }
    };

    script.onerror = () => {
      console.error('Failed to load Paddle.js');
    };

    document.head.appendChild(script);
    injectedRef.current = true;
  }, [pathname]);

  return <>{children}</>;
}
