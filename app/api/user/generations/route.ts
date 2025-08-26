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

    return NextResponse.json({
      success: true,
      generations: generations || []
    });

  } catch (error: any) {
    console.error('Generations fetch error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch generations' },
      { status: 500 }
    );
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

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Generation deletion error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete generation' },
      { status: 500 }
    );
  }
}