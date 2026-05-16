import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

// PUT: Update a specific lyric sample
export async function PUT(
  request: Request,
  context: { params: Promise<{ lyricId: string }> }
) {
  try {
    const { lyricId } = await context.params;
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, lyrics } = body;

    // Validate input
    if (!title || !lyrics) {
      return NextResponse.json({ success: false, error: 'Title and lyrics are required.' }, { status: 400 });
    }
    if (title.length > 100 || lyrics.length > 500) {
        return NextResponse.json({ success: false, error: 'Title must be 100 characters or less, and lyrics 500 characters or less.' }, { status: 400 });
    }

    const wordCount = lyrics.trim().split(/\s+/).filter(Boolean).length;

    // Update the lyric sample, ensuring the user owns it.
    const { data: updatedLyric, error: updateError } = await supabase
      .from('personal_style_lyrics')
      .update({
        title: title.trim(),
        lyrics: lyrics.trim(),
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lyricId)
      .eq('user_id', user.id) // RLS also enforces this, but it's a good safeguard.
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating lyric sample:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update lyric sample.' }, { status: 500 });
    }

    if (!updatedLyric) {
        return NextResponse.json({ success: false, error: 'Lyric sample not found or you do not have permission to edit it.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lyric: updatedLyric });

  } catch (error) {
    console.error('Error in PUT /api/personal-styles/lyrics/[lyricId]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a specific lyric sample
export async function DELETE(
  request: Request,
  context: { params: Promise<{ lyricId: string }> }
) {
  try {
    const { lyricId } = await context.params;
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the lyric sample, ensuring the user owns it.
    const { error: deleteError } = await supabase
      .from('personal_style_lyrics')
      .delete()
      .eq('id', lyricId)
      .eq('user_id', user.id); // RLS provides primary security.

    if (deleteError) {
      console.error('Error deleting lyric sample:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete lyric sample.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/personal-styles/lyrics/[lyricId]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
