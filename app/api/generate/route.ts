import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { aiService } from '@/lib/ai-service';
import { userService } from '@/lib/user-service';
import { securityService } from '@/lib/security-service';
import { LyricsGenerationParams } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { user, supabase } = await requireAuth();

    // Parse request body
    const params: LyricsGenerationParams = await request.json();

    // Validate required fields
    if (!params.language || !params.musicStyle || !params.musicTheme) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate custom input lengths
    const validateCustomInput = (value: string, fieldName: string, maxLength: number = 50) => {
      if (value && value.length > maxLength) {
        throw new Error(`${fieldName} must be ${maxLength} characters or less`);
      }
      if (value && value.trim().length === 0) {
        throw new Error(`${fieldName} cannot be empty`);
      }
    };

    try {
      validateCustomInput(params.language, 'Language', 50);
      validateCustomInput(params.musicStyle, 'Music Style', 50);
      validateCustomInput(params.musicTheme, 'Music Theme', 50);
      validateCustomInput(params.lyricStyle, 'Lyric Style', 50);
      validateCustomInput(params.rhymeRequirement, 'Rhyme Requirement', 50);
      validateCustomInput(params.songStructure, 'Song Structure', 50);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Get or create user profile
    let profile;
    try {
      profile = await userService.getOrCreateUserProfile(user.id);
    } catch (profileError: any) {
      console.error('Profile creation/retrieval error:', profileError);
      return NextResponse.json(
        { 
          error: 'Failed to initialize user profile. Please try signing out and signing in again.',
          details: profileError.message 
        },
        { status: 500 }
      );
    }

    // Check if user can use pro model
    if (params.modelType === 'pro' && profile.status !== 'active') {
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
      actionType: 'generate'
    });

    if (securityCheck.isAnomaly) {
      await securityService.logSecurityEvent({
        ipAddress: clientIp,
        userAgent,
        browserFingerprint,
        userId: user.id,
        actionType: 'generate'
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

    // Check usage limits
    const { canUse, remaining } = await userService.checkUsageLimit(user.id, 'generation');
    
    if (!canUse) {
      return NextResponse.json(
        { 
          error: 'Daily generation limit reached',
          message: 'You have reached your daily limit for lyrics generation.',
          action: 'upgrade',
          remainingGenerations: remaining,
          userStatus: profile.status,
          upgradeMessage: profile.status === 'free' 
            ? 'Upgrade to Premium to get 30 generations per day and unlock advanced features!'
            : profile.status === 'active'
            ? 'You have reached your daily limit of 30 generations. Limits reset at midnight.'
            : 'Your premium subscription may have expired. Please check your subscription status.'
        },
        { status: 429 }
      );
    }

    // Generate lyrics using AI
    const lyrics = await aiService.generateLyrics(params);
    
    // Save generation to database using authenticated client
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        language: params.language,
        music_style: params.musicStyle,
        music_theme: params.musicTheme,
        length_option: params.lengthOption,
        lyric_style: params.lyricStyle,
        intent_or_request: params.intentOrRequest,
        artist_style: params.artistStyle,
        emotion_intensity: params.emotionIntensity,
        rhyme_requirement: params.rhymeRequirement,
        song_structure: params.songStructure,
        paragraph_length: params.paragraphLength,
        bpm: params.bpm,
        generated_lyrics: lyrics,
        model_used: params.modelType,
        is_favorited: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generation' },
        { status: 500 }
      );
    }

    // Update usage count
    await userService.updateUsageCount(user.id, 'generation');

    // 记录成功的操作
    await securityService.logSecurityEvent({
      ipAddress: clientIp,
      userAgent,
      browserFingerprint,
      userId: user.id,
      actionType: 'generate'
    }, true);

    // Get updated remaining count
    const { remaining: newRemaining } = await userService.checkUsageLimit(user.id, 'generation');

    return NextResponse.json({
      success: true,
      lyrics,
      generationId: generation.id,
      remainingGenerations: newRemaining
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}