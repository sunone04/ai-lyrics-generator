import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { userService } from '@/lib/user-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取用户的订阅信息
    const subscriptionInfo = await userService.getUserSubscriptionInfo(user.id);
    const membershipDisplay = await userService.getUserMembershipDisplay(user.id);

    const res = NextResponse.json({
      subscriptionInfo,
      membershipDisplay
    });
    // 私有缓存：30分钟，减少重复查询；支付事件发生时由服务端更新数据库即可
    res.headers.set('Cache-Control', 'private, max-age=1800');
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
