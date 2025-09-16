import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server'
import { aiService } from '@/lib/ai-service';

// In-memory per-instance concurrency guard and simple dedup cache
const userLocks = new Map<string, number>();
const dedupCache = new Map<string, { result: string; expiresAt: number }>();

function paramsHash(obj: unknown) {
  // Stable stringify for small objects
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const {
      language, musicStyle, musicTheme, lengthOption, lyricStyle,
      intentOrRequest, artistStyle, emotionIntensity, rhymeRequirement,
      songStructure, paragraphLength, bpm, useBpm, melody,
      syllablePattern, modelType, personalStyleId: personalStyleGroupId
    } = body || {};

    // Basic required checks
    if (!language || !musicStyle || !musicTheme || !lengthOption || !lyricStyle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Free-text length caps (defense-in-depth)
    const LIMITS: Record<string, number> = {
      intentOrRequest: 500,
      artistStyle: 100,
      melody: 120,
      syllablePattern: 50,
      paragraphLength: 80,
      rhymeRequirement: 80,
      songStructure: 60,
      lyricStyle: 50,
      lengthOption: 60,
      musicTheme: 80,
      musicStyle: 40,
      language: 40,
    };
    const checkLen = (key: string, value: unknown) => {
      const max = LIMITS[key];
      if (!max) return null;
      const s = typeof value === 'string' ? value.trim() : '';
      if (s && s.length > max) return `${key} exceeds ${max} characters`;
      return null;
    };
    const toCheck: Array<[string, unknown]> = [
      ['intentOrRequest', intentOrRequest],
      ['artistStyle', artistStyle],
      ['melody', melody],
      ['syllablePattern', syllablePattern],
      ['paragraphLength', paragraphLength],
      ['rhymeRequirement', rhymeRequirement],
      ['songStructure', songStructure],
      ['lyricStyle', lyricStyle],
      ['lengthOption', lengthOption],
      ['musicTheme', musicTheme],
      ['musicStyle', musicStyle],
      ['language', language],
    ];
    for (const [k, v] of toCheck) {
      const err = checkLen(k, v);
      if (err) {
        return new Response(JSON.stringify({ error: err }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Usage check before any AI call
    const { data: canGenerate, error: limitCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { user_uuid: user.id, operation_type: 'generation' });

    if (limitCheckError || !canGenerate) {
      const message = limitCheckError ? 'Failed to check usage limit' : 'Daily generation limit reached.';
      if (limitCheckError) console.error('Error checking usage limit:', limitCheckError);
      return new Response(JSON.stringify({ error: message }), { status: limitCheckError ? 500 : 429, headers: { 'Content-Type': 'application/json' } });
    }

    // Pro model requires active subscription or trial
    if ((modelType || 'basic') === 'pro') {
      const { data: profile, error: profileError } = await supabase.from('profiles').select('status').eq('id', user.id).single();
      const { data: isInTrial, error: trialError } = await supabase.rpc('is_user_in_trial_period', { user_uuid: user.id });
      if (profileError || trialError || (profile?.status !== 'active' && !isInTrial)) {
        return new Response(JSON.stringify({ error: 'Pro model requires an active subscription or trial.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fetch selected personal style samples (optional, few-shot up to 3)
    let personalStyleSample: any = null;
    if (personalStyleGroupId) {
      const { data: styles } = await supabase
        .from('personal_style_lyrics')
        .select('title, lyrics, language, music_style')
        .eq('style_group_id', personalStyleGroupId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (styles && styles.length > 0) {
        personalStyleSample = styles.map((style: any) => ({
          id: 0,
          user_id: user.id,
          title: style.title,
          lyrics: style.lyrics,
          language: style.language,
          music_style: style.music_style || '',
          word_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
    }

    // Simple dedup within warm instance
    const dedupTtlMinutes = parseInt(process.env.DEDUP_TTL_MINUTES || '120', 10);
    const hashKey = paramsHash({ userId: user.id, language, musicStyle, musicTheme, lengthOption, lyricStyle, intentOrRequest, artistStyle, emotionIntensity, rhymeRequirement, songStructure, paragraphLength, bpm, useBpm, melody, syllablePattern, modelType, personalStyleGroupId });
    const cached = dedupCache.get(hashKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ cached: true, result: cached.result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Per-user concurrency limit
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_PER_USER || '1', 10);
    const current = userLocks.get(user.id) || 0;
    if (current >= maxConcurrent) {
      return new Response(JSON.stringify({ error: 'Too many concurrent generations. Please wait for the previous one to finish.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    userLocks.set(user.id, current + 1);

    const encoder = new TextEncoder();
    const firstChunkTimeout = parseInt(process.env.FIRST_CHUNK_TIMEOUT_MS || '30000', 10);
    const totalSoftTimeout = parseInt(process.env.TOTAL_SOFT_TIMEOUT_MS || '180000', 10);
    const heartbeatMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '15000', 10);

    let firstChunkSent = false;
    let fullLyrics = '';

    // 将客户端断开与上游AI调用关联：客户端断开 -> 中止生成
    const upstreamAbortController = new AbortController();
    const reqSignal: AbortSignal | undefined = (request as any)?.signal;
    const onClientAbort = () => {
      try { upstreamAbortController.abort(); } catch {}
    };
    if (reqSignal) {
      try { reqSignal.addEventListener('abort', onClientAbort); } catch {}
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const heartbeat = setInterval(() => {
          // send comment heartbeat only when no chunk yet
          if (!firstChunkSent) {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        }, heartbeatMs);

        const firstChunkTimer = setTimeout(() => {
          if (!firstChunkSent) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'First chunk timeout' })}\n\n`));
            } catch {}
            controller.close();
            try { upstreamAbortController.abort(); } catch {}
          }
        }, firstChunkTimeout);

        const totalTimer = setTimeout(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation timed out' })}\n\n`));
          } catch {}
          controller.close();
          try { upstreamAbortController.abort(); } catch {}
        }, totalSoftTimeout);

        try {
          // 使用支持中止信号的生成器，客户端断开后立即停止读取与处理
          for await (const chunk of aiService.streamGenerateLyrics(
            { language, musicStyle, musicTheme, lengthOption, lyricStyle, intentOrRequest, artistStyle, emotionIntensity, rhymeRequirement, songStructure, paragraphLength, bpm, useBpm, melody, syllablePattern, modelType: (modelType || 'basic') },
            personalStyleSample || undefined,
            upstreamAbortController.signal,
          )) {
            if (!firstChunkSent) firstChunkSent = true;
            fullLyrics += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          // Save generation record
          if (fullLyrics && fullLyrics.trim().length > 0) {
            await supabase.from('generations').insert({
              user_id: user.id,
              language,
              music_style: musicStyle,
              music_theme: musicTheme,
              length_option: lengthOption,
              lyric_style: lyricStyle,
              intent_or_request: intentOrRequest,
              artist_style: artistStyle,
              emotion_intensity: emotionIntensity,
              rhyme_requirement: rhymeRequirement,
              song_structure: songStructure,
              paragraph_length: paragraphLength,
              bpm,
              melody,
              syllable_pattern: syllablePattern,
              generated_lyrics: fullLyrics,
              model_used: modelType || 'basic',
              generation_type: 'full',
              personal_style_group_id: personalStyleGroupId || null,
              is_favorited: false
            });

            // Increment usage count (best-effort)
            try { await supabase.rpc('increment_user_generation_count', { user_uuid: user.id }); } catch {}
          }

          // Cache result for dedup
          dedupCache.set(hashKey, { result: fullLyrics, expiresAt: Date.now() + dedupTtlMinutes * 60 * 1000 });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Error in lyrics generation stream:', error);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
          } catch {}
          controller.close();
        } finally {
          clearInterval(heartbeat);
          clearTimeout(firstChunkTimer);
          clearTimeout(totalTimer);
          // release lock
          const cur = userLocks.get(user.id) || 1;
          userLocks.set(user.id, Math.max(0, cur - 1));
          if (reqSignal) {
            try { reqSignal.removeEventListener('abort', onClientAbort); } catch {}
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        // Disable buffering proxies
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('Error in generate-stream API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
