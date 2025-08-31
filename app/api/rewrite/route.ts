import { NextRequest, NextResponse } from 'next/server';
 
import { aiService } from '@/lib/ai-service';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { originalLyrics, selectedPortion, rewriteRequest, modelType } = await request.json();

    if (!originalLyrics || !selectedPortion || !rewriteRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 恢复认证逻辑
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 检查用户配额
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, rewrite_count, usage_last_reset')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 500 }
      );
    }

    // 检查是否需要重置计数
    const today = new Date().toDateString();
    if (profile.usage_last_reset !== today) {
      await supabase
        .from('profiles')
        .update({ 
          generation_count: 0, 
          rewrite_count: 0, 
          usage_last_reset: today 
        })
        .eq('id', user.id);
      profile.rewrite_count = 0;
    }

    // 检查重写配额限制
    const maxRewrites = profile.status === 'active' ? 30 : 1;
    if (profile.rewrite_count >= maxRewrites) {
      return NextResponse.json(
        { 
          error: 'Daily rewrite limit reached',
          message: profile.status === 'active' 
            ? 'You have reached your daily rewrite limit. Please try again tomorrow.'
            : 'You have reached your free daily rewrite limit. Upgrade to Pro for more rewrites.'
        },
        { status: 429 }
      );
    }

    // Pro模型权限校验
    if (modelType === 'pro' && profile.status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Pro model requires subscription',
          message: 'Please upgrade to Pro to use the advanced model'
        },
        { status: 403 }
      );
    }

    // Generate rewritten lyrics using AI service
    const rewrittenPortion = await aiService.rewriteLyrics(
      originalLyrics,
      selectedPortion,
      rewriteRequest,
      (modelType || 'basic')
    );

    // 更新重写计数
    await supabase
      .from('profiles')
      .update({ rewrite_count: profile.rewrite_count + 1 })
      .eq('id', user.id);

    const res = NextResponse.json({
      rewrittenPortion,
      remainingRewrites: maxRewrites - (profile.rewrite_count + 1)
    })
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res

  } catch (error: any) {
    console.error('Error in rewrite API:', error);
    
    if (error.message.includes('Network connection failed')) {
      const res503 = NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
      res503.headers.set('Cache-Control', 'private, max-age=0, no-store')
      res503.headers.set('Vary', 'Cookie')
      return res503
    }
    
    const res500 = NextResponse.json(
      { error: 'Failed to rewrite lyrics. Please try again.' },
      { status: 500 }
    )
    res500.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res500.headers.set('Vary', 'Cookie')
    return res500
  }
}