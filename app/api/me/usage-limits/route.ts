import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();

    // Auth: only for signed-in users
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Single round-trip: fetch profile only
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Compute trial flags locally from profile to avoid extra RPCs
    const now = new Date();
    const trialStart = profile.trial_start_date ? new Date(profile.trial_start_date) : null;
    const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null;

    const isInTrial = Boolean(
      trialStart && trialEnd && now >= trialStart && now <= trialEnd,
    );

    const canUseTrial = Boolean(
      !profile.is_trial_used && profile.status !== 'active' && (!trialEnd || now > trialEnd),
    );

    // Determine user type and limits (keep in sync with SUBSCRIPTION_LIMITS)
    const isActiveUser = profile.status === 'active' || isInTrial;
    const maxGenerations = isActiveUser ? 30 : 1;
    const maxRewrites = isActiveUser ? 30 : 1;
    const maxFavorites = isActiveUser ? 100 : 3;

    // Derive canUse from counters to avoid RPCs
    const canGenerate = profile.generation_count < maxGenerations;
    const canRewrite = profile.rewrite_count < maxRewrites;
    const canFavorite = profile.favorite_count < maxFavorites;

    return NextResponse.json({
      profile: {
        id: profile.id,
        status: profile.status,
        isInTrial,
        canUseTrial,
        trialStartDate: profile.trial_start_date,
        trialEndDate: profile.trial_end_date,
        isTrialUsed: profile.is_trial_used,
      },
      usage: {
        generation: {
          current: profile.generation_count,
          max: maxGenerations,
          remaining: Math.max(0, maxGenerations - profile.generation_count),
          canUse: canGenerate,
        },
        rewrite: {
          current: profile.rewrite_count,
          max: maxRewrites,
          remaining: Math.max(0, maxRewrites - profile.rewrite_count),
          canUse: canRewrite,
        },
        favorites: {
          current: profile.favorite_count,
          max: maxFavorites,
          remaining: Math.max(0, maxFavorites - profile.favorite_count),
          canUse: canFavorite,
        },
      },
      limits: {
        maxGenerations,
        maxRewrites,
        maxFavorites,
        isActiveUser,
      },
    });
  } catch (error) {
    console.error('Error in usage limits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
