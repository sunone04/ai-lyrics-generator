'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CreditCard, Calendar, AlertTriangle } from 'lucide-react';

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    cancelAtPeriodEnd: boolean;
    priceId: string;
    amount: string;
    currency: string;
    interval: string;
  };
  message?: string;
}

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/manage');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (action: string) => {
    if (!subscription?.subscription?.id) return;

    setActionLoading(action);
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          subscriptionId: subscription.subscription.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} subscription`);
      }

      toast.success(data.message);
      await fetchSubscription(); // Refresh subscription data
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} subscription`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseInt(amount) / 100; // Paddle amounts are in cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const },
      canceled: { label: 'Canceled', variant: 'secondary' as const },
      paused: { label: 'Paused', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'secondary' as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.hasSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            You don&apos;t have an active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {subscription?.message || 'No subscription found'}
          </p>
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sub = subscription.subscription!;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Status</h3>
            <p className="text-sm text-muted-foreground">Current subscription status</p>
          </div>
          {getStatusBadge(sub.status)}
        </div>

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Billing Cycle
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatAmount(sub.amount, sub.currency)} per {sub.interval}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Next Billing Date</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(sub.nextBillingDate)}
            </p>
          </div>
        </div>

        {/* Cancellation Warning */}
        {sub.cancelAtPeriodEnd && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Subscription Ending</h4>
              <p className="text-sm text-yellow-700">
                Your subscription will end on {formatDate(sub.currentPeriodEnd)}. 
                You&apos;ll lose access to premium features after this date.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={() => handleSubscriptionAction('cancel')}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel Subscription
            </Button>
          )}

          {sub.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => handleSubscriptionAction('pause')}
              disabled={actionLoading === 'pause'}
            >
              {actionLoading === 'pause' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Pause Subscription
            </Button>
          )}

          {sub.status === 'paused' && (
            <Button
              onClick={() => handleSubscriptionAction('resume')}
              disabled={actionLoading === 'resume'}
            >
              {actionLoading === 'resume' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resume Subscription
            </Button>
          )}

          {sub.cancelAtPeriodEnd && (
            <Button
              onClick={() => handleSubscriptionAction('resume')}
              disabled={actionLoading === 'resume'}
            >
              {actionLoading === 'resume' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reactivate Subscription
            </Button>
          )}

          <Button variant="outline" asChild>
            <a href="/pricing">Change Plan</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}