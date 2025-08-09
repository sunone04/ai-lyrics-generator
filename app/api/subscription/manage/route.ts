import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { paddleAPI } from '@/lib/paddle-api';
import { userService } from '@/lib/user-service';

// Define action type and hoist variable so it's visible in catch
export type ManageAction = 'cancel' | 'pause' | 'resume';
let action: ManageAction | undefined;

export async function GET(_request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const profile = await userService.getUserProfile(user.id);

    if (!profile?.paddle_customer_id) {
      return NextResponse.json({
        hasSubscription: false,
        message: 'No active subscription found'
      });
    }

    // Get subscription details from Paddle
    const subscriptions = await paddleAPI.listSubscriptions(profile.paddle_customer_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSubscription = subscriptions.data?.find((sub: any) => 
      sub.status === 'active' || sub.status === 'past_due'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        hasSubscription: false,
        message: 'No active subscription found'
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.current_billing_period?.ends_at,
        nextBillingDate: activeSubscription.next_billed_at,
        cancelAtPeriodEnd: activeSubscription.scheduled_change?.action === 'cancel',
        priceId: activeSubscription.items?.[0]?.price?.id,
        amount: activeSubscription.items?.[0]?.price?.unit_price?.amount,
        currency: activeSubscription.items?.[0]?.price?.unit_price?.currency_code,
        interval: activeSubscription.items?.[0]?.price?.billing_cycle?.interval
      }
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: _user } = await requireAuth();
    const { action: actionInBody, subscriptionId } = await request.json();
    action = actionInBody as ManageAction;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'cancel':
        result = await paddleAPI.cancelSubscription(subscriptionId, 'next_billing_period');
        break;
      
      case 'pause':
        result = await paddleAPI.pauseSubscription(subscriptionId);
        break;
      
      case 'resume':
        result = await paddleAPI.resumeSubscription(subscriptionId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${action}ed successfully`,
      data: result
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Error ${action ? action + 'ing ' : ''}subscription:`, error);
    return NextResponse.json(
      { error: `Failed to ${action ?? 'process'} subscription` },
      { status: 500 }
    );
  }
}