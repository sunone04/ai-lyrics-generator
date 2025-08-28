import { NextRequest, NextResponse } from 'next/server';
 
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

    // 去除登录校验：演示模式

    // 去除用户资料/权限检查

    // Pro模型权限校验（仅会员可用）
    // 去除 Pro 权限校验

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
      userId: undefined as any,
      actionType: 'rewrite'
    });

    if (securityCheck.isAnomaly) {
      await securityService.logSecurityEvent({
        ipAddress: clientIp,
        userAgent,
        browserFingerprint,
        userId: undefined as any,
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
    // 去除配额/会员限制

    // Generate rewritten lyrics using AI service
    const rewrittenPortion = await aiService.rewriteLyrics(
      originalLyrics,
      selectedPortion,
      rewriteRequest,
      (modelType || 'basic')
    );

    // Update rewrite count（微任务，减少接口尾延迟）
    // 去除计数更新

    // 记录成功的操作
    await securityService.logSecurityEvent({
      ipAddress: clientIp,
      userAgent,
      browserFingerprint,
      userId: undefined as any,
      actionType: 'rewrite'
    }, true);

    const res = NextResponse.json({
      rewrittenPortion,
      remainingRewrites: null
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