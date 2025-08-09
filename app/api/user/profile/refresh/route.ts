import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { userService } from '@/lib/user-service';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase } = await requireAuth();

    // Force refresh user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error('Failed to refresh profile');
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error('Profile refresh error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to refresh profile' },
      { status: 500 }
    );
  }
}