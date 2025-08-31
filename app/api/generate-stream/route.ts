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

    // Check user subscription status for pro model
    if (modelType === 'pro') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.status !== 'active') {
        return new Response('Pro model requires active subscription', { status: 403 });
      }
    }

    // Fetch personal style if provided
    let personalStyle = null;
    if (personalStyleId && profile?.status === 'active') {
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

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate lyrics using AI service
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
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          );
          
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


