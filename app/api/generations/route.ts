import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { LyricsGenerationParams } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user wants favorites only
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    let query = supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesOnly) {
      query = query.eq('is_favorited', true);
    }

    const { data: generations, error } = await query;

    if (error) {
      console.error('Error fetching generations:', error);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    return NextResponse.json({ 
      generations: generations || [],
      count: generations?.length || 0
    });

  } catch (error) {
    console.error('Error in generations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      language,
      musicStyle,
      musicTheme,
      lengthOption,
      lyricStyle,
      intentOrRequest,
      artistStyle,
      emotionIntensity,
      rhymeRequirement,
      songStructure,
      paragraphLength,
      bpm,
      melody,
      syllablePattern,
      generatedLyrics,
      modelUsed,
      personalStyleId
    } = body;

    // Validate required fields
    if (!generatedLyrics || !modelUsed) {
      return NextResponse.json({ error: 'Generated lyrics and model used are required' }, { status: 400 });
    }

    // Insert the generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        language: language || null,
        music_style: musicStyle || null,
        music_theme: musicTheme || null,
        length_option: lengthOption || null,
        lyric_style: lyricStyle || null,
        intent_or_request: intentOrRequest || null,
        artist_style: artistStyle || null,
        emotion_intensity: emotionIntensity || null,
        rhyme_requirement: rhymeRequirement || null,
        song_structure: songStructure || null,
        paragraph_length: paragraphLength || null,
        bpm: bpm || null,
        melody: melody || null,
        syllable_pattern: syllablePattern || null,
        generated_lyrics: generatedLyrics,
        model_used: modelUsed,
        generation_type: 'full',
        personal_style_id: personalStyleId || null,
        is_favorited: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting generation:', insertError);
      return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      generation,
      message: 'Generation saved successfully'
    });

  } catch (error) {
    console.error('Error in generations POST API:', error);
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
