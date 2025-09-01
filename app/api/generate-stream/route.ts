import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server'
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { 
      language, 
      musicStyle, 
      musicTheme, 
      lengthOption, 
      lyricStyle, 
      intentOrRequest, 
      artistStyle, 
      emotionIntensity, 
      rhymeRequirement, 
      songStructure, 
      paragraphLength, 
      bpm, 
      useBpm, 
      melody, 
      syllablePattern, 
      modelType,
      personalStyleId
    } = await request.json();

    // Validate required fields
    if (!language || !musicStyle || !musicTheme || !lengthOption || !lyricStyle) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Check user usage limits before proceeding
    const { data: canGenerate, error: limitCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { 
        user_uuid: user.id, 
        operation_type: 'generation' 
      });

    if (limitCheckError) {
      console.error('Error checking usage limit:', limitCheckError);
      return new Response('Failed to check usage limit', { status: 500 });
    }

    if (!canGenerate) {
      return new Response('Daily generation limit reached. Please upgrade to premium or wait until tomorrow.', { status: 429 });
    }

    // Check user subscription status for pro model
    if (modelType === 'pro') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, trial_start_date, trial_end_date')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return new Response('User profile not found', { status: 404 });
      }

      // Check if user is in trial period
      const { data: isInTrial, error: trialCheckError } = await supabase
        .rpc('is_user_in_trial_period', { user_uuid: user.id });

      if (trialCheckError) {
        console.error('Error checking trial status:', trialCheckError);
        return new Response('Failed to check trial status', { status: 500 });
      }

      // Allow pro model if user has active subscription OR is in trial period
      if (profile.status !== 'active' && !isInTrial) {
        return new Response('Pro model requires active subscription or free trial', { status: 403 });
      }
    }

    // Fetch personal style if provided
    let personalStyle = null;
    if (personalStyleId) {
      // Check if user has access to personal styles (active subscription or in trial)
      const { data: isInTrial, error: trialCheckError } = await supabase
        .rpc('is_user_in_trial_period', { user_uuid: user.id });

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      if (!profileError && profile && (profile.status === 'active' || isInTrial)) {
        const { data: style, error: styleError } = await supabase
          .from('personal_styles')
          .select('*')
          .eq('id', personalStyleId)
          .eq('user_id', user.id)
          .single();

        if (!styleError && style) {
          personalStyle = style;
        }
      }
    }

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullLyrics = '';
          
          // Generate lyrics using AI service with personal style
          await aiService.generateLyricsStream(
            {
              language,
              musicStyle,
              musicTheme,
              lengthOption,
              lyricStyle,
              intentOrRequest,
              artistStyle,
              emotionIntensity,
              rhymeRequirement,
              songStructure,
              paragraphLength,
              bpm,
              useBpm,
              melody,
              syllablePattern,
              modelType: modelType || 'basic'
            },
            personalStyle,
            (chunk) => {
              fullLyrics += chunk;
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          );
          
          // Save the generation to database after successful generation
          try {
            const { error: saveError } = await supabase
              .from('generations')
              .insert({
                user_id: user.id,
                language: language || null,
                music_style: musicStyle || null,
                music_theme: musicTheme || null,
                length_option: lengthOption || null,
                lyric_style: lyricStyle || null,
                intent_or_request: intentOrRequest || null,
                artist_style: artistStyle || null,
                emotion_intensity: emotionIntensity || null,
                rhyme_requirement: rhymeRequirement || null,
                song_structure: songStructure || null,
                paragraph_length: paragraphLength || null,
                bpm: bpm || null,
                melody: melody || null,
                syllable_pattern: syllablePattern || null,
                generated_lyrics: fullLyrics,
                model_used: modelType || 'basic',
                generation_type: 'full',
                personal_style_id: personalStyleId || null,
                is_favorited: false
              });

            if (saveError) {
              console.error('Error saving generation to database:', saveError);
            }
          } catch (saveError) {
            console.error('Error saving generation:', saveError);
          }

          // Increment user's generation count after successful generation
          const { error: incrementError } = await supabase
            .from('profiles')
            .update({ 
              generation_count: supabase.sql`generation_count + 1`,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (incrementError) {
            console.error('Error incrementing generation count:', incrementError);
          }
          
          controller.close();
        } catch (error) {
          console.error('Error in lyrics generation stream:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-stream API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}


