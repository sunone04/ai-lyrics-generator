// 模拟AI服务 - 用于网络受限环境的开发测试
import { LyricsGenerationParams } from './types';

export class MockAIService {
  
  async generateLyrics(params: LyricsGenerationParams): Promise<string> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 根据参数生成模拟歌词
    const mockLyrics = this.generateMockLyrics(params);
    return mockLyrics;
  }

  async rewriteLyrics(
    originalLyrics: string, 
    selectedPortion: string, 
    rewriteRequest: string,
    modelType: 'basic' | 'pro' = 'basic'
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `[Rewritten Section]
This is a rewritten version of the selected lyrics
Based on your request: ${rewriteRequest}
Original style maintained with improvements
Fresh metaphors and authentic emotion`;
  }

  async regenerateLyrics(params: LyricsGenerationParams, previousLyrics: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const regeneratedLyrics = this.generateMockLyrics(params, true);
    return regeneratedLyrics;
  }

  private generateMockLyrics(params: LyricsGenerationParams, isRegeneration: boolean = false): string {
    const prefix = isRegeneration ? '[Regenerated] ' : '';
    
    const mockLyrics = `${prefix}[Verse 1]
In the ${params.language.toLowerCase()} style of ${params.musicStyle}
Singing about ${params.musicTheme} with ${params.lyricStyle} flow
${params.artistStyle ? `Inspired by ${params.artistStyle}'s unique sound` : 'Original creative expression'}
Building stories that the heart can know

[Chorus]
This is a ${params.lengthOption} composition
${params.rhymeRequirement} throughout the song
${params.emotionIntensity > 70 ? 'Intense emotions burning bright' : 'Gentle feelings soft and strong'}
Where every word feels like it belongs

[Verse 2]
${params.intentOrRequest ? `Following your vision: ${params.intentOrRequest.substring(0, 50)}...` : 'Crafting verses with authentic voice'}
${params.bpm ? `Moving to the rhythm of ${params.bpm} BPM` : 'Finding rhythm in the choice'}
${params.songStructure} structure guides the way
Professional lyrics for today

[Bridge]
${params.paragraphLength ? `With ${params.paragraphLength} in mind` : 'Building bridges in the mind'}
Original metaphors we find
No clichés here, just pure art
Speaking directly to the heart

[Outro]
This mock lyric shows the format
That our AI service will create
When network issues are resolved
Professional quality, never late

---
Generated using ${params.modelType === 'pro' ? 'Gemini 2.5 Pro (Mock)' : 'Gemini 2.5 Flash (Mock)'}
Parameters: ${JSON.stringify(params, null, 2)}`;

    return mockLyrics;
  }
}

export const mockAiService = new MockAIService();