import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user can use trial
    const { data: canUseTrial, error: trialCheckError } = await supabase
      .rpc('can_user_use_trial', { user_uuid: user.id });

    if (trialCheckError) {
      console.error('Error checking trial eligibility:', trialCheckError);
      return NextResponse.json({ error: 'Failed to check trial eligibility' }, { status: 500 });
    }

    if (!canUseTrial) {
      return NextResponse.json({ 
        error: 'Trial not available',
        message: 'You have already used your free trial or are not eligible for a trial'
      }, { status: 403 });
    }

    // Activate user trial
    const { data: trialActivated, error: activationError } = await supabase
      .rpc('activate_user_trial', { user_uuid: user.id });

    if (activationError) {
      console.error('Error activating trial:', activationError);
      return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 });
    }

    if (!trialActivated) {
      return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 });
    }

    // Get updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching updated profile:', profileError);
      return NextResponse.json({ error: 'Trial activated but failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Free trial activated successfully! You now have 3 days of full access.',
      profile,
      trialEndDate: profile.trial_end_date
    });

  } catch (error) {
    console.error('Error in trial activation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user profile with trial information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Calculate trial status from profile data instead of making additional RPC calls
    const now = new Date();
    const trialStartDate = profile.trial_start_date ? new Date(profile.trial_start_date) : null;
    const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
    
    const isInTrial = trialStartDate && trialEndDate && 
                     now >= trialStartDate && now <= trialEndDate;
    
    const canUseTrial = !profile.is_trial_used && 
                       profile.status !== 'active' && 
                       (!trialStartDate || !trialEndDate || now > trialEndDate);

    return NextResponse.json({ 
      profile,
      isInTrial: isInTrial,
      canUseTrial: canUseTrial,
      trialStartDate: profile.trial_start_date,
      trialEndDate: profile.trial_end_date,
      isTrialUsed: profile.is_trial_used
    });

  } catch (error) {
    console.error('Error in trial status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
