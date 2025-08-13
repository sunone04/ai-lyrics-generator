import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { validatePaddleConfig } from '@/lib/paddle-validator';

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

    // 验证Paddle配置
    const configValidation = validatePaddleConfig();
    if (!configValidation.isValid) {
      console.error('Paddle配置验证失败:', configValidation.errors);
      return NextResponse.json({
        error: '支付系统配置不完整，请联系管理员',
        details: configValidation.errors.join(', ')
      }, { status: 500 });
    }

    try {
      // 创建 Paddle 交易
      const transactionData = {
        items: [{
          priceId: priceId,
          quantity: 1
        }],
        customData: {
          user_id: user.id,
          plan_type: planType,
          customer_email: user.email!
        },
        // 如果有客户ID，可以设置客户
        ...(profile?.paddle_customer_id && {
          customerId: profile.paddle_customer_id
        })
      };

      console.log('创建交易数据:', transactionData);

      const transaction = await paddle.transactions.create(transactionData);

      // 检查交易是否创建成功
      if (!transaction || !transaction.id) {
        throw new Error('交易创建失败：无有效的交易ID');
      }

      // 根据 Paddle 文档，checkout URL 的格式应该是这样的
      let checkoutUrl: string;
      
      // 如果交易对象中直接包含checkout_url，使用它
      if ('checkoutUrl' in transaction && transaction.checkoutUrl) {
        checkoutUrl = transaction.checkoutUrl as string;
      } else {
        // 否则构建标准的checkout URL
        checkoutUrl = `https://checkout.paddle.com/transaction/${transaction.id}`;
      }

      console.log('Paddle交易创建成功:', {
        transactionId: transaction.id,
        checkoutUrl: checkoutUrl,
        userId: user.id,
        planType: planType,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      });

      return NextResponse.json({
        url: checkoutUrl,
        transactionId: transaction.id,
        message: '支付链接已创建'
      });

    } catch (paddleError: any) {
      console.error('Paddle API调用失败:', {
        error: paddleError,
        message: paddleError.message,
        stack: paddleError.stack,
        response: paddleError.response?.data
      });
      
      // 在开发环境中，如果Paddle API失败，返回测试页面
      if (process.env.NODE_ENV === 'development') {
        const testUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/test-payment?priceId=${priceId}&planType=${planType}&userId=${user.id}`;
        
        return NextResponse.json({
          url: testUrl,
          transactionId: `test_${Date.now()}`,
          message: '开发模式：Paddle API暂时不可用，已创建测试页面',
          warning: '这是一个测试链接，用于验证流程',
          paddleError: paddleError.message
        });
      } else {
        // 在生产环境中，返回更详细的错误信息
        return NextResponse.json({
          error: '支付系统暂时不可用，请稍后重试',
          details: paddleError.message || '无法创建支付链接'
        }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('创建支付链接失败:', error);
    
    return NextResponse.json(
      { error: '创建支付链接失败，请稍后重试' },
      { status: 500 }
    );
  }
}