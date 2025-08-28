import { NextRequest } from 'next/server'
import { aiService } from '@/lib/ai-service'
import { LyricsGenerationParams } from '@/lib/types'
import { authService } from '@/lib/auth-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 使用智能认证服务，避免重复认证
    const user = await authService.getAuthenticatedUser()
    
    if (!user) {
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
      // 模型在后端决定：默认按用户未登录->basic（后续接入会员判断）
      modelType: 'basic'
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

    // 获取用户配额与当日使用次数
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, generation_count, usage_last_reset')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch user profile',
        message: 'Please try again later'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查是否需要重置每日计数
    const today = new Date().toISOString().split('T')[0];
    if (profile?.usage_last_reset !== today) {
      // 重置每日计数
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

    const dailyLimit = profile?.status === 'active' ? 30 : 2
    if ((profile?.generation_count ?? 0) >= dailyLimit) {
      return new Response(JSON.stringify({
        error: 'Daily generation limit reached',
        message: profile?.status === 'active'
          ? 'You have reached your daily limit for lyric generation.'
          : 'Free plan: 2 generations per day. Upgrade for 30/day.',
        action: profile?.status === 'active' ? 'wait' : 'upgrade',
        userStatus: profile?.status || 'free'
      }), {
        status: 429,
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

          for await (const chunk of iterator) {
            if (aborted) break
            send({ type: 'chunk', content: chunk })
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


