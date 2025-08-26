import { NextRequest } from 'next/server'
import { aiService } from '@/lib/ai-service'
import { LyricsGenerationParams } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 要求用户登录（功能级别权限控制）
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
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
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取用户配额与当日使用次数
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, generation_count')
      .eq('id', user.id)
      .single()

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

          // 成功完成后异步增加当日计数（避免拉长尾延迟）
          queueMicrotask(async () => {
            try {
              await supabase
                .from('profiles')
                .update({ generation_count: (profile?.generation_count ?? 0) + 1 })
                .eq('id', user.id)
            } catch {}
          })
        } catch (err) {
          send({ type: 'error', error: err instanceof Error ? err.message : 'Generation failed' })
          controller.close()
        }
        finally {
          request.signal.removeEventListener('abort', onAbort)
        }
      }
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}


