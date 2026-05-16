import { createServerComponentClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const favorites = searchParams.get('favorites') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from('generations')
      .select('id, created_at, music_style, music_theme, model_used, is_favorited, generated_lyrics', { count: 'exact' })
      .eq('user_id', user.id);

    // Add favorites filter if needed
    if (favorites) {
      query = query.eq('is_favorited', true);
    }

    // Add pagination and ordering
    const { data: generations, error: generationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (generationsError) {
      console.error('Error fetching generations:', generationsError);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    // Reduce data transfer: only send a short preview of lyrics
    const MAX_PREVIEW_CHARS = 600;
    const safeList = (generations || []).map((g: any) => ({
      ...g,
      generated_lyrics: typeof g.generated_lyrics === 'string'
        ? g.generated_lyrics.slice(0, MAX_PREVIEW_CHARS)
        : g.generated_lyrics,
    }));

    return NextResponse.json({ 
      success: true, 
      generations: safeList,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      }
    });

  } catch (error) {
    console.error('Error in generations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
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
        .rpc('check_favorite_limit_optimized', { user_uuid: user.id });

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

    // Note: favorite_count 由数据库触发器原子维护，无需在应用侧额外 COUNT + UPDATE。

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in generations PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
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
