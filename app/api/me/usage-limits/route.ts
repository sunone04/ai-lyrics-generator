import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user is in trial period
    const { data: isInTrial, error: trialCheckError } = await supabase
      .rpc('is_user_in_trial_period', { user_uuid: user.id });

    if (trialCheckError) {
      console.error('Error checking trial status:', trialCheckError);
      return NextResponse.json({ error: 'Failed to check trial status' }, { status: 500 });
    }

    // Check if user can use trial
    const { data: canUseTrial, error: canUseTrialError } = await supabase
      .rpc('can_user_use_trial', { user_uuid: user.id });

    if (canUseTrialError) {
      console.error('Error checking trial eligibility:', canUseTrialError);
      return NextResponse.json({ error: 'Failed to check trial eligibility' }, { status: 500 });
    }

    // Check generation limit
    const { data: canGenerate, error: generationCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { 
        user_uuid: user.id, 
        operation_type: 'generation' 
      });

    if (generationCheckError) {
      console.error('Error checking generation limit:', generationCheckError);
      return NextResponse.json({ error: 'Failed to check generation limit' }, { status: 500 });
    }

    // Check rewrite limit
    const { data: canRewrite, error: rewriteCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { 
        user_uuid: user.id, 
        operation_type: 'rewrite' 
      });

    if (rewriteCheckError) {
      console.error('Error checking rewrite limit:', rewriteCheckError);
      return NextResponse.json({ error: 'Failed to check rewrite limit' }, { status: 500 });
    }

    // Check favorite limit
    const { data: canFavorite, error: favoriteCheckError } = await supabase
      .rpc('check_favorite_limit_with_trial', { user_uuid: user.id });

    if (favoriteCheckError) {
      console.error('Error checking favorite limit:', favoriteCheckError);
      return NextResponse.json({ error: 'Failed to check favorite limit' }, { status: 500 });
    }

    // Determine user type and limits
    const isActiveUser = profile.status === 'active' || isInTrial;
    const maxGenerations = isActiveUser ? 30 : 1;
    const maxRewrites = isActiveUser ? 30 : 1;
    const maxFavorites = isActiveUser ? 100 : 3;

    return NextResponse.json({
      profile: {
        id: profile.id,
        status: profile.status,
        isInTrial: isInTrial || false,
        canUseTrial: canUseTrial || false,
        trialStartDate: profile.trial_start_date,
        trialEndDate: profile.trial_end_date,
        isTrialUsed: profile.is_trial_used
      },
      usage: {
        generation: {
          current: profile.generation_count,
          max: maxGenerations,
          remaining: Math.max(0, maxGenerations - profile.generation_count),
          canUse: canGenerate || false
        },
        rewrite: {
          current: profile.rewrite_count,
          max: maxRewrites,
          remaining: Math.max(0, maxRewrites - profile.rewrite_count),
          canUse: canRewrite || false
        },
        favorites: {
          current: profile.favorite_count,
          max: maxFavorites,
          remaining: Math.max(0, maxFavorites - profile.favorite_count),
          canUse: canFavorite || false
        }
      },
      limits: {
        maxGenerations,
        maxRewrites,
        maxFavorites,
        isActiveUser
      }
    });

  } catch (error) {
    console.error('Error in usage limits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
