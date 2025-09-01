import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { PersonalStyleFormData } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 检查用户是否为会员（含试用字段）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, trial_start_date, trial_end_date, is_trial_used')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 本地推断试用期
    const now = new Date();
    const ts = profile.trial_start_date ? new Date(profile.trial_start_date as unknown as string) : null;
    const te = profile.trial_end_date ? new Date(profile.trial_end_date as unknown as string) : null;
    const isInTrial = !!(ts && te && now >= ts && now <= te);

    if (profile.status !== 'active' && !isInTrial) {
      return NextResponse.json(
        { success: false, error: 'Premium membership or free trial required' },
        { status: 403 }
      );
    }

    // 检查个人风格是否存在且属于当前用户
    const { data: existingStyle, error: fetchError } = await supabase
      .from('personal_styles')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingStyle) {
      return NextResponse.json(
        { success: false, error: 'Personal style not found' },
        { status: 404 }
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
    
    // 更新个人风格
    const { data: updatedStyle, error: updateError } = await supabase
      .from('personal_styles')
      .update({
        title: body.title.trim(),
        lyrics: body.lyrics.trim(),
        music_style: body.music_style?.trim() || null,
        language: body.language || 'English',
        word_count: wordCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, title, music_style, language, word_count, created_at, updated_at, lyrics')
      .single();

    if (updateError) {
      console.error('Error updating personal style:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update personal style' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      personalStyle: updatedStyle
    });

  } catch (error) {
    console.error('Error in PUT /api/personal-styles/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is in trial period
    const { data: isInTrial, error: trialCheckError } = await supabase
      .rpc('is_user_in_trial_period', { user_uuid: user.id });

    if (trialCheckError) {
      console.error('Error checking trial status:', trialCheckError);
      return NextResponse.json(
        { success: false, error: 'Failed to check trial status' },
        { status: 500 }
      );
    }

    if (profile.status !== 'active' && !isInTrial) {
      return NextResponse.json(
        { success: false, error: 'Premium membership or free trial required' },
        { status: 403 }
      );
    }

    // 检查个人风格是否存在且属于当前用户
    const { data: existingStyle, error: fetchError } = await supabase
      .from('personal_styles')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingStyle) {
      return NextResponse.json(
        { success: false, error: 'Personal style not found' },
        { status: 404 }
      );
    }

    // 删除个人风格
    const { error: deleteError } = await supabase
      .from('personal_styles')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting personal style:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete personal style' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error in DELETE /api/personal-styles/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
