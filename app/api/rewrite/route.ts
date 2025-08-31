import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { originalLyrics, selectedText, rewriteRequest } = await request.json();

    if (!originalLyrics || !selectedText || !rewriteRequest) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.status !== 'active') {
      return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // TODO: Implement actual rewrite logic
    // For now, return a placeholder response
    const rewrittenText = `[Rewritten version of: "${selectedText}"]\n\nBased on your request: "${rewriteRequest}"\n\nThis is a placeholder response. The actual rewrite functionality will be implemented here.`;

    return NextResponse.json({ 
      success: true, 
      rewrittenText,
      message: 'Rewrite completed successfully'
    });

  } catch (error) {
    console.error('Error in rewrite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}