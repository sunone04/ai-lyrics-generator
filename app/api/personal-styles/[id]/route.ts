import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RLS policies on 'personal_style_groups' handle authorization.
    const { data: styleGroup, error: fetchError } = await supabase
      .from('personal_style_groups')
      .select(`
        id,
        name,
        created_at,
        personal_style_lyrics (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching style group details:', fetchError);
      return NextResponse.json({ success: false, error: 'Style group not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, styleGroup });

  } catch (error) {
    console.error('Error in GET /api/personal-styles/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RLS policies on 'personal_style_groups' handle authorization.

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Style group name is required.' }, { status: 400 });
    }
    if (name.length > 100) {
        return NextResponse.json({ success: false, error: 'Name must be 100 characters or less.' }, { status: 400 });
    }

    const { data: updatedGroup, error: updateError } = await supabase
      .from('personal_style_groups')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Explicit check is good practice, though RLS enforces it.
      .select('id, name, updated_at')
      .single();

    if (updateError) {
        if (updateError.code === '23505') { // unique_violation
            return NextResponse.json({ success: false, error: 'A style group with this name already exists.' }, { status: 409 });
        }
        console.error('Error updating style group:', updateError);
        return NextResponse.json({ success: false, error: 'Failed to update style group.' }, { status: 500 });
    }

    if (!updatedGroup) {
        return NextResponse.json({ success: false, error: 'Style group not found or you do not have permission to edit it.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      styleGroup: updatedGroup,
    });

  } catch (error) {
    console.error('Error in PUT /api/personal-styles/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RLS policies on 'personal_style_groups' handle authorization.

    const { error: deleteError } = await supabase
      .from('personal_style_groups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // RLS makes this redundant but it's good practice for clarity.

    if (deleteError) {
      console.error('Error deleting style group:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete style group.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/personal-styles/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
