import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LyricsGenerationParams, PersonalStyle } from './types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

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
  ): AsyncGenerator<string> {

    const model = this.getModel(params.modelType, isRegeneration);
    const prompt = this.buildGenerationPrompt(params, personalStyle);

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
- Music Style: ${params.musicStyle}
- Theme: ${params.musicTheme}
- Length: ${params.lengthOption}
- Lyric Style: ${params.lyricStyle}
- Song Structure: ${params.songStructure}`;

    // Add optional parameters only if they exist and are meaningful
    if (params.artistStyle && params.artistStyle.trim() && params.artistStyle !== 'Other') {
      specifications += `\n- Artist Style Reference: ${params.artistStyle}`;
    }
    
    if (params.rhymeRequirement && params.rhymeRequirement.trim() && params.rhymeRequirement !== 'No specific requirement') {
      specifications += `\n- Rhyme Requirements: ${params.rhymeRequirement}`;
    }
    
    if (params.useBpm && params.bpm && params.bpm > 0) {
      specifications += `\n- BPM: ${params.bpm}`;
    }
    
    if (params.emotionIntensity && params.emotionIntensity > 0) {
      specifications += `\n- Emotion Intensity (1-100): ${params.emotionIntensity}`;
    }
    
    if (params.paragraphLength && params.paragraphLength.trim() && params.paragraphLength !== 'Other') {
      specifications += `\n- Paragraph Length: ${params.paragraphLength}`;
    }
    
    if (params.melody && params.melody.trim()) {
      specifications += `\n- Melody: ${params.melody}`;
    }
    
    if (params.syllablePattern && params.syllablePattern.trim()) {
      specifications += `\n- Syllable Pattern: ${params.syllablePattern}`;
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

1. Adopt the singer's perspective with authentic and concrete emotions

2. Use fresh and meaningful imagery when appropriate  

3. Concise and powerful language, avoiding verbosity and repetition

4. Natural rhyming with rhythmic flow

5. Clear, complete structure with narrative quality. Use appropriate structural tags as requested by the user, such as [Verse 1], [Chorus], [Bridge], etc.

6. Lyrics must perfectly match all user-provided parameters, including syllables, line length, and rhythm

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

1. Maintain the same style, theme, and emotional tone as the complete lyrics

2. Ensure seamless integration with surrounding lyrics

3. Follow the user's requirements as the standard

4. Provide only the rewritten portion with structural tags, no explanations

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
