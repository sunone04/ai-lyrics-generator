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
    res.headers.set('Cache-Control', 'private, max-age=1800');
    res.headers.set('Vary', 'Cookie');
    return res;
  } catch (error) {
    const res = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    res.headers.set('Cache-Control', 'private, max-age=0, no-store');
    res.headers.set('Vary', 'Cookie');
    return res;
  }
}
