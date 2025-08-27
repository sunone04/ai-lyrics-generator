import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { userService } from '@/lib/user-service';

export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase } = await requireAuth();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    // Get user generations
    const generations = await userService.getUserGenerations(user.id, favoritesOnly);

    const res = NextResponse.json({
      success: true,
      generations: generations || []
    })
    res.headers.set('Cache-Control', 'private, max-age=300')
    res.headers.set('Vary', 'Cookie')
    return res

  } catch (error: any) {
    console.error('Generations fetch error:', error);
    
    const res = NextResponse.json(
      { error: error.message || 'Failed to fetch generations' },
      { status: 500 }
    )
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase } = await requireAuth();

    // Parse request body
    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }

    // Delete generation
    await userService.deleteGeneration(user.id, generationId);

    const res = NextResponse.json({ success: true })
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res

  } catch (error: any) {
    console.error('Generation deletion error:', error);
    
    const res = NextResponse.json(
      { error: error.message || 'Failed to delete generation' },
      { status: 500 }
    )
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res
  }
}