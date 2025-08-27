import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { securityService } from '@/lib/security-service';

export async function POST(request: NextRequest) {
  try {
    const { originalLyrics, selectedPortion, rewriteRequest, modelType } = await request.json();

    if (!originalLyrics || !selectedPortion || !rewriteRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, rewrite_count')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Pro模型权限校验（仅会员可用）
    if ((modelType === 'pro') && profile.status !== 'active') {
      return NextResponse.json(
        { error: 'Pro model requires premium subscription' },
        { status: 403 }
      );
    }

    // 防白嫖检查
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const browserFingerprint = securityService.generateBrowserFingerprint(userAgent);
    
    const securityCheck = await securityService.performSecurityCheck({
      ipAddress: clientIp,
      userAgent,
      browserFingerprint,
      userId: user.id,
      actionType: 'rewrite'
    });

    if (securityCheck.isAnomaly) {
      await securityService.logSecurityEvent({
        ipAddress: clientIp,
        userAgent,
        browserFingerprint,
        userId: user.id,
        actionType: 'rewrite'
      }, false);
      
      return NextResponse.json(
        { 
          error: 'Suspicious activity detected',
          message: 'Your request has been flagged for suspicious activity. Please try again later or contact support if this persists.',
          reason: securityCheck.reason
        },
        { status: 429 }
      );
    }

    // Check rewrite limits (optimize to free=2/day, paid=30/day)
    const dailyLimit = profile.status === 'free' ? 2 : 30;
    if (profile.rewrite_count >= dailyLimit) {
      return NextResponse.json(
        { 
          error: 'Daily rewrite limit reached',
          message: 'You have reached your daily limit for lyrics rewriting.',
          action: 'upgrade',
          userStatus: profile.status,
          upgradeMessage: profile.status === 'free' 
            ? 'Upgrade to Premium to get 30 lyrics optimizations per day!'
            : 'Your premium subscription may have expired.'
        },
        { status: 429 }
      );
    }

    // Generate rewritten lyrics using AI service
    const rewrittenPortion = await aiService.rewriteLyrics(
      originalLyrics,
      selectedPortion,
      rewriteRequest,
      modelType || 'basic'
    );

    // Update rewrite count（微任务，减少接口尾延迟）
    queueMicrotask(async () => {
      try {
        await supabase
          .from('profiles')
          .update({ rewrite_count: profile.rewrite_count + 1 })
          .eq('id', user.id);
      } catch {}
    });

    // 记录成功的操作
    await securityService.logSecurityEvent({
      ipAddress: clientIp,
      userAgent,
      browserFingerprint,
      userId: user.id,
      actionType: 'rewrite'
    }, true);

    const res = NextResponse.json({
      rewrittenPortion,
      remainingRewrites: dailyLimit - profile.rewrite_count - 1
    })
    res.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res.headers.set('Vary', 'Cookie')
    return res

  } catch (error: any) {
    console.error('Error in rewrite API:', error);
    
    if (error.message.includes('Network connection failed')) {
      const res503 = NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
      res503.headers.set('Cache-Control', 'private, max-age=0, no-store')
      res503.headers.set('Vary', 'Cookie')
      return res503
    }
    
    const res500 = NextResponse.json(
      { error: 'Failed to rewrite lyrics. Please try again.' },
      { status: 500 }
    )
    res500.headers.set('Cache-Control', 'private, max-age=0, no-store')
    res500.headers.set('Vary', 'Cookie')
    return res500
  }
}