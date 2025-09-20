import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getPaddleConfig } from '@/lib/paddle';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const config = getPaddleConfig();
    
    if (!config.webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json({ message: 'Server misconfigured' }, { status: 500 });
    }

    // 1. 获取Paddle-Signature header
    const paddleSignature = request.headers.get('paddle-signature');
    
    if (!paddleSignature) {
      console.error('Paddle-Signature not present in request headers');
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // 2. 提取 ts 与 h1（允许未来扩展段）
    const dict: Record<string, string> = {};
    for (const seg of paddleSignature.split(';')) {
      const [k, v] = seg.split('=');
      if (k && v) dict[k.trim()] = v.trim();
    }
    const timestamp = dict['ts'];
    const signature = dict['h1'];
    if (!timestamp || !signature) {
      console.error('Missing ts or h1 in Paddle-Signature');
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // 3. 检查timestamp是否过期（容忍 5 分钟内，避免网络抖动）
    const timestampInt = parseInt(timestamp) * 1000;
    if (isNaN(timestampInt)) {
      console.error('Invalid timestamp format');
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const currentTime = Date.now();
    if (currentTime - timestampInt > 5 * 60 * 1000) {
      console.error('Webhook event expired (timestamp is over 5 minutes old)');
      return NextResponse.json({ message: 'Event expired' }, { status: 408 });
    }

    // 4. 构建signed payload
    const bodyRaw = await request.text();
    const signedPayload = `${timestamp}:${bodyRaw}`;

    // 5. 使用HMAC SHA256验证签名
    const hashedPayload = createHmac('sha256', config.webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // 6. 比较签名（使用恒定时间比较，先确保长度一致）
    const hashBuf = Buffer.from(hashedPayload, 'hex');
    const sigBuf = Buffer.from(signature, 'hex');
    if (hashBuf.length !== sigBuf.length || !timingSafeEqual(hashBuf, sigBuf)) {
      console.error('Computed signature does not match Paddle signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // 7. 入队，快速返回（推荐实践：异步处理）
    const bodyJson = JSON.parse(bodyRaw);
    const eventType = bodyJson?.event_type || bodyJson?.eventType || 'unknown';
    const eventId = bodyJson?.event_id
      || (bodyJson?.data?.id ? `${eventType}:${bodyJson.data.id}` : `${eventType}:${timestamp}`);

    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      await admin
        .from('paddle_webhook_queue')
        .insert({
          event_id: String(eventId),
          event_type: String(eventType),
          payload: bodyJson,
        });

      // Opportunistic immediate handling (in addition to queue):
      // If custom_data carries user_id and event denotes a successful transaction,
      // mark the user's profile as active and seed start/end dates to improve UX.
      try {
        const cd = (bodyJson?.data?.custom_data || bodyJson?.data?.customData || bodyJson?.custom_data || bodyJson?.customData) as any;
        const userId = cd?.user_id || cd?.userId;

        const et = String(eventType || '').toLowerCase();
        const isPaid = et.includes('transaction.completed') || et.includes('payment.succeeded');

        if (userId && isPaid) {
          // Best-effort extraction of price/interval info from payload
          const data: any = bodyJson?.data || {};
          const items: any[] = (data.items || data.order?.items || []);
          const first = items && items.length > 0 ? items[0] : undefined;
          const price = first?.price || {};
          const priceId = first?.price?.id || first?.price_id || first?.priceId || null;
          const cycle = price?.billing_cycle || price?.billing_period || {};
          const interval: string | null = (cycle?.interval || null);
          const frequency: number = Number(cycle?.frequency || 1) || 1;
          const now = new Date();
          const startIso = now.toISOString();
          // Compute a naive end date based on interval/frequency when available
          const end = new Date(now.getTime());
          try {
            if (interval === 'year' || interval === 'annual' || interval === 'yearly') {
              end.setFullYear(end.getFullYear() + frequency);
            } else {
              // default to month if not specified
              end.setMonth(end.getMonth() + frequency);
            }
          } catch {}
          const endIso = end.toISOString();

          const update: Record<string, any> = {
            status: 'active',
            updated_at: startIso,
            subscription_start_date: startIso,
            subscription_end_date: endIso,
            next_billing_date: endIso,
          };
          if (priceId) update.active_price_id = String(priceId);
          const subscriptionId = data?.subscription_id || data?.subscription?.id || null;
          if (subscriptionId) update.paddle_subscription_id = String(subscriptionId);

          await admin
            .from('profiles')
            .update(update)
            .eq('id', userId);
        }
      } catch (e) {
        // Non-critical; queue processor remains source of truth
      }
    } catch (e) {
      // 冲突等错误可忽略（幂等）
      console.warn('enqueue webhook failed (ignored):', (e as any)?.message);
    }

    return NextResponse.json({ message: 'Enqueued' }, { status: 200 });
  } catch (error) {
    console.error('Failed to verify and process Paddle webhook', error);
    return NextResponse.json({ message: 'Failed to verify and process Paddle webhook' }, { status: 500 });
  }
}
// 处理逻辑改为入队，由数据库侧定时任务 process_paddle_webhooks 执行
