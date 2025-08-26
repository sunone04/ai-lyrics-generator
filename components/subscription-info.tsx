'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Crown, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionDisplay {
  membershipType: string;
  expiryStatus: string;
  isExpiringSoon: boolean;
  isActive: boolean;
  isPremium: boolean;
  daysUntilExpiry: number | null;
  endDate: Date | null;
  nextBillingDate: Date | null;
  canceledAt: Date | null;
}

interface SubscriptionInfoProps {
  className?: string;
}

export function SubscriptionInfo({ className }: SubscriptionInfoProps) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription info');
      }

      const data = await response.json();
      setSubscriptionData(data.membershipDisplay);
    } catch (err) {
      console.error('Error fetching subscription info:', err);
      setError('无法获取订阅信息');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-red-500 text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const getStatusIcon = () => {
    if (subscriptionData.isPremium) {
      return subscriptionData.isExpiringSoon ? 
        <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
        <Crown className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (subscriptionData.isPremium) {
      if (subscriptionData.isExpiringSoon) {
        return <Badge variant="destructive">即将到期</Badge>;
      }
      if (subscriptionData.canceledAt) {
        return <Badge variant="secondary">已取消</Badge>;
      }
      return <Badge variant="default">活跃</Badge>;
    }
    return <Badge variant="outline">免费</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          会员信息
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">会员类型</div>
          <div className="font-medium">{subscriptionData.membershipType}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">状态</div>
          <div className={`font-medium ${
            subscriptionData.isExpiringSoon ? 'text-yellow-600' : 
            subscriptionData.isPremium ? 'text-green-600' : 'text-gray-600'
          }`}>
            {subscriptionData.expiryStatus}
          </div>
        </div>

        {subscriptionData.isPremium && subscriptionData.daysUntilExpiry !== null && (
          <div>
            <div className="text-sm text-gray-600 mb-1">剩余天数</div>
            <div className={`font-medium ${
              subscriptionData.daysUntilExpiry <= 7 ? 'text-red-600' :
              subscriptionData.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {subscriptionData.daysUntilExpiry > 0 ? 
                `${subscriptionData.daysUntilExpiry} 天` : 
                '已过期'
              }
            </div>
          </div>
        )}

        {subscriptionData.nextBillingDate && !subscriptionData.canceledAt && (
          <div>
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              下次计费
            </div>
            <div className="font-medium text-sm">
              {new Date(subscriptionData.nextBillingDate).toLocaleDateString('zh-CN')}
            </div>
          </div>
        )}

        {subscriptionData.canceledAt && (
          <div>
            <div className="text-sm text-gray-600 mb-1">取消时间</div>
            <div className="font-medium text-sm text-red-600">
              {new Date(subscriptionData.canceledAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
        )}

        {!subscriptionData.isPremium && (
          <div className="pt-2">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/pricing'}
            >
              升级到 Pro
            </Button>
          </div>
        )}

        {subscriptionData.isExpiringSoon && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/pricing'}
            >
              续费订阅
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
