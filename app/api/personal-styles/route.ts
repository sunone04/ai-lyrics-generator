import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { PersonalStyleFormData } from '@/lib/types';

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

    // 获取用户的个人风格
    const { data: personalStyles, error: fetchError } = await supabase
      .from('personal_styles')
      .select('*')
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
    console.error('Error in GET /api/personal-styles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // 检查用户是否已达到5首限制
    const { count: existingCount, error: countError } = await supabase
      .from('personal_styles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting personal styles:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to check personal styles limit' },
        { status: 500 }
      );
    }

    if (existingCount && existingCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum limit of 5 personal styles reached' },
        { status: 400 }
      );
    }

    // 获取请求数据
    const body: PersonalStyleFormData = await request.json();
    
    // 验证必填字段
    if (!body.title || !body.lyrics) {
      return NextResponse.json(
        { success: false, error: 'Title and lyrics are required' },
        { status: 400 }
      );
    }

    // 验证长度限制
    if (body.title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (body.lyrics.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Lyrics must be 500 characters or less' },
        { status: 400 }
      );
    }

    // 计算字数
    const wordCount = body.lyrics.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // 插入个人风格
    const { data: personalStyle, error: insertError } = await supabase
      .from('personal_styles')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        lyrics: body.lyrics.trim(),
        music_style: body.music_style?.trim() || null,
        language: body.language || 'English',
        word_count: wordCount
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting personal style:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create personal style' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      personalStyle
    });

  } catch (error) {
    console.error('Error in POST /api/personal-styles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
