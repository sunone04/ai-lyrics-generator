'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.paddle_customer_id) {
      toast.error('无法找到订阅信息');
      return;
    }

    setIsCanceling(true);
    
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: profile.paddle_customer_id,
        }),
      });

      if (response.ok) {
        toast.success('订阅已取消，您将在当前计费周期结束后失去访问权限');
        // 刷新用户资料
        await fetchProfile();
      } else {
        const data = await response.json();
        throw new Error(data.error || '取消订阅失败');
      }
    } catch (error: any) {
      toast.error(error.message || '取消订阅失败，请稍后重试');
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">活跃</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">已取消</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">逾期</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">免费</Badge>;
    }
  };

  const getPlanName = (priceId?: string) => {
    if (!priceId) return '免费套餐';
    
    if (priceId === process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID) {
      return '月度套餐';
    } else if (priceId === process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID) {
      return '年度套餐';
    }
    
    return '高级套餐';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>订阅状态</CardTitle>
          <CardDescription>无法加载订阅信息</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 当前订阅状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            当前订阅
          </CardTitle>
          <CardDescription>
            您的AI歌词生成器订阅状态和详细信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">套餐类型</span>
            <span className="font-semibold">{getPlanName(profile.active_price_id)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">订阅状态</span>
            {getStatusBadge(profile.status)}
          </div>

          {profile.paddle_customer_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">客户ID</span>
              <span className="font-mono text-sm text-gray-500">
                {profile.paddle_customer_id.slice(0, 8)}...
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">最后更新</span>
            <span className="text-sm text-gray-500">
              {new Date(profile.updated_at).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 使用统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            今日使用统计
          </CardTitle>
          <CardDescription>
            您今天的使用情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">歌词生成次数</span>
            <span className="font-semibold">
              {profile.generation_count} / {profile.status === 'active' ? '30' : '1'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">AI重写次数</span>
            <span className="font-semibold">
              {profile.rewrite_count} / {profile.status === 'active' ? '30' : '0'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">重置日期</span>
            <span className="text-sm text-gray-500">
              {new Date(profile.usage_last_reset).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 订阅管理操作 */}
      {profile.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              订阅管理
            </CardTitle>
            <CardDescription>
              管理您的订阅设置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">取消订阅</p>
                  <p>取消后，您将在当前计费周期结束后失去对高级功能的访问权限。</p>
                </div>
              </div>
              
              <Button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '取消订阅'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 升级提示 */}
      {profile.status === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              升级到高级套餐
            </CardTitle>
            <CardDescription>
              解锁更多功能和更高的使用限制
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>每日1次生成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>无AI重写功能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>最多3个收藏</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>每日30次生成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>每日30次AI重写</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>最多100个收藏</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
              >
                查看套餐详情
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}