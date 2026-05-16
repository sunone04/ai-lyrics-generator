import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { aiService, MARKERS } from '@/lib/ai-service';

const userLocks = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    const body = await request.json();
    const { messages, modelType, personalStyleId } = body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: canGenerate, error: limitCheckError } = await supabase
      .rpc('check_user_usage_limit_with_trial', { user_uuid: userId, operation_type: 'generation' });

    if (limitCheckError || !canGenerate) {
      const message = limitCheckError ? 'Failed to check usage limit' : 'Daily generation limit reached.';
      return new Response(JSON.stringify({ error: message }), { status: limitCheckError ? 500 : 429, headers: { 'Content-Type': 'application/json' } });
    }

    if ((modelType || 'basic') === 'pro') {
      const { data: profile } = await supabase.from('profiles').select('status').eq('id', userId).single();
      const { data: isInTrial } = await supabase.rpc('is_user_in_trial_period', { user_uuid: userId });
      if (profile?.status !== 'active' && !isInTrial) {
        return new Response(JSON.stringify({ error: 'Pro model requires an active subscription or trial.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    let personalStyleSample: any = null;
    if (personalStyleId) {
      const { data: styles } = await supabase
        .from('personal_style_lyrics')
        .select('title, lyrics')
        .eq('style_group_id', personalStyleId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (styles && styles.length > 0) {
        personalStyleSample = styles.map((style: any) => ({
          id: 0, user_id: userId, title: style.title, lyrics: style.lyrics,
          language: undefined as any, music_style: '', word_count: 0,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }));
      }
    }

    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_PER_USER || '1', 10);
    const current = userLocks.get(userId) || 0;
    if (current >= maxConcurrent) {
      return new Response(JSON.stringify({ error: 'Too many concurrent generations.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    userLocks.set(userId, current + 1);

    const encoder = new TextEncoder();
    const firstChunkTimeout = parseInt(process.env.FIRST_CHUNK_TIMEOUT_MS || '45000', 10);
    const totalSoftTimeout = parseInt(process.env.TOTAL_SOFT_TIMEOUT_MS || '180000', 10);
    const heartbeatMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '15000', 10);

    let firstChunkSent = false;
    let fullLyrics = '';
    let insertedId: number | null = null;

    const upstreamAbortController = new AbortController();
    const reqSignal: AbortSignal | undefined = (request as any)?.signal;
    if (reqSignal) {
      try { reqSignal.addEventListener('abort', () => { try { upstreamAbortController.abort(); } catch {} }); } catch {}
    }

    const agentPrompt = buildAgentPrompt(messages, personalStyleSample);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
        }, heartbeatMs);

        const firstChunkTimer = setTimeout(() => {
          if (!firstChunkSent) {
            try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'First chunk timeout' })}\n\n`)); } catch {}
            controller.close();
            try { upstreamAbortController.abort(); } catch {}
          }
        }, firstChunkTimeout);

        const totalTimer = setTimeout(() => {
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation timed out' })}\n\n`)); } catch {}
          controller.close();
          try { upstreamAbortController.abort(); } catch {}
        }, totalSoftTimeout);

        try {
          const guardLen = 64;
          let buffer = '';
          let seenLyricsStart = false;
          let seenLyricsEnd = false;
          let lyricsSentIndex = 0;
          const minLyricsChars = parseInt(process.env.MIN_LYRICS_CHARS || '300', 10);

          const model = aiService.getModel(modelType || 'basic');
          const result: any = await model.generateContentStream(agentPrompt);

          for await (const chunk of result.stream) {
            if (upstreamAbortController.signal.aborted) break;
            try {
              const delta: string = typeof chunk.text === 'function' ? chunk.text() : '';
              if (!delta) continue;
              buffer += delta;

              if (!seenLyricsStart) {
                const sIdx = buffer.indexOf(MARKERS.LYRICS_START);
                if (sIdx !== -1) {
                  buffer = buffer.slice(sIdx + MARKERS.LYRICS_START.length);
                  seenLyricsStart = true;
                  lyricsSentIndex = 0;
                } else {
                  if (buffer.length > 4096) buffer = buffer.slice(-1024);
                  continue;
                }
              }

              if (seenLyricsStart && !seenLyricsEnd) {
                const eIdx = buffer.indexOf(MARKERS.LYRICS_END);
                const rStartIdx = buffer.indexOf(MARKERS.RATIONALE_START);
                const hasEnd = eIdx !== -1;
                const hasRStart = rStartIdx !== -1;
                let stopIdx = -1;
                if (hasEnd && hasRStart) stopIdx = Math.min(eIdx, rStartIdx);
                else if (hasEnd) stopIdx = eIdx;
                else if (hasRStart) stopIdx = rStartIdx;

                if (stopIdx === -1) {
                  const safeEnd = Math.max(0, buffer.length - guardLen);
                  if (safeEnd > lyricsSentIndex) {
                    const toSend = buffer.slice(lyricsSentIndex, safeEnd);
                    if (toSend) {
                      if (!firstChunkSent) firstChunkSent = true;
                      fullLyrics += toSend;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: toSend })}\n\n`));
                    }
                    lyricsSentIndex = safeEnd;
                  }
                  continue;
                } else {
                  const toSend = buffer.slice(lyricsSentIndex, stopIdx);
                  if (toSend) {
                    if (!firstChunkSent) firstChunkSent = true;
                    fullLyrics += toSend;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: toSend })}\n\n`));
                  }
                  if (fullLyrics.length < minLyricsChars && hasEnd) {
                    buffer = buffer.slice(stopIdx + MARKERS.LYRICS_END.length);
                    lyricsSentIndex = 0;
                    continue;
                  }
                  seenLyricsEnd = true;
                  buffer = hasEnd ? buffer.slice(stopIdx + MARKERS.LYRICS_END.length) : buffer.slice(stopIdx + MARKERS.RATIONALE_START.length);
                  lyricsSentIndex = 0;
                }
              }

              if (seenLyricsEnd && !firstChunkSent) {
                firstChunkSent = true;
              }
            } catch {}
          }

          if (seenLyricsStart && !seenLyricsEnd) {
            const remaining = buffer.slice(lyricsSentIndex);
            if (remaining) {
              if (!firstChunkSent) firstChunkSent = true;
              fullLyrics += remaining;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: remaining })}\n\n`));
            }
            seenLyricsEnd = true;
          }

          if (!seenLyricsStart && buffer.trim()) {
            fullLyrics = buffer.trim();
            if (!firstChunkSent) firstChunkSent = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: fullLyrics })}\n\n`));
          }

          if (fullLyrics && fullLyrics.trim().length > 0) {
            try {
              const extractedParams = extractParamsFromMessages(messages);
              const { data: inserted, error: insertError } = await supabase.from('generations').insert({
                user_id: userId,
                language: extractedParams.language || 'English',
                music_style: extractedParams.musicStyle || 'Pop',
                music_theme: extractedParams.musicTheme,
                length_option: extractedParams.lengthOption,
                lyric_style: extractedParams.lyricStyle,
                intent_or_request: messages.map((m: any) => m.content).join(' | '),
                artist_style: extractedParams.artistStyle,
                rhyme_requirement: extractedParams.rhymeRequirement,
                song_structure: extractedParams.songStructure,
                generated_lyrics: fullLyrics,
                model_used: modelType || 'basic',
                generation_type: 'full',
                personal_style_group_id: personalStyleId || null,
                is_favorited: false
              }).select('id').single();
              if (!insertError && inserted && (inserted as any).id) {
                insertedId = Number((inserted as any).id);
              }
              try { await supabase.rpc('increment_user_generation_count', { user_uuid: userId }); } catch {}
            } catch {}
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', id: insertedId })}\n\n`));
          try { userLocks.set(userId, Math.max(0, (userLocks.get(userId) || 1) - 1)); } catch {}
        } catch (error) {
          console.error('Agent stream error:', error);
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Generation failed' })}\n\n`)); } catch {}
          try { userLocks.set(userId, Math.max(0, (userLocks.get(userId) || 1) - 1)); } catch {}
        } finally {
          clearInterval(heartbeat);
          clearTimeout(firstChunkTimer);
          clearTimeout(totalTimer);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function extractParamsFromMessages(messages: any[]): Record<string, string> {
  const params: Record<string, string> = {};
  const allText = messages.map(m => m.content).join(' ').toLowerCase();

  const languagePatterns: Record<string, string[]> = {
    'English': ['english', 'en '],
    'Chinese': ['chinese', 'mandarin', 'cantonese'],
    'Spanish': ['spanish'],
    'French': ['french'],
    'Japanese': ['japanese'],
    'Korean': ['korean'],
    'Portuguese': ['portuguese'],
    'German': ['german'],
    'Russian': ['russian'],
    'Arabic': ['arabic'],
  };
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    if (patterns.some(p => allText.includes(p))) { params.language = lang; break; }
  }
  if (!params.language) params.language = 'English';

  const stylePatterns: Record<string, string[]> = {
    'Hip-Hop/Rap': ['hip-hop', 'hip hop', 'rap', 'rapper'],
    'Pop': ['pop'],
    'R&B/Soul': ['r&b', 'rnb', 'soul'],
    'Rock': ['rock', 'punk', 'metal'],
    'Country': ['country'],
    'Electronic': ['electronic', 'edm', 'techno', 'house'],
    'Jazz': ['jazz'],
    'Blues': ['blues'],
    'Folk': ['folk', 'acoustic'],
    'Indie': ['indie'],
    'Latin Pop': ['latin', 'reggaeton'],
  };
  for (const [style, patterns] of Object.entries(stylePatterns)) {
    if (patterns.some(p => allText.includes(p))) { params.musicStyle = style; break; }
  }
  if (!params.musicStyle) params.musicStyle = 'Pop';

  const themePatterns: Record<string, string[]> = {
    'Love & Romance': ['love', 'romance', 'romantic', 'heart'],
    'Heartbreak': ['heartbreak', 'broken heart', 'breakup', 'ex'],
    'Empowerment': ['empower', 'strong', 'powerful', 'confidence'],
    'Party': ['party', 'dance', 'club', 'celebration'],
    'Nostalgia': ['nostalgia', 'memories', 'remember', 'past'],
    'Perseverance & Success': ['persever', 'success', 'hustle', 'grind', 'overcome'],
    'Friendship': ['friend', 'friendship', 'together'],
    'Social Issues': ['social', 'justice', 'society', 'protest'],
    'Spirituality & Faith': ['spiritual', 'faith', 'prayer', 'god'],
    'Adventure': ['adventure', 'journey', 'explore', 'road'],
  };
  for (const [theme, patterns] of Object.entries(themePatterns)) {
    if (patterns.some(p => allText.includes(p))) { params.musicTheme = theme; break; }
  }

  return params;
}

