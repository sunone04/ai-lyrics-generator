// 文件路径: app/api/paddle/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import { SubscriptionService } from '@/lib/subscription-service';
import { cacheService } from '@/lib/cache-service';

const isDev = process.env.NODE_ENV !== 'production';

// Paddle webhook event types (support both US/UK spelling for canceled)
const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELED_US: 'subscription.canceled',
  SUBSCRIPTION_CANCELED_UK: 'subscription.cancelled',
  SUBSCRIPTION_PAST_DUE: 'subscription.past_due',
  SUBSCRIPTION_PAUSED: 'subscription.paused',
  SUBSCRIPTION_RESUMED: 'subscription.resumed',
  TRANSACTION_COMPLETED: 'transaction.completed',
  TRANSACTION_BILLING_UPDATE: 'transaction.billing_details_updated',
  TRANSACTION_PAYMENT_FAILED: 'transaction.payment_failed',
  TRANSACTION_PAYMENT_REFUNDED: 'transaction.payment_refunded',
} as const;

export async function POST(request: NextRequest) {
  try {
    // === 关键变更: 以更可靠的方式读取原始请求体 ===
    // 官方文档强调签名验证必须使用原始的、未被修改的请求体。
    // 为了避免 request.text() 可能带来的潜在问题（如处理空字符），
    // 我们直接将请求体读取为 Buffer。
    const rawBodyBuffer = await request.arrayBuffer();
    const rawBody = Buffer.from(rawBodyBuffer);
    const body = rawBody.toString('utf-8');
    
    const signatureHeader = request.headers.get('paddle-signature');

    // 静默调试信息，避免生产日志

    if (!signatureHeader) {
      console.error('Missing Paddle signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 签名验证
    const isValid = verifyWebhookSignature(body, signatureHeader);
    if (!isValid) {
      // 返回 401 状态码，告知 Paddle 签名验证失败，以便其重试。
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    if (!event.event_type) {
        return NextResponse.json({ error: 'Invalid event body' }, { status: 400});
    }
    // 静默

    // 使用管理员客户端处理事件
    const supabase = await createAdminClient();

    // 确保异步操作不会阻塞响应
    // 将事件入队用于审计和备份处理
    const eventId = crypto.createHash('sha256').update(body).digest('hex');
    try {
      await (supabase as any)
        .from('paddle_webhook_queue')
        .insert({
          event_id: eventId,
          event_type: event.event_type,
          payload: event,
        })
        .select('id, event_id, event_type, created_at');
    } catch (e) {}

    // 立即处理关键事件
    try {
      await processWebhookEvent(supabase, event);
    } catch (error) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 验证 Paddle Webhook 签名。
 * @param body Webhook 请求的原始 body。
 * @param signatureHeader Webhook 请求头中的 `Paddle-Signature`。
 * @returns {boolean} 如果签名有效，则返回 true；否则返回 false。
 */
function verifyWebhookSignature(body: string, signatureHeader: string): boolean {
  try {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PADDLE_WEBHOOK_SECRET not configured');
      return false;
    }

    // Paddle signature format: "ts=timestamp;h1=<hex>" 或 "t=timestamp,h1=<hex>"
    // 静默
    
    // 尝试分号分隔 (新格式)，如果失败则尝试逗号分隔 (旧格式)
    let parts = signatureHeader.split(';').map(p => p.trim());
    let delimiter = ';';
    
    if (parts.length < 2) {
      parts = signatureHeader.split(',').map(p => p.trim());
      delimiter = ',';
    }
    
    // 静默
    
    let timestamp = '';
    let sig = '';
    for (const part of parts) {
      const [k, v] = part.split('=', 2).map(s => s.trim());
      if (!k || !v) continue;
      // 支持 ts 和 t 两种时间戳键名
      if (k.toLowerCase() === 'ts' || k.toLowerCase() === 't') timestamp = v;
      if (k.toLowerCase() === 'h1') sig = v;
    }

    // 静默

    if (!timestamp || !sig) {
      // 静默
      return false;
    }

    // 可选地验证时间戳新鲜度 (5 秒，按照官方文档建议)
    const now = Math.floor(Date.now() / 1000);
    const tsNum = parseInt(timestamp, 10);
    if (!Number.isNaN(tsNum) && Math.abs(now - tsNum) > 5) {
      // 静默
    }

    // 签名计算 (官方文档格式: timestamp:body)
    const payload = `${timestamp}:${body}`;
    // 静默
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // 静默

    // 使用 timingSafeEqual 防止计时攻击
    const isValid = crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    // 静默
    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * 根据事件类型处理 Webhook 事件。
 * @param supabase Supabase 管理员客户端。
 * @param event Webhook 事件对象。
 */
async function processWebhookEvent(supabase: any, event: any) {
  const { event_type, data } = event;

  switch (event_type) {
    case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
      await handleSubscriptionCreated(supabase, data);
      break;
    case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
      await handleSubscriptionUpdated(supabase, data);
      break;
    case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED_US:
    case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED_UK:
      await handleSubscriptionCancelled(supabase, data);
      break;
    case WEBHOOK_EVENTS.SUBSCRIPTION_PAST_DUE:
      await handleSubscriptionPastDue(supabase, data);
      break;
    case WEBHOOK_EVENTS.SUBSCRIPTION_PAUSED:
      await handleSubscriptionPaused(supabase, data);
      break;
    case WEBHOOK_EVENTS.SUBSCRIPTION_RESUMED:
      await handleSubscriptionResumed(supabase, data);
      break;
    case WEBHOOK_EVENTS.TRANSACTION_COMPLETED:
      await handleTransactionCompleted(supabase, data);
      break;
    case WEBHOOK_EVENTS.TRANSACTION_PAYMENT_FAILED:
      await handlePaymentFailed(supabase, data);
      break;
    case WEBHOOK_EVENTS.TRANSACTION_PAYMENT_REFUNDED:
      await handlePaymentRefunded(supabase, data);
      break;
    default:
      if (isDev) console.log('Unhandled webhook event type:', event_type);
  }
}

/**
 * 处理订阅创建事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionCreated(supabase: any, data: any) {
  if (isDev) {
    console.log('=== Processing subscription.created ===');
    console.log('Raw data:', JSON.stringify(data, null, 2));
  }
  
  // 解析数据结构 - 根据 Paddle 实际发送的数据结构
  // subscription.created 的 data 即为订阅对象本身
  const subscription = data?.subscription || data?.data?.subscription || data;
  const customerId = subscription?.customer_id || data?.customer_id || null;
  const custom_data = subscription?.custom_data || data?.custom_data || data?.data?.custom_data;
  
  if (isDev) {
    console.log('Parsed subscription:', subscription);
    console.log('Parsed customerId:', customerId);
    console.log('Parsed custom_data:', custom_data);
  }

  // 优先通过 custom_data (用户 ID) 进行关联
  let userId: string | null = null;
  if (custom_data) {
    // 常用键名来传递应用用户 ID
    userId = custom_data.user_id || custom_data.app_user_id || custom_data.appUserId || custom_data.uid || null;
  }

  if (isDev) console.log('Extracted userId from custom_data:', userId);

  let profile: any = null;
  let error: any = null;
  
  if (userId) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    profile = profileData;
    error = profileError;
    if (isDev) console.log('Profile found by userId:', profile);
  }

  // Fallback to email match
  if (!profile && subscription?.customer?.email) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('email', subscription.customer.email).single();
    profile = profileData;
    error = profileError;
    if (isDev) console.log('Profile found by email:', profile);
  }

  if (error || !profile) {
    console.error('User not found for subscription:', subscription?.customer?.email, userId, error);
    return;
  }

  // 解析价格ID - 支持多种数据结构
  let priceId = null;
  if (subscription?.items?.[0]?.price?.id) {
    priceId = subscription.items[0].price.id;
  } else if (subscription?.price?.id) {
    priceId = subscription.price.id;
  } else if (data?.data?.items?.[0]?.price?.id) {
    priceId = data.data.items[0].price.id;
  }
  
  if (isDev) console.log('Extracted priceId:', priceId);
  
  // 提取订阅详细信息 - 支持多种数据结构
  const subscriptionId = subscription?.id || data?.data?.id || null;
  
  // 尝试多种可能的时间字段路径
  let currentPeriodStart = null;
  let currentPeriodEnd = null;
  let nextBillingDate = null;
  
  if (subscription?.current_billing_period?.starts_at) {
    currentPeriodStart = subscription.current_billing_period.starts_at;
  } else if (subscription?.started_at) {
    currentPeriodStart = subscription.started_at;
  } else if (subscription?.created_at) {
    currentPeriodStart = subscription.created_at;
  }
  
  if (subscription?.current_billing_period?.ends_at) {
    currentPeriodEnd = subscription.current_billing_period.ends_at;
  } else if (subscription?.next_billed_at) {
    currentPeriodEnd = subscription.next_billed_at;
  } else if (subscription?.renewal_date) {
    currentPeriodEnd = subscription.renewal_date;
  }
  
  if (subscription?.next_billed_at) {
    nextBillingDate = subscription.next_billed_at;
  } else if (subscription?.renewal_date) {
    nextBillingDate = subscription.renewal_date;
  } else if (subscription?.next_payment_date) {
    nextBillingDate = subscription.next_payment_date;
  }
  
  if (isDev) {
    console.log('Extracted dates:', {
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate
    });
  }
  
  // 根据价格ID推断计划信息
  const planInfo = SubscriptionService.inferPlanFromPriceId(priceId);

  if (isDev) {
    console.log('Subscription details:', {
      subscriptionId,
      priceId,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate,
      planInfo
    });
  }

  // 更新用户档案与订阅详情
  const updateData = {
    status: 'active',
    paddle_customer_id: customerId,
    active_price_id: priceId,
    paddle_subscription_id: subscriptionId,
    subscription_plan_name: planInfo.planName,
    subscription_billing_cycle: planInfo.billingCycle,
    subscription_start_date: currentPeriodStart,
    subscription_end_date: currentPeriodEnd,
    next_billing_date: nextBillingDate,
    updated_at: new Date().toISOString()
  };
  
  if (isDev) console.log('Updating profile with data:', updateData);

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);

  if (updateError) {
    console.error('Failed to update user profile:', updateError);
    return;
  }

  // 清除用户相关缓存，确保订阅状态立即更新
  try {
    await cacheService.clearUserCache(profile.id);
    await cacheService.clearPaymentCache(profile.id);
    if (isDev) console.log('User cache cleared after profile update');
  } catch (cacheError) {
    console.warn('Failed to clear user cache:', cacheError);
  }

  if (isDev) console.log('Successfully updated user profile for subscription:', profile.id);
}

/**
 * 处理订阅更新事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionUpdated(supabase: any, data: any) {
  if (isDev) {
    console.log('=== Processing subscription.updated ===');
    console.log('Raw data:', JSON.stringify(data, null, 2));
  }
  
  // 解析数据结构 - 根据 Paddle 实际发送的数据结构
  const subscription = data?.subscription || data?.data?.subscription || data?.data;
  const customer = data?.customer || data?.data?.customer;
  
  if (isDev) {
    console.log('Parsed subscription:', subscription);
    console.log('Parsed customer:', customer);
  }

  // 解析价格ID - 支持多种数据结构
  let priceId = null;
  if (subscription?.items?.[0]?.price?.id) {
    priceId = subscription.items[0].price.id;
  } else if (subscription?.price?.id) {
    priceId = subscription.price.id;
  } else if (data?.data?.items?.[0]?.price?.id) {
    priceId = data.data.items[0].price.id;
  }
  
  if (isDev) console.log('Extracted priceId:', priceId);
  
  // 提取订阅详细信息 - 支持多种数据结构
  const subscriptionId = subscription?.id || data?.data?.id || null;
  
  // 尝试多种可能的时间字段路径
  let currentPeriodStart = null;
  let currentPeriodEnd = null;
  let nextBillingDate = null;
  
  if (subscription?.current_billing_period?.starts_at) {
    currentPeriodStart = subscription.current_billing_period.starts_at;
  } else if (subscription?.started_at) {
    currentPeriodStart = subscription.started_at;
  } else if (subscription?.created_at) {
    currentPeriodStart = subscription.created_at;
  }
  
  if (subscription?.current_billing_period?.ends_at) {
    currentPeriodEnd = subscription.current_billing_period.ends_at;
  } else if (subscription?.next_billed_at) {
    currentPeriodEnd = subscription.next_billed_at;
  } else if (subscription?.renewal_date) {
    currentPeriodEnd = subscription.renewal_date;
  }
  
  if (subscription?.next_billed_at) {
    nextBillingDate = subscription.next_billed_at;
  } else if (subscription?.renewal_date) {
    nextBillingDate = subscription.renewal_date;
  } else if (subscription?.next_payment_date) {
    nextBillingDate = subscription.next_payment_date;
  }
  
  if (isDev) {
    console.log('Extracted dates:', {
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate
    });
  }
  
  // 根据价格ID推断计划信息
  const planInfo = SubscriptionService.inferPlanFromPriceId(priceId);

  if (isDev) {
    console.log('Subscription details:', {
      subscriptionId,
      priceId,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate,
      planInfo
    });
  }

  // 更新用户档案与订阅详情
  const updateData = {
    active_price_id: priceId,
    paddle_subscription_id: subscriptionId,
    subscription_plan_name: planInfo.planName,
    subscription_billing_cycle: planInfo.billingCycle,
    subscription_start_date: currentPeriodStart,
    subscription_end_date: currentPeriodEnd,
    next_billing_date: nextBillingDate,
    updated_at: new Date().toISOString()
  };
  
  if (isDev) console.log('Updating profile with data:', updateData);

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('paddle_customer_id', customer?.id);

  if (error) {
    console.error('Failed to update subscription:', error);
    return;
  }

  // 清除用户相关缓存，确保订阅状态立即更新
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('paddle_customer_id', customer?.id)
      .single();
    
    if (profile) {
      await cacheService.clearUserCache(profile.id);
      await cacheService.clearPaymentCache(profile.id);
      if (isDev) console.log('User cache cleared after subscription update');
    }
  } catch (cacheError) {
    console.warn('Failed to clear user cache:', cacheError);
  }

  if (isDev) console.log('Successfully updated subscription for customer:', customer?.id);
}

/**
 * 处理订阅取消事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionCancelled(supabase: any, data: any) {
  const { customer, subscription } = data;

  // 首先获取用户当前的收藏数量
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('favorite_count')
    .eq('paddle_customer_id', customer.id)
    .single();

  if (fetchError) {
    console.error('Failed to fetch user profile for cancellation:', fetchError);
    return;
  }

  // 如果用户有超过免费限制的收藏，需要处理
  if (profile.favorite_count > 3) {
    console.log(`User has ${profile.favorite_count} favorites, exceeding free limit of 3`);
  }

  // 获取订阅的结束时间（用户可能在当前周期结束前仍有访问权限）
  const subscriptionEndDate = subscription?.current_billing_period?.ends_at || null;

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'canceled',
      subscription_canceled_at: new Date().toISOString(),
      // 如果有结束时间，保留到期时间，让用户在当前周期结束前仍可使用
      subscription_end_date: subscriptionEndDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('paddle_customer_id', customer.id);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  } else {
    // 清除用户相关缓存，确保订阅状态立即更新
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('paddle_customer_id', customer.id)
        .single();
      
      if (profile) {
        await cacheService.clearUserCache(profile.id);
        await cacheService.clearPaymentCache(profile.id);
        if (isDev) console.log('User cache cleared after subscription cancellation');
      }
    } catch (cacheError) {
      console.warn('Failed to clear user cache:', cacheError);
    }
    
    if (isDev) console.log('Subscription cancelled successfully for customer:', customer.id);
  }
}

/**
 * 处理订阅逾期事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionPastDue(supabase: any, data: any) {
  const { customer } = data;

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('paddle_customer_id', customer.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  } else {
    // 清除用户相关缓存，确保订阅状态立即更新
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('paddle_customer_id', customer.id)
        .single();
      
      if (profile) {
        await cacheService.clearUserCache(profile.id);
        await cacheService.clearPaymentCache(profile.id);
        if (isDev) console.log('User cache cleared after subscription past due update');
      }
    } catch (cacheError) {
      console.warn('Failed to clear user cache:', cacheError);
    }
    
    if (isDev) console.log('Subscription past due, user status updated');
  }
}

/**
 * 处理订阅暂停事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionPaused(supabase: any, data: any) {
  const { customer } = data;

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('paddle_customer_id', customer.id);

  if (error) {
    console.error('Failed to pause subscription:', error);
  } else {
    if (isDev) console.log('Subscription paused, user status updated');
  }
}

/**
 * 处理订阅恢复事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleSubscriptionResumed(supabase: any, data: any) {
  const { customer } = data;

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('paddle_customer_id', customer.id);

  if (error) {
    console.error('Failed to resume subscription:', error);
  }
}

/**
 * 处理交易完成事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handleTransactionCompleted(supabase: any, data: any) {
  if (isDev) {
    console.log('=== Processing transaction.completed ===');
    console.log('Raw data:', JSON.stringify(data, null, 2));
  }

  // 从 webhook 数据中提取信息
  const customData = data.custom_data || {};
  const customerId = data.customer_id;
  const subscriptionId = data.subscription_id;
  const priceId = data.items?.[0]?.price_id;

  if (isDev) {
    console.log('Extracted data:', {
      customerId,
      subscriptionId,
      priceId,
      customData
    });
  }

  // 如果有订阅ID，说明这是订阅相关的交易，需要激活用户订阅
  if (subscriptionId && customData.user_id) {
    try {
      // 首先通过 user_id 查找用户
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customData.user_id)
        .single();

      if (fetchError || !profile) {
        console.error('User not found for transaction:', customData.user_id, fetchError);
        return;
      }

      // 从billing_period获取开始和结束时间
      let startDate = null;
      let endDate = null;
      
      if (data.billing_period?.starts_at) {
        startDate = data.billing_period.starts_at;
      } else if (data.started_at) {
        startDate = data.started_at;
      }
      
      if (data.billing_period?.ends_at) {
        endDate = data.billing_period.ends_at;
      } else if (data.next_billed_at) {
        endDate = data.next_billed_at;
      }

      console.log('Extracted dates:', { startDate, endDate });

      // 根据环境变量判断计划类型
      const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
      const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;
      
      let planName = 'Unknown Plan';
      let billingCycle = 'unknown';
      
      if (priceId === monthlyPriceId) {
        planName = 'AI Lyrics Generator - Monthly Plan';
        billingCycle = 'monthly';
      } else if (priceId === yearlyPriceId) {
        planName = 'AI Lyrics Generator - Yearly Plan';
        billingCycle = 'yearly';
      }

      if (isDev) console.log('Plan info:', { planName, billingCycle });

      // 更新用户订阅状态
      const updateData = {
          status: 'active',
          paddle_customer_id: customerId,
          active_price_id: priceId,
        paddle_subscription_id: subscriptionId,
        subscription_plan_name: planName,
        subscription_billing_cycle: billingCycle,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
          updated_at: new Date().toISOString()
      };

      if (isDev) console.log('Updating profile with data:', updateData);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) {
        console.error('Failed to update user profile after transaction:', updateError);
      } else {
        if (isDev) console.log('User subscription activated after transaction:', profile.email, customData.user_id);
      }
    } catch (error) {
      console.error('Error processing transaction completion:', error);
    }
  }
}

/**
 * 处理支付失败事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handlePaymentFailed(supabase: any, data: any) {
  const { transaction, customer } = data;

  console.log('Payment failed:', {
    transaction_id: transaction.id,
    customer_email: customer.email,
    error_code: transaction.details?.payment_attempt?.error_code,
  });
  
  // 可以选择更新用户状态，例如将其标记为 'payment_issue' 或类似状态
  if (customer && customer.id) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'payment_issue',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_customer_id', customer.id);

    if (updateError) {
      console.error('Failed to update profile status for payment failure:', updateError);
    }
  }
}

/**
 * 处理退款事件。
 * @param supabase Supabase 管理员客户端。
 * @param data 事件数据。
 */
async function handlePaymentRefunded(supabase: any, data: any) {
  const { transaction, customer } = data;

  console.log('Payment refunded:', {
    transaction_id: transaction.id,
    customer_email: customer.email,
    refund_amount: transaction.details?.totals?.grand_total,
  });

  // 如果退款是全额退款，可以考虑取消用户的订阅状态
  if (customer && customer.id) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_customer_id', customer.id);

    if (updateError) {
      console.error('Failed to update profile status for refund:', updateError);
    }
  }
}
