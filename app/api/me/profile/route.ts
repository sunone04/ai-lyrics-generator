import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

// Run on Edge for faster startup on frequent small reads
export const runtime = 'edge';

export async function GET() {
  const supabase = await createServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select([
      'id',
      'email',
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
