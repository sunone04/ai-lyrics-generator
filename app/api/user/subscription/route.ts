import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';
import { userService } from '@/lib/user-service';

export async function GET(request: NextRequest) {
  try {
    // 使用智能认证服务，避免重复认证
    const user = await authService.getAuthenticatedUser();
    
    if (!user) {
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
