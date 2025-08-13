'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';

interface SubscribeButtonProps {
  priceId: string;
  planType: 'monthly' | 'yearly';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function SubscribeButton({
  priceId,
  planType,
  disabled = false,
  className = '',
  children
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    
    try {
      // 获取当前用户的认证token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          planType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败，请稍后重试');
      }

      // 处理响应数据
      if (data.transactionId) {
        // 如果是开发模式的测试页面，直接跳转
        if (data.isTestMode && data.url) {
          window.location.href = data.url;
          return;
        }
        
        // 检查Paddle.js是否已加载
        if (typeof window !== 'undefined' && window.Paddle) {
          try {
            // 打开Paddle结账页面
            window.Paddle.Checkout.open({
              transactionId: data.transactionId
            });
          } catch (paddleError: any) {
            console.error('Paddle结账页面打开失败:', paddleError);
            toast.error('支付页面打开失败，请稍后重试');
          }
        } else {
          // 如果Paddle.js未加载，显示错误
          toast.error('支付系统未正确加载，请刷新页面重试');
        }
      } else {
        throw new Error('未收到交易ID');
      }
    } catch (error: any) {
      toast.error(error.message || '创建订单失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading || disabled}
      className={className}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          处理中...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
