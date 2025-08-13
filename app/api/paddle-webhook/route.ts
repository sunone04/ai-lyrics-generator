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
    // 获取原始请求体
    const rawBody = await request.text();
    
    // 获取Paddle签名
    const signature = request.headers.get('Paddle-Signature');
    
    if (!signature) {
      console.error('缺少Paddle签名');
      return NextResponse.json(
        { error: '缺少签名' },
        { status: 400 }
      );
    }

         // 验证Webhook签名
     try {
       const event = await paddle.webhooks.unmarshal(
         rawBody,
         signature,
         process.env.PADDLE_WEBHOOK_SECRET!
       );
       
       console.log('Webhook事件类型:', event.eventType);
       console.log('Webhook事件数据:', JSON.stringify(event.data, null, 2));

       // 处理不同的事件类型
       switch (event.eventType) {
         case 'transaction.completed':
           await handleTransactionCompleted(event.data);
           break;
           
         case 'subscription.canceled':
           await handleSubscriptionCanceled(event.data);
           break;
           
         case 'subscription.updated':
           await handleSubscriptionUpdated(event.data);
           break;
           
         case 'subscription.paused':
           await handleSubscriptionPaused(event.data);
           break;
           
         default:
           console.log(`未处理的事件类型: ${event.eventType}`);
       }

      // 返回成功响应
      return NextResponse.json({ success: true });

    } catch (signatureError) {
      console.error('Webhook签名验证失败:', signatureError);
      return NextResponse.json(
        { error: '签名验证失败' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Webhook处理失败:', error);
    return NextResponse.json(
      { error: 'Webhook处理失败' },
      { status: 500 }
    );
  }
}

// 处理交易完成事件
async function handleTransactionCompleted(data: any) {
  try {
    const { custom_data, customer, items } = data;
    
    if (!custom_data?.user_id || !customer?.id || !items?.[0]?.price?.id) {
      console.error('交易完成事件缺少必要数据');
      return;
    }

    const userId = custom_data.user_id;
    const customerId = customer.id;
    const priceId = items[0].price.id;

    // 更新用户订阅状态
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        paddle_customer_id: customerId,
        active_price_id: priceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('更新用户订阅状态失败:', error);
    } else {
      console.log(`用户 ${userId} 订阅状态已更新为活跃`);
    }

  } catch (error) {
    console.error('处理交易完成事件失败:', error);
  }
}

// 处理订阅取消事件
async function handleSubscriptionCanceled(data: any) {
  try {
    const { customer } = data;
    
    if (!customer?.id) {
      console.error('订阅取消事件缺少客户ID');
      return;
    }

    // 更新用户订阅状态为已取消
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_customer_id', customer.id);

    if (error) {
      console.error('更新用户订阅状态失败:', error);
    } else {
      console.log(`客户 ${customer.id} 订阅已取消`);
    }

  } catch (error) {
    console.error('处理订阅取消事件失败:', error);
  }
}

// 处理订阅更新事件
async function handleSubscriptionUpdated(data: any) {
  try {
    const { customer, items } = data;
    
    if (!customer?.id || !items?.[0]?.price?.id) {
      console.error('订阅更新事件缺少必要数据');
      return;
    }

    // 更新用户的活跃价格ID
    const { error } = await supabase
      .from('profiles')
      .update({
        active_price_id: items[0].price.id,
        updated_at: new Date().toISOString()
      })
      .eq('paddle_customer_id', customer.id);

    if (error) {
      console.error('更新用户价格ID失败:', error);
    } else {
      console.log(`客户 ${customer.id} 价格ID已更新`);
    }

  } catch (error) {
    console.error('处理订阅更新事件失败:', error);
  }
}

// 处理订阅暂停事件
async function handleSubscriptionPaused(data: any) {
  try {
    const { customer } = data;
    
    if (!customer?.id) {
      console.error('订阅暂停事件缺少客户ID');
      return;
    }

    // 更新用户订阅状态为暂停
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_customer_id', customer.id);

    if (error) {
      console.error('更新用户订阅状态失败:', error);
    } else {
      console.log(`客户 ${customer.id} 订阅已暂停`);
    }

  } catch (error) {
    console.error('处理订阅暂停事件失败:', error);
  }
}
