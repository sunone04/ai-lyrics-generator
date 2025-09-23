import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

// Edge runtime for low latency
export const runtime = 'edge';

// Lightweight endpoint for polling subscription status after checkout
export async function GET() {
  try {
    const supabase = await createServerComponentClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status, next_billing_date, subscription_start_date, subscription_end_date, updated_at')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } });
    }

    return NextResponse.json({
      status: profile.status,
      nextBillingDate: profile.next_billing_date,
      subscriptionStartDate: profile.subscription_start_date,
      subscriptionEndDate: profile.subscription_end_date,
      // expose a simple version for conditional requests if needed later
      version: profile.updated_at,
    }, { headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } });
  }
}

