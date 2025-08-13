import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Paddle } from '@paddle/paddle-node-sdk';

// 初始化Paddle SDK
const paddle = new Paddle({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  apiKey: process.env.PADDLE_API_KEY!,
});

// 初始化Supabase服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const { priceId, planType } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: '缺少价格ID' },
        { status: 400 }
      );
    }

    // 获取用户会话
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 验证用户身份
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: '用户身份验证失败' },
        { status: 401 }
      );
    }

    // 检查用户是否已有活跃订阅
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, paddle_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.status === 'active') {
      return NextResponse.json(
        { error: '您已有活跃订阅' },
        { status: 400 }
      );
    }

    // 创建Paddle交易
    const transaction = await paddle.transactions.create({
      items: [{
        price_id: priceId,
        quantity: 1
      }],
      customer: {
        email: user.email!
      },
      custom_data: {
        user_id: user.id,
        plan_type: planType
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?subscription=cancelled`
    });

    // 返回支付链接
    return NextResponse.json({
      url: transaction.checkout.url,
      transactionId: transaction.id
    });

  } catch (error: any) {
    console.error('创建支付链接失败:', error);
    
    return NextResponse.json(
      { error: '创建支付链接失败，请稍后重试' },
      { status: 500 }
    );
  }
}
