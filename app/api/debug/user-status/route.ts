import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { userService } from '@/lib/user-service';

export async function GET(_request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase: _supabase } = await requireAuth();

    // Get user profile
    const profile = await userService.getOrCreateUserProfile(user.id);
    
    // Get subscription limits
    const limits = userService.getSubscriptionLimits(profile.status);
    
    // Check usage limits
    const { canUse, remaining } = await userService.checkUsageLimit(user.id, 'generation');
    
    // Get today's date for comparison
    const today = new Date().toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        email: user.email,
        profile: {
          id: profile.id,
          status: profile.status,
          paddle_customer_id: profile.paddle_customer_id,
          active_price_id: profile.active_price_id,
          generation_count: profile.generation_count,
          rewrite_count: profile.rewrite_count,
          usage_last_reset: profile.usage_last_reset,
          updated_at: profile.updated_at
        },
        limits: {
          maxGenerations: limits.maxGenerations,
          maxRewrites: limits.maxRewrites,
          canEditLyrics: limits.canEditLyrics,
          canUseProModel: limits.canUseProModel,
          maxFavorites: limits.maxFavorites
        },
        usageCheck: {
          canUse,
          remaining,
          today,
          needsReset: profile.usage_last_reset !== today
        }
      }
    });

  } catch (error: any) {
    console.error('Debug user status error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get user status' },
      { status: 500 }
    );
  }
}