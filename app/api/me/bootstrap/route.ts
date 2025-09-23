import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

type BootProfile = {
  id: string;
  status: 'free' | 'active' | 'canceled' | 'past_due';
  generation_count: number;
  rewrite_count: number;
  favorite_count: number;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  is_trial_used: boolean;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
};

// Run on Edge to minimize cold-start and CPU cost
export const runtime = 'edge';

// Single bootstrap endpoint to hydrate client with auth + profile + limits
export async function GET() {
  try {
    const AUTH_CACHE_HEADERS = {
      'Cache-Control': 'private, max-age=30, s-maxage=0, stale-while-revalidate=60',
      'Vary': 'Cookie',
    } as const;
    const ANON_CACHE_HEADERS = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
      'Vary': 'Cookie',
    } as const;

    // Fast path for anonymous visitors: return immediately and allow CDN cache
    try {
      const store = await cookies();
      const hint = store.get('aig_auth');
      if (!hint || hint.value !== '1') {
        return NextResponse.json(
          { user: null },
          { headers: ANON_CACHE_HEADERS }
        );
      }

      // If no Supabase auth cookie present (session expired), avoid hitting auth.getUser()
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        let projectRef = 'supabase';
        try {
          const u = new URL(supabaseUrl);
          const host = u.hostname;
          projectRef = host.replace('.supabase.co', '') || 'supabase';
        } catch {}
        const authCookiePrefix = `sb-${projectRef}-auth-token`;
        const all = store.getAll();
        const hasSbCookie = all.some(c => c.name === authCookiePrefix || c.name.startsWith(`${authCookiePrefix}.`));
        if (!hasSbCookie) {
          return NextResponse.json(
            { user: null },
            { headers: ANON_CACHE_HEADERS }
          );
        }
      } catch {}
    } catch {}

    const supabase = await createServerComponentClient();

    // Read user from HttpOnly cookie session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // No session -> treat as anonymous and make cacheable
      return NextResponse.json({ user: null }, { headers: ANON_CACHE_HEADERS });
    }

    // Fetch profile once
    const { data: row, error: profileError } = await supabase
      .from('profiles')
      .select([
        'id',
        'status',
        'generation_count',
        'rewrite_count',
        'favorite_count',
        'trial_start_date',
        'trial_end_date',
        'is_trial_used',
        'subscription_start_date',
        'subscription_end_date'
      ].join(','))
      .eq('id', user.id)
      .single();

    if (profileError || !row) {
      return NextResponse.json(
        { user: { id: user.id, email: user.email }, error: 'User profile not found' },
        { status: 404, headers: AUTH_CACHE_HEADERS }
      );
    }

    const profile = (row as unknown) as BootProfile;

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
    const maxFavorites = isActiveUser ? 300 : 10;

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
      { headers: AUTH_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Error in GET /api/me/bootstrap:', error);
    return NextResponse.json(
      { user: null, error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } }
    );
  }
}
