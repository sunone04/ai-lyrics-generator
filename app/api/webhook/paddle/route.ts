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

    // 3. 检查timestamp是否过期（5秒内）
    const timestampInt = parseInt(timestamp) * 1000;
    if (isNaN(timestampInt)) {
      console.error('Invalid timestamp format');
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const currentTime = Date.now();
    if (currentTime - timestampInt > 5000) {
      console.error('Webhook event expired (timestamp is over 5 seconds old)');
      return NextResponse.json({ message: 'Event expired' }, { status: 408 });
    }

    // 4. 构建signed payload
    const bodyRaw = await request.text();
    const signedPayload = `${timestamp}:${bodyRaw}`;

    // 5. 使用HMAC SHA256验证签名
    const hashedPayload = createHmac('sha256', config.webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // 6. 比较签名
    if (!timingSafeEqual(Buffer.from(hashedPayload), Buffer.from(signature))) {
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
