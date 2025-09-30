import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaddleConfig } from '@/lib/paddle';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false }, global: {} as any }
    );
    
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'No authorization token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // 验证token并获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户订阅信息（从profiles表）
    const authed = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } } as any,
      }
    );

    const { data: profile, error: profileError } = await authed
      .from('profiles')
      .select('status, active_price_id, paddle_subscription_id, next_billing_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ message: 'Failed to fetch subscription' }, { status: 500 });
    }

    // 根据status字段判断订阅状态
    let subscriptionStatus = 'free';
    let plan = null;
    
    if (profile.status === 'active') {
      subscriptionStatus = 'active';
      // 根据active_price_id判断计划类型
      if (profile.active_price_id) {
        // 这里可以根据价格ID判断是月付还是年付
        plan = 'monthly'; // 默认值，实际应该根据价格ID判断
      }
    } else if (profile.status === 'canceled') {
      subscriptionStatus = 'cancelled';
    } else if (profile.status === 'paused') {
      subscriptionStatus = 'paused';
    } else if (profile.status === 'past_due') {
      subscriptionStatus = 'past_due';
    }

    return NextResponse.json({
      status: subscriptionStatus,
      plan: plan,
      nextBillingDate: profile.next_billing_date,
      paddleSubscriptionId: profile.paddle_subscription_id
    });

  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false }, global: {} as any }
    );
    
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'No authorization token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // 验证token并获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscriptionId } = await request.json();

    switch (action) {
      case 'cancel':
        return await cancelSubscription(subscriptionId, supabase);
      case 'pause':
        return await pauseSubscription(subscriptionId, supabase);
      case 'resume':
        return await resumeSubscription(subscriptionId, supabase);
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function cancelSubscription(subscriptionId: string, supabase: any) {
  try {
    const config = getPaddleConfig();
    
    // 调用Paddle API取消订阅
    const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.statusText}`);
    }

    // 更新本地数据库（profiles表）使用服务端权限，避免 RLS 拒绝
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await admin
      .from('profiles')
      .update({
        status: 'canceled',
        subscription_canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating local subscription:', error);
    }

    return NextResponse.json({ message: 'Subscription cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ message: 'Failed to cancel subscription' }, { status: 500 });
  }
}

async function pauseSubscription(subscriptionId: string, supabase: any) {
  try {
    const config = getPaddleConfig();
    
    // 调用Paddle API暂停订阅
    const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/pause`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.statusText}`);
    }

    // 更新本地数据库（profiles表）使用服务端权限，避免 RLS 拒绝
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await admin
      .from('profiles')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating local subscription:', error);
    }

    return NextResponse.json({ message: 'Subscription paused successfully' });

  } catch (error) {
    console.error('Error pausing subscription:', error);
    return NextResponse.json({ message: 'Failed to pause subscription' }, { status: 500 });
  }
}

async function resumeSubscription(subscriptionId: string, supabase: any) {
  try {
    const config = getPaddleConfig();
    
    // 调用Paddle API恢复订阅
    const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.statusText}`);
    }

    // 更新本地数据库（profiles表）使用服务端权限，避免 RLS 拒绝
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await admin
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating local subscription:', error);
    }

    return NextResponse.json({ message: 'Subscription resumed successfully' });

  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json({ message: 'Failed to resume subscription' }, { status: 500 });
  }
}
