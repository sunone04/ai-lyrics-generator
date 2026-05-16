import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { PersonalStyleFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Access control is handled by RLS policies on the 'personal_style_groups' table.
    // The API endpoint still requires authentication, but detailed permission checks are at the DB level.

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch user's style groups along with a count of lyrics in each group.
    const { data: styleGroups, error: fetchError, count } = await supabase
      .from('personal_style_groups')
      .select(`
        id,
        name,
        created_at,
        personal_style_lyrics(count)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error('Error fetching personal style groups:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch personal style groups' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      styleGroups: styleGroups || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      }
    });

  } catch (error) {
    console.error('Error in GET /api/personal-styles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Access and limit checks are handled by RLS policies and a DB trigger.

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Style group name is required.' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be 100 characters or less.' },
        { status: 400 }
      );
    }

    const { data: newGroup, error: insertError } = await supabase
      .from('personal_style_groups')
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select('id, name, created_at')
      .single();

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') { // unique_violation
        return NextResponse.json(
          { success: false, error: 'A style group with this name already exists.' },
          { status: 409 } // 409 Conflict
        );
      }
      console.error('Error creating personal style group:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create style group.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      styleGroup: newGroup
    });

  } catch (error) {
    console.error('Error in POST /api/personal-styles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
