import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

type ProfileRow = {
  id: string;
  status: 'free' | 'active' | 'canceled' | 'past_due';
  generation_count: number;
  rewrite_count: number;
  favorite_count: number;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  is_trial_used: boolean;
};

// Run on Edge to minimize cold-start for this frequent, lightweight GET
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Auth: only for signed-in users
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Single round-trip: fetch profile only
    const result = await supabase
      .from('profiles')
      .select([
        'id',
        'status',
        'generation_count',
        'rewrite_count',
        'favorite_count',
        'trial_start_date',
        'trial_end_date',
        'is_trial_used'
      ].join(','))
      .eq('id', user.id)
      .single();

    const profile = result.data as unknown as ProfileRow | null;
    const profileError = result.error;

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
    // Standardize favorites limit to 300 for active/trial users
    // Free tier favorite cap aligned to 10 (per PRD/Database.md)
    const maxFavorites = isActiveUser ? 300 : 10;

    // Derive canUse from counters to avoid RPCs
    const canGenerate = profile.generation_count < maxGenerations;
    const canRewrite = profile.rewrite_count < maxRewrites;
    const canFavorite = profile.favorite_count < maxFavorites;

    const AUTH_CACHE_HEADERS = {
      'Cache-Control': 'private, max-age=30, s-maxage=0, stale-while-revalidate=60',
      'Vary': 'Cookie',
    } as const;

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
    }, { headers: AUTH_CACHE_HEADERS });
  } catch (error) {
    console.error('Error in usage limits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