function buildAgentPrompt(messages: any[], personalStyle?: any): string {
  const conversationHistory = messages.map((m: any) => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${m.content}`;
  }).join('\n\n');

  let personalStyleBlock = '';
  if (personalStyle) {
    const samples = Array.isArray(personalStyle) ? personalStyle : [personalStyle];
    if (samples.length > 0) {
      personalStyleBlock = `\nHere are some previously written lyrics for style reference:\n${samples.map((s: any) => `TITLE: ${s.title}\nCONTENT:\n${s.lyrics}`).join('\n\n---\n\n')}\n`;
    }
  }

  return `You are a world-class professional songwriter and AI lyrics agent. Your role is to understand the user's creative vision through conversation and generate exceptional, original lyrics.

CONVERSATION:
${conversationHistory}
${personalStyleBlock}

Based on the conversation above, generate lyrics that match the user's request. Follow these rules:

OUTPUT FORMAT:
Start with ${MARKERS.LYRICS_START} on its own line, then provide the complete lyrics with structural tags like [Verse], [Chorus], [Bridge], etc., then end with ${MARKERS.LYRICS_END} on its own line.

After ${MARKERS.LYRICS_END}, you may optionally provide a brief creative rationale starting with ${MARKERS.RATIONALE_START} and ending with ${MARKERS.RATIONALE_END}.

LYRIC REQUIREMENTS:

1. Write from the singer's perspective with authentic, concrete emotions that evoke audience empathy.
2. Use fresh, meaningful imagery; avoid stale, formulaic tropes.
3. Keep language precise, concise, and punchy; avoid redundancy.
4. Ensure rhymes feel natural and the rhythm flows smoothly.
5. Maintain a clear structure with coherent narrative and logical development.
6. When a theme is present, pursue intellectual depth through personal experience.
7. Perfectly satisfy all user requirements from the conversation.
8. Use structural tags as appropriate: [Verse 1], [Chorus], [Bridge], etc.
9. Avoid repetitive imagery and clichés.
10. Vary repeated choruses to reflect emotional progression.
11. Include tangible, sensory details where appropriate.
12. Allow layered, nuanced thematic development.
13. Introduce appropriate conflict or depth for emotional tension.

LANGUAGE & GENRE:
- Detect the user's desired language from the conversation and write EXACTLY in that language.
- Detect the desired genre/style and strictly write in that style.
- For Hip-Hop/Rap: emphasize rhythmic flow, natural multisyllabic rhymes, punchlines/wordplay, and a memorable hook.

AVOID:
Artificial expressions, confusion of theme and perspective, limited vocabulary, outdated imagery, chaotic structure, poor language

Output NOTHING before ${MARKERS.LYRICS_START} and NOTHING after ${MARKERS.RATIONALE_END}.`;
}
