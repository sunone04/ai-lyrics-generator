import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = await createServerComponentClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from('generations')
      .select(`
        id,
        created_at,
        language,
        music_style,
        music_theme,
        length_option,
        lyric_style,
        intent_or_request,
        artist_style,
        emotion_intensity,
        rhyme_requirement,
        song_structure,
        paragraph_length,
        bpm,
        melody,
        syllable_pattern,
        generated_lyrics,
        model_used,
        is_favorited,
        generation_type,
        parent_generation_id,
        optimization_request
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by favorites if requested
    if (favoritesOnly) {
      query = query.eq('is_favorited', true);
    }

    const { data: generations, error } = await query;

    if (error) {
      console.error('Error fetching generations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch generations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      generations: generations || [],
      total: generations?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/user/generations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { generationId, isFavorited } = await request.json();

    if (typeof generationId !== 'number' || typeof isFavorited !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const supabase = await createServerComponentClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the generation belongs to the user
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('user_id, is_favorited')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this generation' },
        { status: 403 }
      );
    }

    // Update favorite status
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('generations')
      .update({ is_favorited: isFavorited })
      .eq('id', generationId)
      .select('id, is_favorited')
      .single();

    if (updateError) {
      console.error('Error updating generation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGeneration);

  } catch (error) {
    console.error('Error in PATCH /api/user/generations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
