import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { generated_lyrics } = await request.json();
    const resolvedParams = await params;
    const generationId = resolvedParams.id;

    if (!generated_lyrics || typeof generated_lyrics !== 'string') {
      return NextResponse.json(
        { error: 'Invalid lyrics content' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
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
      .select('user_id')
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
        { error: 'Unauthorized to edit this generation' },
        { status: 403 }
      );
    }

    // Update the lyrics
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('generations')
      .update({ 
        generated_lyrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId)
      .select('id, user_id, generated_lyrics, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating generation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lyrics' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGeneration);

  } catch (error) {
    console.error('Error in PATCH /api/generations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}