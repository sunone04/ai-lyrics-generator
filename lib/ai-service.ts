import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LyricsGenerationParams, PersonalStyle } from './types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Explicit section markers for combined lyrics + rationale streaming
export const MARKERS = {
  LYRICS_START: '<<<LYRICS_START>>>',
  LYRICS_END: '<<<LYRICS_END>>>',
  RATIONALE_START: '<<<RATIONALE_START>>>',
  RATIONALE_END: '<<<RATIONALE_END>>>',
} as const;

// 输出最大字符数（软上限，超过将截断）
const MAX_OUTPUT_CHARS: number = parseInt(process.env.AI_MAX_OUTPUT_CHARS || '6000');
// 外部网络软超时（毫秒），默认 45000ms；用于首个响应或整体请求
const NETWORK_SOFT_TIMEOUT_MS: number = parseInt(process.env.AI_NETWORK_SOFT_TIMEOUT_MS || '45000');
// 最大输出 token 数（控制模型何时停止）
const MAX_OUTPUT_TOKENS: number = parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '10000');

export class AIService {
  private getModel(modelType: 'basic' | 'pro', isRegeneration: boolean = false) {
    // Basic model uses Gemini 2.5 Flash, Pro model uses Gemini 2.5 Pro
    const modelName = modelType === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    // For regeneration: use higher temperature to increase creativity and randomness
    // For normal generation and rewriting: use Gemini's default temperature (better balance)
    const config: any = {
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    };

    if (isRegeneration) {
      // Slightly higher temperature for regeneration (subtle variation)
      config.generationConfig = {
        temperature: 1.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        candidateCount: 1,
      };
    } else {
      // Use Gemini's default temperature for normal generation and rewriting
      // This provides better balance between creativity and consistency
      config.generationConfig = {
        topP: 0.95,                   // Diverse vocabulary selection
        topK: 40,                     // Balanced word choice diversity
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        candidateCount: 1,
      };
      // Note: temperature is not set, so Gemini uses its default
    }
    
    return genAI.getGenerativeModel(config);
  }

