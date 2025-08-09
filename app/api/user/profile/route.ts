import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { userService } from '@/lib/user-service';

export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase } = await requireAuth();

    // Get user profile
    const profile = await userService.getOrCreateUserProfile(user.id);

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}