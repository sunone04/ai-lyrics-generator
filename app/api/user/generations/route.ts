import { createServerComponentClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's generations
    const { data: generations, error: generationsError } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (generationsError) {
      console.error('Error fetching generations:', generationsError);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      generations: generations || [] 
    });

  } catch (error) {
    console.error('Error in generations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { generationId, isFavorited } = await request.json();

    if (!generationId || typeof isFavorited !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check favorite limit when adding to favorites
    if (isFavorited) {
      const { data: canFavorite, error: limitCheckError } = await supabase
        .rpc('check_favorite_limit_with_trial', { user_uuid: user.id });

      if (limitCheckError) {
        console.error('Error checking favorite limit:', limitCheckError);
        return NextResponse.json({ error: 'Failed to check favorite limit' }, { status: 500 });
      }

      if (!canFavorite) {
        return NextResponse.json({ error: 'Favorite limit reached. Please upgrade to premium for more favorites.' }, { status: 429 });
      }
    }

    // Update the generation's favorite status
    const { error } = await supabase
      .from('generations')
      .update({ is_favorited: isFavorited })
      .eq('id', generationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating favorite status:', error);
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in generations PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    // Delete the generation (only if it belongs to the user)
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting generation:', error);
      return NextResponse.json({ error: 'Failed to delete generation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in generations DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
