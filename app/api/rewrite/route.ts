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

    // Check if user is in trial period
    const { data: isInTrial, error: trialCheckError } = await supabase
      .rpc('is_user_in_trial_period', { user_uuid: user.id });

    if (trialCheckError) {
      console.error('Error checking trial status:', trialCheckError);
      return NextResponse.json({ error: 'Failed to check trial status' }, { status: 500 });
    }

    // Allow rewrite if user has active subscription OR is in trial period
    if (profile.status !== 'active' && !isInTrial) {
      return NextResponse.json({ error: 'Premium subscription or free trial required' }, { status: 403 });
    }

    // Check user usage limits before proceeding
    const { data: canRewrite, error: limitCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { 
        user_uuid: user.id, 
        operation_type: 'rewrite' 
      });

    if (limitCheckError) {
      console.error('Error checking usage limit:', limitCheckError);
      return NextResponse.json({ error: 'Failed to check usage limit' }, { status: 500 });
    }

    if (!canRewrite) {
      return NextResponse.json({ error: 'Daily rewrite limit reached. Please upgrade to premium or wait until tomorrow.' }, { status: 429 });
    }

    // TODO: Implement actual rewrite logic
    // For now, return a placeholder response
    const rewrittenText = `[Rewritten version of: "${selectedText}"]\n\nBased on your request: "${rewriteRequest}"\n\nThis is a placeholder response. The actual rewrite functionality will be implemented here.`;

    // Increment user's rewrite count after successful rewrite
    const { error: incrementError } = await supabase
      .rpc('increment_user_rewrite_count', { user_uuid: user.id });

    if (incrementError) {
      console.error('Error incrementing rewrite count:', incrementError);
    }

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