'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

export default function TestPaymentPage() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const priceId = searchParams.get('priceId');
  const planType = searchParams.get('planType');
  const userId = searchParams.get('userId');

  useEffect(() => {
    // 模拟支付处理
    if (priceId && planType && userId) {
      setIsProcessing(true);
      
      // 模拟3秒的支付处理时间
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setIsCompleted(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [priceId, planType, userId]);

  if (!priceId || !planType || !userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XIcon className="h-5 w-5" />
              参数错误
            </CardTitle>
            <CardDescription>
              缺少必要的支付参数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button className="w-full">返回定价页面</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isCompleted ? '支付成功！' : '测试支付页面'}
          </CardTitle>
          <CardDescription>
            {isCompleted 
              ? '您的订阅已激活' 
              : '这是一个测试页面，用于验证订阅流程'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 支付信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">支付详情</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>套餐类型:</span>
                <span className="font-medium">
                  {planType === 'monthly' ? '月度套餐' : '年度套餐'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>价格ID:</span>
                <span className="font-mono text-xs">{priceId}</span>
              </div>
              <div className="flex justify-between">
                <span>用户ID:</span>
                <span className="font-mono text-xs">{userId}</span>
              </div>
            </div>
          </div>

          {/* 状态显示 */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">正在处理支付...</p>
            </div>
          )}

          {isCompleted && (
            <div className="text-center py-4">
              <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-2">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">支付完成！</p>
              <p className="text-sm text-gray-600 mt-1">
                您的订阅已激活，现在可以使用所有高级功能
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            {isCompleted ? (
              <>
                <Link href="/dashboard">
                  <Button className="w-full" size="lg">
                    前往仪表板
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    返回定价页面
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    返回定价页面
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  注意：这是一个测试页面，不会产生真实的支付
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
