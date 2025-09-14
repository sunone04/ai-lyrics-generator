import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient();
    
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    // Get the generation
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
      }
      console.error('Error fetching generation:', error);
      return NextResponse.json({ error: 'Failed to fetch generation' }, { status: 500 });
    }

    return NextResponse.json({ generation });

  } catch (error) {
    console.error('Error in generation GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient();
    
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if generation belongs to user
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this generation' }, { status: 403 });
    }

    // Delete the generation
    const { error: deleteError } = await supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting generation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete generation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in generation DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { generated_lyrics } = await request.json();
    const generationId = (await context.params).id;

    if (!generated_lyrics || typeof generated_lyrics !== 'string') {
      return NextResponse.json(
        { error: 'Invalid lyrics content' },
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
