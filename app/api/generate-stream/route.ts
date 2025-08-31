import { NextRequest } from 'next/server'
import { aiService } from '@/lib/ai-service'
import { LyricsGenerationParams } from '@/lib/types'
import { createServerComponentClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 恢复认证逻辑
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        message: 'Please sign in to generate lyrics'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()

    // 组装并校验参数（确保全部传入）
    const params: LyricsGenerationParams = {
      language: String(body.language || ''),
      musicStyle: String(body.musicStyle || ''),
      musicTheme: String(body.musicTheme || ''),
      lengthOption: String(body.lengthOption || ''),
      lyricStyle: String(body.lyricStyle || ''),
      intentOrRequest: String(body.intentOrRequest || ''),
      artistStyle: String(body.artistStyle || ''),
      emotionIntensity: Number(body.emotionIntensity || 0),
      rhymeRequirement: String(body.rhymeRequirement || ''),
      songStructure: String(body.songStructure || ''),
      paragraphLength: String(body.paragraphLength || ''),
      bpm: body.useBpm ? Number(body.bpm || 0) : undefined,
      useBpm: Boolean(body.useBpm || false),
      melody: body.melody ? String(body.melody) : undefined,
      syllablePattern: body.syllablePattern ? String(body.syllablePattern) : undefined,
      modelType: body.modelType || 'basic'
    }

    // 基础必填校验
    if (!params.language || !params.musicStyle || !params.musicTheme || !params.lyricStyle) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        message: 'Please fill in all required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查用户配额
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, generation_count, usage_last_reset')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ 
        error: 'User profile not found',
        message: 'Please contact support'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查是否需要重置计数
    const today = new Date().toDateString();
    if (profile.usage_last_reset !== today) {
      await supabase
        .from('profiles')
        .update({ 
          generation_count: 0, 
          rewrite_count: 0, 
          usage_last_reset: today 
        })
        .eq('id', user.id);
      profile.generation_count = 0;
    }

    // 检查配额限制
    const maxGenerations = profile.status === 'active' ? 30 : 2;
    if (profile.generation_count >= maxGenerations) {
      return new Response(JSON.stringify({ 
        error: 'Daily limit reached',
        message: profile.status === 'active' 
          ? 'You have reached your daily generation limit. Please try again tomorrow.'
          : 'You have reached your free daily limit. Upgrade to Pro for more generations.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Pro模型权限校验
    if (params.modelType === 'pro' && profile.status !== 'active') {
      return new Response(JSON.stringify({ 
        error: 'Pro model requires subscription',
        message: 'Please upgrade to Pro to use the advanced model'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()

        // 发送 helper
        const send = (obj: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        }

        // 监听客户端中断，尽快结束流，释放CPU与下游AI请求
        let aborted = false
        const onAbort = () => {
          aborted = true
          try { controller.close() } catch {}
        }
        request.signal.addEventListener('abort', onAbort)

        try {
          // 流式生成
          const iterator = aiService.streamGenerateLyrics(params, request.signal)
          let fullLyrics = ''

          for await (const chunk of iterator) {
            if (aborted) break
            fullLyrics += chunk
            send({ type: 'chunk', content: chunk })
          }

          if (!aborted) {
            // 保存生成记录到数据库
            const { error: insertError } = await supabase
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
                melody: params.melody,
                syllable_pattern: params.syllablePattern,
                generated_lyrics: fullLyrics,
                model_used: params.modelType,
                generation_type: 'full'
              });

            if (insertError) {
              console.error('Error saving generation:', insertError);
            } else {
              // 更新用户生成计数
              await supabase
                .from('profiles')
                .update({ generation_count: profile.generation_count + 1 })
                .eq('id', user.id);
            }
          }

          send({ type: 'complete' })
          controller.close()
        } catch (error) {
          console.error('Generation error:', error);
          if (!aborted) {
            send({ type: 'error', message: 'Failed to generate lyrics. Please try again.' })
            controller.close()
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'private, no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Vary': 'Cookie'
      },
    })
  } catch (error) {
    console.error('Unexpected error in generate-stream:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=0, no-store', 'Vary': 'Cookie' }
    })
  }
}


