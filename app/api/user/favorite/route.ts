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

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Favorite toggle error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}