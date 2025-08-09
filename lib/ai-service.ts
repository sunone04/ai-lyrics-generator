import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LyricsGenerationParams } from './types';
import { mockAiService } from './ai-service-mock';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// 开发模式开关 - 当网络无法访问Google AI时使用
const USE_MOCK_AI = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AI === 'true';

export class AIService {
  private getModel(modelType: 'basic' | 'pro') {
    // Basic model uses Gemini 2.5 Flash, Pro model uses Gemini 2.5 Pro
    const modelName = modelType === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    return genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,        // High creativity for lyrics
        topP: 0.95,             // Diverse vocabulary selection
        topK: 40,               // Balanced word choice diversity
        maxOutputTokens: 2048,  // Sufficient for full songs
        candidateCount: 1,      // Single response for consistency
      },
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
    });
  }

  private buildGenerationPrompt(params: LyricsGenerationParams): string {
    const prompt = `You are a world-class professional songwriter and lyricist with expertise in creating chart-topping hits. Your mission is to generate exceptional, original lyrics that avoid all clichés, overused phrases, and generic expressions.

CREATIVE SPECIFICATIONS:
- Language: ${params.language}
- Music Style: ${params.musicStyle}
- Theme: ${params.musicTheme}
- Length: ${params.lengthOption}
- Lyric Style: ${params.lyricStyle}
- Song Structure: ${params.songStructure}
${params.artistStyle ? `- Artist Style Reference: ${params.artistStyle}` : ''}
${params.rhymeRequirement ? `- Rhyme Requirements: ${params.rhymeRequirement}` : ''}
${params.bpm ? `- BPM: ${params.bpm}` : ''}
${params.emotionIntensity ? `- Emotion Intensity (1-100): ${params.emotionIntensity}` : ''}
${params.paragraphLength ? `- Paragraph Length: ${params.paragraphLength}` : ''}
${params.intentOrRequest ? `- Additional Creative Direction: ${params.intentOrRequest}` : ''}

PROFESSIONAL STANDARDS:
1. AVOID ALL CLICHÉS: Never use overused phrases like "heart of gold," "love like fire," "dreams come true," "time will tell," etc.
2. CREATE FRESH METAPHORS: Use unique, unexpected imagery and original comparisons
3. AUTHENTIC EMOTION: Express feelings through specific, concrete details rather than generic statements
4. STRONG NARRATIVE: Tell a compelling story with vivid scenes and characters
5. MEMORABLE HOOKS: Craft catchy, original phrases that stick in listeners' minds
6. PERFECT STRUCTURE: Use clear section tags [Verse 1], [Chorus], [Verse 2], [Bridge], etc.
7. NATURAL FLOW: Ensure lyrics flow smoothly with the specified BPM and style
8. COMMERCIAL APPEAL: Create lyrics that resonate with target audiences while maintaining artistic integrity

FORBIDDEN PHRASES (Never use these or similar clichés):
- "Follow your dreams" / "Chase your dreams"
- "Love conquers all" / "Love will find a way"
- "Time heals all wounds"
- "Everything happens for a reason"
- "You're the one for me"
- "Heart of gold" / "Heart of stone"
- "Light up my world"
- "Take my breath away"
- "Forever and always"
- "Against all odds"

OUTPUT FORMAT:
Generate ONLY the lyrics with proper structural tags. No explanations, no additional text, no commentary.`;

    return prompt;
  }

  private buildRewritePrompt(originalLyrics: string, selectedPortion: string, rewriteRequest: string): string {
    const prompt = `You are a world-class professional songwriter and lyricist specializing in AI-assisted lyric refinement. Your task is to rewrite a specific portion of lyrics while elevating the overall quality and avoiding all clichés.

ORIGINAL COMPLETE LYRICS:
${originalLyrics}

SECTION TO REWRITE:
${selectedPortion}

REWRITE REQUIREMENTS:
${rewriteRequest}

PROFESSIONAL REWRITE STANDARDS:
1. MAINTAIN CONSISTENCY: Keep the same style, theme, and emotional tone as the original
2. AVOID ALL CLICHÉS: Replace any overused phrases with fresh, original expressions
3. ENHANCE QUALITY: Improve the lyrical content while preserving the song's integrity
4. PRESERVE STRUCTURE: Keep the same structural tags and format
5. NATURAL FLOW: Ensure seamless integration with surrounding lyrics
6. RHYME PRESERVATION: Maintain any rhyme schemes that connect to other sections
7. EMOTIONAL AUTHENTICITY: Use specific, concrete imagery instead of generic statements
8. COMMERCIAL APPEAL: Create memorable, engaging content that resonates with listeners

FORBIDDEN ELEMENTS:
- Generic love clichés ("you're my everything," "love like fire")
- Overused metaphors ("heart of gold," "light up my world")
- Predictable phrases ("dreams come true," "time will tell")
- Weak emotional expressions ("I feel so sad," "you make me happy")

OUTPUT REQUIREMENT:
Provide ONLY the rewritten portion with appropriate structural tags. No explanations, commentary, or additional text.`;

    return prompt;
  }

  async generateLyrics(params: LyricsGenerationParams): Promise<string> {
    // 如果启用了模拟模式，使用模拟服务
    if (USE_MOCK_AI) {
      console.log('🔧 Using mock AI service (development mode)');
      return await mockAiService.generateLyrics(params);
    }

    return this.retryWithBackoff(async () => {
      const model = this.getModel(params.modelType);
      const prompt = this.buildGenerationPrompt(params);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Check for safety blocks
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try adjusting your theme or style.');
      }
      
      const lyrics = response.text();
      
      if (!lyrics || lyrics.trim().length === 0) {
        throw new Error('No lyrics generated');
      }
      
      // Validate lyrics quality
      if (lyrics.length < 50) {
        throw new Error('Generated lyrics are too short. Please try again.');
      }
      
      return lyrics.trim();
    }, 'generate lyrics');
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt} failed for ${operationName}:`, lastError.message);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
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
    // 如果启用了模拟模式，使用模拟服务
    if (USE_MOCK_AI) {
      console.log('🔧 Using mock AI service for rewrite (development mode)');
      return await mockAiService.rewriteLyrics(originalLyrics, selectedPortion, rewriteRequest, modelType);
    }

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
    // 如果启用了模拟模式，使用模拟服务
    if (USE_MOCK_AI) {
      console.log('🔧 Using mock AI service for regeneration (development mode)');
      return await mockAiService.regenerateLyrics(params, previousLyrics);
    }

    return this.retryWithBackoff(async () => {
      const model = this.getModel(params.modelType);
      const basePrompt = this.buildGenerationPrompt(params);
      
      // Enhanced regeneration prompt that avoids repeating previous content
      const regenerationPrompt = `${basePrompt}

REGENERATION REQUIREMENTS:
- Create completely NEW and DIFFERENT lyrics from any previous attempts
- Use ALTERNATIVE creative approaches, metaphors, and storytelling angles
- Explore DIFFERENT emotional perspectives within the same theme
- Generate FRESH vocabulary and unique expressions
- Avoid repeating ANY phrases, concepts, or structures from previous versions
- Maintain the same quality standards while being completely original

PREVIOUS LYRICS TO AVOID REPEATING:
${previousLyrics}

Generate entirely new, creative lyrics that offer a fresh take on the specified theme and style.`;
      
      const result = await model.generateContent(regenerationPrompt);
      const response = await result.response;
      
      // Check for safety blocks
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try adjusting your theme or style.');
      }
      
      const lyrics = response.text();
      
      if (!lyrics || lyrics.trim().length === 0) {
        throw new Error('No lyrics generated');
      }
      
      // Validate lyrics quality
      if (lyrics.length < 50) {
        throw new Error('Generated lyrics are too short. Please try again.');
      }
      
      return lyrics.trim();
    }, 'regenerate lyrics');
  }
}

export const aiService = new AIService();