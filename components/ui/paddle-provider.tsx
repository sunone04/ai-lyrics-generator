'use client';

import { useEffect } from 'react';
import { getPaddleConfig } from '@/lib/paddle';

declare global {
  interface Window {
    Paddle: any;
  }
}

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const config = getPaddleConfig();
    
    if (!config.clientId) {
      console.warn('Paddle client ID not configured');
      return;
    }

    // 动态加载Paddle.js
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    
    script.onload = () => {
      if (window.Paddle) {
        // 设置环境
        window.Paddle.Environment.set(config.environment);
        
        // 初始化Paddle
        window.Paddle.Initialize({ 
          token: config.clientId
        });
        
        console.log(`Paddle initialized in ${config.environment} mode`);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Paddle.js');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 清理脚本
      const existingScript = document.querySelector('script[src*="paddle.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return <>{children}</>;
}
