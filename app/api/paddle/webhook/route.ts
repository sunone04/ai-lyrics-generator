import { NextRequest, NextResponse } from 'next/server';
import { paddleAPI } from '@/lib/paddle-api';
import { userService } from '@/lib/user-service';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');

    if (!signature) {
      console.error('❌ Missing Paddle signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    try {
      const isValid = paddleAPI.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('❌ Invalid Paddle webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    // Parse webhook data
    const webhookData = JSON.parse(rawBody);
    const { event_type, data } = webhookData;

    console.log(`🔔 Received Paddle webhook: ${event_type}`);

    switch (event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;
      
      case 'subscription.paused':
        await handleSubscriptionPaused(data);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(data);
        break;
      
      case 'transaction.completed':
        await handleTransactionCompleted(data);
        break;
      
      case 'transaction.payment_failed':
        await handlePaymentFailed(data);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event_type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(data: any) {
  try {
    const { custom_data, customer_id, status, items } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in subscription.created webhook');
      return;
    }

    // Determine plan type from price ID
    const priceId = items?.[0]?.price?.id;
    const _planType = determinePlanType(priceId);

    await userService.updateSubscriptionStatus(
      userId,
      status === 'active' ? 'active' : 'canceled',
      customer_id,
      priceId
    );

    console.log(`✅ Subscription created for user ${userId}, status: ${status}`);
  } catch (error) {
    console.error('❌ Error handling subscription.created:', error);
  }
}

async function handleSubscriptionUpdated(data: any) {
  try {
    const { custom_data, customer_id, status, items } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in subscription.updated webhook');
      return;
    }

    const priceId = items?.[0]?.price?.id;
    const subscriptionStatus = mapPaddleStatus(status);

    await userService.updateSubscriptionStatus(
      userId,
      subscriptionStatus,
      customer_id,
      priceId
    );

    console.log(`✅ Subscription updated for user ${userId}, status: ${status}`);
  } catch (error) {
    console.error('❌ Error handling subscription.updated:', error);
  }
}

async function handleSubscriptionCanceled(data: any) {
  try {
    const { custom_data, customer_id } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in subscription.canceled webhook');
      return;
    }

    await userService.updateSubscriptionStatus(
      userId,
      'canceled',
      customer_id
    );

    console.log(`✅ Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling subscription.canceled:', error);
  }
}

async function handleSubscriptionPaused(data: any) {
  try {
    const { custom_data, customer_id } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in subscription.paused webhook');
      return;
    }

    await userService.updateSubscriptionStatus(
      userId,
      'canceled', // Treat paused as canceled for our purposes
      customer_id
    );

    console.log(`✅ Subscription paused for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling subscription.paused:', error);
  }
}

async function handleSubscriptionResumed(data: any) {
  try {
    const { custom_data, customer_id, items } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in subscription.resumed webhook');
      return;
    }

    const priceId = items?.[0]?.price?.id;

    await userService.updateSubscriptionStatus(
      userId,
      'active',
      customer_id,
      priceId
    );

    console.log(`✅ Subscription resumed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling subscription.resumed:', error);
  }
}

async function handleTransactionCompleted(data: any) {
  try {
    const { custom_data, customer_id, status } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in transaction.completed webhook');
      return;
    }

    // For successful payments, ensure user is active
    if (status === 'completed') {
      const profile = await userService.getUserProfile(userId);
      if (profile && profile.status !== 'active') {
        await userService.updateSubscriptionStatus(
          userId,
          'active',
          customer_id
        );
      }
    }

    console.log(`✅ Transaction completed for user ${userId}, status: ${status}`);
  } catch (error) {
    console.error('❌ Error handling transaction.completed:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { custom_data, customer_id } = data;
    const userId = custom_data?.userId;
    
    if (!userId) {
      console.error('❌ No userId in transaction.payment_failed webhook');
      return;
    }

    await userService.updateSubscriptionStatus(
      userId,
      'past_due',
      customer_id
    );

    console.log(`⚠️ Payment failed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling transaction.payment_failed:', error);
  }
}

function determinePlanType(priceId: string): string {
  const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
  
  if (priceId === monthlyPriceId) return 'monthly';
  if (priceId === yearlyPriceId) return 'yearly';
  return 'unknown';
}

function mapPaddleStatus(paddleStatus: string): 'free' | 'active' | 'canceled' | 'past_due' {
  switch (paddleStatus) {
    case 'active':
      return 'active';
    case 'canceled':
    case 'paused':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    default:
      return 'free';
  }
}