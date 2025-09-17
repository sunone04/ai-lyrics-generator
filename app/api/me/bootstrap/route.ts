import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// Single bootstrap endpoint to hydrate client with auth + profile + limits
export async function GET() {
  try {
    // 快速返回：没有登录提示 Cookie 时直接返回匿名态，避免不必要的 Supabase 初始化
    try {
      const store = await cookies();
      const hint = store.get('aig_auth');
      if (!hint || hint.value !== '1') {
        return NextResponse.json(
          { user: null },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }
    } catch {}

    const supabase = await createServerComponentClient();

    // Read user from HttpOnly cookie session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Fetch profile once
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { user: { id: user.id, email: user.email }, error: 'User profile not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Derive trial flags from profile
    const now = new Date();
    const trialStart = profile.trial_start_date ? new Date(profile.trial_start_date) : null;
    const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
    const isInTrial = Boolean(trialStart && trialEnd && now >= trialStart && now <= trialEnd);
    const canUseTrial = Boolean(!profile.is_trial_used && profile.status !== 'active' && (!trialEnd || now > trialEnd));

    // Derive usage limits as in /api/me/usage-limits
    const isActiveUser = profile.status === 'active' || isInTrial;
    const maxGenerations = isActiveUser ? 30 : 1;
    const maxRewrites = isActiveUser ? 30 : 1;
    // Standardize favorites limit to 300 for active/trial users
    const maxFavorites = isActiveUser ? 300 : 3;

    const usage = {
      generation: {
        current: profile.generation_count,
        max: maxGenerations,
        remaining: Math.max(0, maxGenerations - profile.generation_count),
        canUse: profile.generation_count < maxGenerations,
      },
      rewrite: {
        current: profile.rewrite_count,
        max: maxRewrites,
        remaining: Math.max(0, maxRewrites - profile.rewrite_count),
        canUse: profile.rewrite_count < maxRewrites,
      },
      favorites: {
        current: profile.favorite_count,
        max: maxFavorites,
        remaining: Math.max(0, maxFavorites - profile.favorite_count),
        canUse: profile.favorite_count < maxFavorites,
      },
    };

    const limits = {
      maxGenerations,
      maxRewrites,
      maxFavorites,
      isActiveUser,
    };

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email },
        profile,
        trial: {
          isInTrial,
          canUseTrial,
          trialStartDate: profile.trial_start_date,
          trialEndDate: profile.trial_end_date,
          isTrialUsed: profile.is_trial_used,
        },
        usage,
        limits,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error in GET /api/me/bootstrap:', error);
    return NextResponse.json({ user: null, error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
