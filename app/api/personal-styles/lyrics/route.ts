import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

// POST: Add a new lyric sample to a specific style group
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { style_group_id, title, lyrics } = body;

    // Validate input
    if (!style_group_id || !title || !lyrics) {
      return NextResponse.json({ success: false, error: 'Style group ID, title, and lyrics are required.' }, { status: 400 });
    }
    if (title.length > 100 || lyrics.length > 500) {
        return NextResponse.json({ success: false, error: 'Title must be 100 characters or less, and lyrics 500 characters or less.' }, { status: 400 });
    }

    // Verify that the user owns the style group they are adding to.
    const { data: group, error: groupError } = await supabase
      .from('personal_style_groups')
      .select('id')
      .eq('id', style_group_id)
      .eq('user_id', user.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ success: false, error: 'Style group not found or you do not have permission to add to it.' }, { status: 404 });
    }

    const wordCount = lyrics.trim().split(/\s+/).filter(Boolean).length;

    // Insert the new lyric sample
    const { data: newLyric, error: insertError } = await supabase
      .from('personal_style_lyrics')
      .insert({
        user_id: user.id,
        style_group_id: style_group_id,
        title: title.trim(),
        lyrics: lyrics.trim(),
        word_count: wordCount,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting new lyric sample:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to add new lyric sample.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lyric: newLyric });

  } catch (error) {
    console.error('Error in POST /api/personal-styles/lyrics:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
