import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return NextResponse.json({ user: null, error: error.message }, { status: 200 });
    }
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ user: null, error: e?.message || 'unexpected' }, { status: 200 });
  }
}

