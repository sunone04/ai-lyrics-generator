import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

// 初始化Paddle SDK
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NODE_ENV === 'production' ? Environment.production : Environment.sandbox,
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

    // 暂时返回模拟的支付链接（开发阶段）
    // TODO: 集成真实的Paddle支付流程
    const mockCheckoutUrl = `https://checkout.paddle.com/mock/${priceId}?user_id=${user.id}&plan_type=${planType}`;
    
    return NextResponse.json({
      url: mockCheckoutUrl,
      transactionId: `mock_${Date.now()}`,
      message: '开发模式：这是模拟的支付链接'
    });

  } catch (error: any) {
    console.error('创建支付链接失败:', error);
    
    return NextResponse.json(
      { error: '创建支付链接失败，请稍后重试' },
      { status: 500 }
    );
  }
}
