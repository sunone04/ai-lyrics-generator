import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { originalLyrics, selectedPortion, rewriteRequest, modelType } = await request.json();

    if (!originalLyrics || !selectedPortion || !rewriteRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, rewrite_count')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check rewrite limits (similar to generation limits)
    const dailyLimit = profile.status === 'free' ? 3 : 25;
    if (profile.rewrite_count >= dailyLimit) {
      return NextResponse.json(
        { 
          error: 'Daily rewrite limit reached',
          message: 'You have reached your daily limit for lyrics rewriting.',
          action: 'upgrade',
          userStatus: profile.status,
          upgradeMessage: profile.status === 'free' 
            ? 'Upgrade to Premium to get 25 rewrites per day!'
            : 'Your premium subscription may have expired.'
        },
        { status: 429 }
      );
    }

    // Generate rewritten lyrics using AI service
    const rewrittenPortion = await aiService.rewriteLyrics(
      originalLyrics,
      selectedPortion,
      rewriteRequest,
      modelType || 'basic'
    );

    // Update rewrite count
    await supabase
      .from('profiles')
      .update({ rewrite_count: profile.rewrite_count + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      rewrittenPortion,
      remainingRewrites: dailyLimit - profile.rewrite_count - 1
    });

  } catch (error: any) {
    console.error('Error in rewrite API:', error);
    
    if (error.message.includes('Network connection failed')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to rewrite lyrics. Please try again.' },
      { status: 500 }
    );
  }
}