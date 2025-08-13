'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      // 重定向到Paddle结账页面
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('未收到支付链接');
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
