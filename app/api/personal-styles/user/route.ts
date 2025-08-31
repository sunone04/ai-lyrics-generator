import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient();
    
    // 检查用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查用户是否为会员
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Premium membership required' },
        { status: 403 }
      );
    }

    // 获取用户的个人风格（只返回必要字段用于选择）
    const { data: personalStyles, error: fetchError } = await supabase
      .from('personal_styles')
      .select('id, title, music_style, language')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching personal styles:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch personal styles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      personalStyles: personalStyles || []
    });

  } catch (error) {
    console.error('Error in GET /api/personal-styles/user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
