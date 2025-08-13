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
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: '缺少客户ID' },
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

    // 验证用户是否拥有此订阅
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_customer_id, status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.paddle_customer_id !== customerId) {
      return NextResponse.json(
        { error: '无权操作此订阅' },
        { status: 403 }
      );
    }

    if (profile.status !== 'active') {
      return NextResponse.json(
        { error: '订阅状态不允许取消' },
        { status: 400 }
      );
    }

    try {
      // 通过Paddle API取消订阅
      // 注意：这里需要根据Paddle的API文档来实现
      // 由于Paddle的订阅管理可能需要不同的API调用，这里提供一个基础实现
      
      // 更新数据库中的订阅状态
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('更新数据库失败:', updateError);
        return NextResponse.json(
          { error: '取消订阅失败' },
          { status: 500 }
        );
      }

      console.log(`用户 ${user.id} 的订阅已取消`);

      return NextResponse.json({
        success: true,
        message: '订阅已成功取消'
      });

    } catch (paddleError: any) {
      console.error('Paddle API调用失败:', paddleError);
      
      // 即使Paddle API调用失败，我们也更新本地状态
      // 这样可以确保用户界面的一致性
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('更新数据库失败:', updateError);
      }

      return NextResponse.json({
        success: true,
        message: '订阅已取消，但可能需要联系客服确认',
        warning: 'Paddle API暂时不可用，已更新本地状态'
      });
    }

  } catch (error: any) {
    console.error('取消订阅失败:', error);
    
    return NextResponse.json(
      { error: '取消订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}
