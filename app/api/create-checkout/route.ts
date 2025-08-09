import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { paddleAPI } from '@/lib/paddle-api';

export async function POST(request: NextRequest) {
  // Hoist primitives so they are visible in catch for fallback response
  let userId: string | null = null
  let customerEmail: string | null = null
  let priceId: string | undefined
  let planType: string | undefined

  try {
    // 验证用户认证
    const { user: authedUser } = await requireAuth();
    userId = authedUser.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customerEmail = (authedUser as any).email ?? null

    const body = await request.json();
    priceId = body.priceId
    planType = body.planType

    if (!priceId || !planType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create Paddle checkout using official API
    const checkoutData = await paddleAPI.createCheckout(
      [
        {
          price_id: priceId,
          quantity: 1
        }
      ],
      {
        userId: userId!,
        planType: planType,
        customerEmail: customerEmail,
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?subscription=cancelled`
      }
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutData.data.url,
      checkoutId: checkoutData.data.id,
      subscription_type: 'recurring',
      plan_type: planType
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    
    // Fallback to client-side checkout if API fails
    if (error?.message?.includes('Paddle API error')) {
      return NextResponse.json({
        success: true,
        useClientSide: true,
        priceId,
        planType,
        customerEmail,
        userId
      });
    }
    
    return NextResponse.json(
      { error: (error && error.message) ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}