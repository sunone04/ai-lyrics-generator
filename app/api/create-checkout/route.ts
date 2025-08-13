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

    // 获取用户会话 - 支持多种认证方式
    let user = null;
    let authError = null;

    // 方法1: 从Authorization header获取
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    }

    // 方法2: 从Cookie获取（备用方案）
    if (!user && !authError) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // 尝试从cookie中提取Supabase session
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        // 这里可以添加从cookie中提取token的逻辑
        console.log('Cookie headers:', cookies);
      }
    }

    if (authError || !user) {
      console.error('认证失败:', { authError, user: !!user, hasAuthHeader: !!authHeader });
      return NextResponse.json(
        { error: '用户身份验证失败，请重新登录' },
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
