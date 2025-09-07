import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server'
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      language, musicStyle, musicTheme, lengthOption, lyricStyle,
      intentOrRequest, artistStyle, emotionIntensity, rhymeRequirement,
      songStructure, paragraphLength, bpm, useBpm, melody,
      syllablePattern, modelType, personalStyleId: personalStyleGroupId // Renamed for clarity
    } = await request.json();

    if (!language || !musicStyle || !musicTheme || !lengthOption || !lyricStyle) {
      return new Response('Missing required fields', { status: 400 });
    }

    const { data: canGenerate, error: limitCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { user_uuid: user.id, operation_type: 'generation' });

    if (limitCheckError || !canGenerate) {
      const message = limitCheckError ? 'Failed to check usage limit' : 'Daily generation limit reached.';
      if (limitCheckError) console.error('Error checking usage limit:', limitCheckError);
      return new Response(message, { status: limitCheckError ? 500 : 429 });
    }

    if (modelType === 'pro') {
      const { data: profile, error: profileError } = await supabase.from('profiles').select('status').eq('id', user.id).single();
      const { data: isInTrial, error: trialError } = await supabase.rpc('is_user_in_trial_period', { user_uuid: user.id });
      if (profileError || trialError || (profile.status !== 'active' && !isInTrial)) {
        return new Response('Pro model requires an active subscription or trial.', { status: 403 });
      }
    }

    // Fetch the selected personal style as a sample
    let personalStyleSample = null;
    if (personalStyleGroupId) {
      const { data: style, error: styleError } = await supabase
        .from('personal_style_lyrics')
        .select('title, lyrics, language, music_style')
        .eq('style_group_id', personalStyleGroupId)
        .eq('user_id', user.id)
        .single();

      if (!styleError && style) {
        personalStyleSample = {
          id: 0, // temporary id for interface compatibility
          user_id: user.id,
          title: style.title,
          lyrics: style.lyrics,
          language: style.language,
          music_style: style.music_style || '',
          word_count: 0, // will be calculated if needed
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullLyrics = '';

          await aiService.generateLyricsStream(
            { language, musicStyle, musicTheme, lengthOption, lyricStyle, intentOrRequest, artistStyle, emotionIntensity, rhymeRequirement, songStructure, paragraphLength, bpm, useBpm, melody, syllablePattern, modelType: modelType || 'basic' },
            personalStyleSample,
            (chunk) => {
              fullLyrics += chunk;
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          );

          // Save generation record
          await supabase.from('generations').insert({
            user_id: user.id,
            language, music_style: musicStyle, music_theme: musicTheme,
            length_option: lengthOption, lyric_style: lyricStyle, intent_or_request: intentOrRequest,
            artist_style: artistStyle, emotion_intensity: emotionIntensity, rhyme_requirement: rhymeRequirement,
            song_structure: songStructure, paragraph_length: paragraphLength, bpm, melody, syllable_pattern: syllablePattern,
            generated_lyrics: fullLyrics,
            model_used: modelType || 'basic',
            generation_type: 'full',
            personal_style_id: personalStyleGroupId || null,
            is_favorited: false
          });

          // Increment usage count
          await supabase.rpc('increment_user_generation_count', { user_uuid: user.id });

          controller.close();
        } catch (error) {
          console.error('Error in lyrics generation stream:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error) {
    console.error('Error in generate-stream API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}