import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { userService } from '@/lib/user-service';

export async function POST(request: NextRequest) {
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

    // Toggle favorite
    await userService.toggleFavorite(user.id, generationId);

    const res = NextResponse.json({ success: true })
    res.headers.set('Cache-Control', 'private, max-age=300')
    res.headers.set('Vary', 'Cookie')
    return res

  } catch (error: any) {
    console.error('Favorite toggle error:', error);
    
    const res = NextResponse.json(
      { error: error.message || 'Failed to toggle favorite' },
      { status: 500 }
    )
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res
  }
}