  private buildCombinedPrompt(params: LyricsGenerationParams, personalStyle?: PersonalStyle | PersonalStyle[]): string {
    const cap = parseInt(process.env.RATIONALE_MAX_CHARS || '1000');
    const parts: string[] = [];
    parts.push(`Language: ${params.language}`);
    parts.push(`Genre: ${params.musicStyle}`);
    if (params.musicTheme && params.musicTheme !== 'Default') parts.push(`Theme: ${params.musicTheme}`);
    if (params.lyricStyle && params.lyricStyle !== 'Default') parts.push(`Lyric Style: ${params.lyricStyle}`);
    if (params.songStructure && params.songStructure !== 'Default') parts.push(`Structure: ${params.songStructure}`);
    if (params.rhymeRequirement && params.rhymeRequirement !== 'Default') parts.push(`Rhyme Preference: ${params.rhymeRequirement}`);
    if (params.useBpm && params.bpm) parts.push(`BPM: ${params.bpm}`);
    if (params.emotionIntensity) parts.push(`Emotional Intensity: ${params.emotionIntensity}`);
    if (params.syllablePattern) parts.push(`Syllable Pattern (per line): ${params.syllablePattern}`);
    if (params.paragraphLength) parts.push(`Section Length: ${params.paragraphLength}`);
    if (params.artistStyle) parts.push(`Reference Artist: ${params.artistStyle}`);
    if (params.intentOrRequest) parts.push(`Direction: ${params.intentOrRequest}`);
    if (personalStyle) {
      const psArray = Array.isArray(personalStyle) ? personalStyle : [personalStyle];
      const psNames = psArray.map((p: any) => p?.title || '').filter(Boolean).join(', ');
      if (psNames) parts.push(`Personal Style Examples: ${psNames}`);
    }
    const paramSummary = parts.join('\n');

    return `You are a world-class professional songwriter and lyricist. Create exceptional, original lyrics that avoid clichés and generic expressions.

Follow the instructions and produce TWO sections in this exact order, using the exact boundary markers on their own lines:

${MARKERS.LYRICS_START}
[LYRICS ONLY] Provide complete song lyrics with appropriate structural tags such as [Verse], [Chorus], [Bridge], etc.
Do not include any explanations.
${MARKERS.LYRICS_END}

${MARKERS.RATIONALE_START}
[CREATIVE RATIONALE] Provide a clear creative rationale (approximately 80–240 words, or up to ${cap} characters in 3 bullet points) from the perspective of a professional lyricist, explaining why these lyrics were crafted as they are. Address the theme/imagery, structural and rhyme/rhythmic choices, alignment with user requirements, and the underlying meaning conveyed. Do not restate lyrics, reference AI or the generation process, or resort to vague generalizations.
${MARKERS.RATIONALE_END}

Rules:

Output NOTHING before ${MARKERS.LYRICS_START} and NOTHING after ${MARKERS.RATIONALE_END}.
The markers must appear exactly as shown and must NOT appear inside the content.
The lyrics must strictly follow all user parameters.

LYRIC REQUIREMENTS:

1. Write from the singer’s perspective with authentic, concrete emotions that evoke audience empathy.

2. Use fresh, meaningful imagery at appropriate moments; avoid stale, formulaic tropes.

3. Keep language precise, concise, and punchy; avoid redundancy and repetition.

4. Ensure rhymes feel natural and the rhythm flows smoothly.

5. Maintain a clear, complete structure with coherent narrative, logical development, and purposeful negative space.

6. When a theme is present, pursue intellectual depth that refracts universal human feelings or social reality through personal experience.

7. Perfectly satisfy all user‑provided parameters, including syllable counts, line length, and rhythm.

8. Use structural tags as requested by the user, such as [Verse 1], [Chorus], [Bridge], etc.

In the event of any conflict between general guidelines and specific user requirements, the user's requirements take precedence.

AVOID:

Artificial expressions, confusion of theme and perspective, limited vocabulary, outdated or inconsistent imagery, conflicts between melody and lyrics, chaotic or illogical structure, poor and rigid language

User Parameters:
${paramSummary}`;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!)) as Promise<T>;
  }

  /**
   * Stream lyrics generation using Gemini streaming API
   * Yields incremental text chunks to enable real-time UI updates
   */
  async *streamGenerateLyrics(
    params: LyricsGenerationParams,
    personalStyle?: PersonalStyle | PersonalStyle[],
    abortSignal?: AbortSignal,
    isRegeneration: boolean = false,
    includeRationale: boolean = false,
  ): AsyncGenerator<string> {

    const model = this.getModel(params.modelType, isRegeneration);
    const prompt = includeRationale
      ? this.buildCombinedPrompt(params, personalStyle)
      : this.buildGenerationPrompt(params, personalStyle);

    try {
      // 生成流，整体调用设置软超时
      const result: any = await this.withTimeout(
        (model as any).generateContentStream(prompt),
        NETWORK_SOFT_TIMEOUT_MS,
        'AI stream'
      );

      // 逐块读取，设置空闲超时与最大字数截断
      const iterator: AsyncIterator<any> = (result.stream as any)[Symbol.asyncIterator]();
      let total = 0;
      while (true) {
        if (abortSignal?.aborted) break;
        const { value, done } = await iterator.next();
        if (done) break;
        try {
          const delta: string = typeof value.text === 'function' ? value.text() : '';
          if (delta && delta.length > 0) {
            const remaining = (parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000')) - total;
            if (remaining <= 0) break;
            const chunk = delta.length > remaining ? delta.slice(0, remaining) : delta;
            total += chunk.length;
            yield chunk;
            if (total >= parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000')) break;
          }
        } catch (_err) {
          // 忽略无法解析的块
        }
      }
    } catch (error) {
      console.error('Error in stream generation:', error);
      throw new Error(`Failed to generate lyrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildGenerationPrompt(params: LyricsGenerationParams, personalStyle?: PersonalStyle | PersonalStyle[]): string {
    // Build dynamic specifications based on provided parameters
    let specifications = `CREATIVE SPECIFICATIONS:
 - Language: ${params.language}
 - Music Style: ${params.musicStyle}`;

    if (params.musicTheme && params.musicTheme !== 'Default') {
      specifications += `\n- Theme: ${params.musicTheme}`;
    }
    if (params.lengthOption && params.lengthOption !== 'Default') {
      specifications += `\n- Length: ${params.lengthOption}`;
    }
    if (params.lyricStyle && params.lyricStyle !== 'Default') {
      specifications += `\n- Lyric Style: ${params.lyricStyle}`;
    }
    if (params.songStructure && params.songStructure !== 'Default') {
      specifications += `\n- Song Structure: ${params.songStructure}`;
    }

    // Add optional parameters only if they exist and are meaningful
    if (params.artistStyle && params.artistStyle.trim() && params.artistStyle !== 'Other') {
      specifications += `\n- Reference Artist: ${params.artistStyle}`;
    }
    
    if (params.rhymeRequirement && params.rhymeRequirement.trim() && params.rhymeRequirement !== 'No specific requirement' && params.rhymeRequirement !== 'Default') {
      specifications += `\n- Rhyme Preference: ${params.rhymeRequirement}`;
    }
    
    if (params.useBpm && params.bpm && params.bpm > 0) {
      specifications += `\n- BPM: ${params.bpm}`;
    }
    
    if (params.emotionIntensity && params.emotionIntensity > 0) {
      specifications += `\n- Emotional Intensity (1-100): ${params.emotionIntensity}`;
    }
    
    if (params.paragraphLength && params.paragraphLength.trim() && params.paragraphLength !== 'Other') {
      specifications += `\n- Section Length: ${params.paragraphLength}`;
    }
    
    if (params.melody && params.melody.trim()) {
      specifications += `\n- Melody: ${params.melody}`;
    }
    
    if (params.syllablePattern && params.syllablePattern.trim()) {
      specifications += `\n- Syllable Pattern (per line): ${params.syllablePattern}`;
    }
    
    if (params.intentOrRequest && params.intentOrRequest.trim()) {
      specifications += `\n- Additional Creative Direction: ${params.intentOrRequest}`;
    }

    // Add personal style examples (few-shot) if provided
    if (personalStyle) {
      const samples = Array.isArray(personalStyle) ? personalStyle : [personalStyle];
      const block = samples
        .map((s, i) => `TITLE: ${s.title}\nLANGUAGE: ${s.language}\nGENRE: ${s.music_style || 'Not specified'}\nCONTENT:\n${s.lyrics}`)
        .join('\n\n---\n\n');
      specifications += `\n\nPERSONAL STYLE SAMPLES (use as stylistic reference, do not copy phrases):\n${block}\n`;
    }

    const prompt = `You are a world-class professional songwriter and lyricist. Create exceptional, original lyrics that avoid clichés and generic expressions.

Your task is to generate excellent lyrics that perfectly match the user's provided parameters. All user input parameters are the highest standard.

LYRIC REQUIREMENTS:

1. Write from the singer’s perspective with authentic, concrete emotions that evoke audience empathy.

2. Use fresh, meaningful imagery at appropriate moments; avoid stale, formulaic tropes.

3. Keep language precise, concise, and punchy; avoid redundancy and repetition.

4. Ensure rhymes feel natural and the rhythm flows smoothly.

5. Maintain a clear, complete structure with coherent narrative, logical development, and purposeful negative space.

6. When a theme is present, pursue intellectual depth that refracts universal human feelings or social reality through personal experience.

7. Perfectly satisfy all user‑provided parameters, including syllable counts, line length, and rhythm.

8. Use structural tags as requested by the user, such as [Verse 1], [Chorus], [Bridge], etc.

In the event of any conflict between general guidelines and specific user requirements, the user's requirements take precedence.

AVOID:

Artificial expressions, confusion of theme and perspective, limited vocabulary, outdated or inconsistent imagery, conflicts between melody and lyrics, chaotic or illogical structure, poor and rigid language

+PARAMETERS: ${specifications}

OUTPUT: Generate ONLY the lyrics with structural tags. No explanations or commentary.`;

    return prompt;
  }

  private buildRewritePrompt(originalLyrics: string, selectedPortion: string, rewriteRequest: string): string {
    const prompt = `You are a world-class professional songwriter and lyricist specializing in lyric refinement. Create exceptional, original lyrics that avoid clichés and generic expressions.

Your task is to rewrite the selected portion of lyrics based on the user's input and requirements, while maintaining consistency with the complete lyrics.

LYRIC REQUIREMENTS:

1. Maintain the same style, theme, and emotional tone as the complete lyrics.

2. Seamlessly integrate with the surrounding lyrics; do not introduce motifs that conflict with the existing piece.

3. Exactly match the local prosody and form of the selected context: keep syllable counts per line, line length/scansion, the section’s rhyme scheme, and smooth meter/rhythm. Keep the number of lines unchanged unless the user requests otherwise.

4. Preserve point of view and tense (narrator identity and pronouns), and maintain narrative continuity and logic. Keep the imagery palette consistent.

5. If BPM or melody constraints exist, align phrasing and stress with the melodic accents to remain singable.

6. Follow the user's requirements as the standard. In the event of any conflict between general guidelines and specific user requirements, the user's requirements take precedence.

7. Provide only the rewritten portion with structural tags; do not include explanations. Do not modify any text outside the selected portion.

AVOID:

Artificial expressions, confusion of theme and perspective, limited vocabulary, outdated or inconsistent imagery, conflicts between melody and lyrics, chaotic or illogical structure, poor and rigid language

+PARAMETERS:

Complete Lyrics: ${originalLyrics}

Section to Rewrite: ${selectedPortion}

User Requirements: ${rewriteRequest}

OUTPUT: Provide ONLY the rewritten portion with structural tags. No explanations.`;

    return prompt;
  }

  async generateLyrics(params: LyricsGenerationParams, personalStyle?: PersonalStyle | PersonalStyle[]): Promise<string> {
    return this.retryWithBackoff(async () => {
      const model = this.getModel(params.modelType);
      const prompt = this.buildGenerationPrompt(params, personalStyle);
      
      const result = await this.withTimeout(model.generateContent(prompt), NETWORK_SOFT_TIMEOUT_MS, 'AI request');
      const response = await result.response;
      
      // Check for safety blocks
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try adjusting your theme or style.');
      }
      
      let lyrics = response.text();
      
      if (!lyrics || lyrics.trim().length === 0) {
        throw new Error('No lyrics generated');
      }
      
      // Validate lyrics quality
      if (lyrics.length < 50) {
        throw new Error('Generated lyrics are too short. Please try again.');
      }
      // 截断至最大字符数
      if (lyrics.length > (parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000'))) {
        lyrics = lyrics.slice(0, parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000'));
      }
      
      return lyrics.trim();
    }, 'generate lyrics');
  }

  async generateLyricsStream(
    params: LyricsGenerationParams, 
    personalStyle: PersonalStyle | PersonalStyle[] | null,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return this.retryWithBackoff(async () => {
      const model = this.getModel(params.modelType);
      const prompt = this.buildGenerationPrompt(params, personalStyle || undefined);
      
      const result = await this.withTimeout(
        (model as any).generateContentStream(prompt),
        NETWORK_SOFT_TIMEOUT_MS,
        'AI stream'
      ) as any;

      const iterator: AsyncIterator<any> = (result.stream as any)[Symbol.asyncIterator]();
      let total = 0;
      
      while (true) {
        const { value, done } = await iterator.next();
        if (done) break;
        
        try {
          const delta: string = typeof value.text === 'function' ? value.text() : '';
          if (delta && delta.length > 0) {
            const remaining = (parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000')) - total;
            if (remaining <= 0) break;
            
            const chunk = remaining < delta.length ? delta.slice(0, remaining) : delta;
            total += chunk.length;
            onChunk(chunk);
          }
        } catch (error) {
          console.error('Error processing stream chunk:', error);
        }
      }
    }, 'generate lyrics stream');
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw new Error(`Failed to ${operationName} after ${maxRetries} attempts: ${lastError!.message}`);
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('safety') ||
      message.includes('blocked') ||
      message.includes('invalid') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    );
  }

  // Deprecated rationale-only generator removed to reduce confusion.

  async rewriteLyrics(
    originalLyrics: string, 
    selectedPortion: string, 
    rewriteRequest: string,
    modelType: 'basic' | 'pro' = 'basic'
  ): Promise<string> {
    return this.retryWithBackoff(async () => {
      const model = this.getModel(modelType);
      const prompt = this.buildRewritePrompt(originalLyrics, selectedPortion, rewriteRequest);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Check for safety blocks
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Rewrite request was blocked by safety filters. Please try a different approach.');
      }
      
      const rewrittenPortion = response.text();
      
      if (!rewrittenPortion || rewrittenPortion.trim().length === 0) {
        throw new Error('No rewritten lyrics generated');
      }
      
      return rewrittenPortion.trim();
    }, 'rewrite lyrics');
  }

  async regenerateLyrics(params: LyricsGenerationParams, previousLyrics: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      const model = this.getModel(params.modelType, true); // Pass true for regeneration
      const prompt = this.buildGenerationPrompt(params);
      
      // Use the exact same prompt as generation, but with higher temperature for more creativity
      // No need for extra regeneration requirements - the higher temperature will naturally create different content
      
      const result = await this.withTimeout(model.generateContent(prompt), NETWORK_SOFT_TIMEOUT_MS, 'AI request');
      const response = await result.response;
      
      // Check for safety blocks
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try adjusting your theme or style.');
      }
      
      let lyrics = response.text();
      
      if (!lyrics || lyrics.trim().length === 0) {
        throw new Error('No lyrics generated');
      }
      
      // Validate lyrics quality
      if (lyrics.length < 50) {
        throw new Error('Generated lyrics are too short. Please try again.');
      }
      if (lyrics.length > (parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000'))) {
        lyrics = lyrics.slice(0, parseInt(process.env.AI_MAX_OUTPUT_CHARS || '12000'));
      }
      
      return lyrics.trim();
    }, 'regenerate lyrics');
  }
}

export const aiService = new AIService();
