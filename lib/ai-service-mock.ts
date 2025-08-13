import { LyricsGenerationParams } from './types';

// 模拟AI服务 - 用于开发环境测试
export class MockAIService {
  private generateMockLyrics(params: LyricsGenerationParams): string {
    const { language, musicStyle, musicTheme, lengthOption, lyricStyle } = params;
    
    // 根据参数生成不同的模拟歌词
    let lyrics = '';
    
    if (lengthOption.includes('Short')) {
      lyrics = `[Verse 1]
在${musicStyle}的节奏中
${musicTheme}的故事开始
用${lyricStyle}的方式表达
内心的真实感受

[Chorus]
这是我们的${musicStyle}时刻
${musicTheme}在心中燃烧
用${language}诉说故事
让音乐带我们飞翔`;
    } else if (lengthOption.includes('Medium')) {
      lyrics = `[Verse 1]
当${musicStyle}的旋律响起
${musicTheme}在心中绽放
用${lyricStyle}的笔触描绘
那些难忘的瞬间

[Pre-Chorus]
时光飞逝，记忆永恒
每一个音符都是故事

[Chorus]
这是我们的${musicStyle}时代
${musicTheme}在心中燃烧
用${language}诉说梦想
让音乐带我们远航

[Verse 2]
在${musicStyle}的世界里
${musicTheme}永远不会褪色
用${lyricStyle}的方式表达
对生活的热爱和追求`;
    } else {
      lyrics = `[Intro]
${musicStyle}的节奏响起
${musicTheme}在心中绽放

[Verse 1]
当${musicStyle}的旋律响起
${musicTheme}在心中绽放
用${lyricStyle}的笔触描绘
那些难忘的瞬间

[Pre-Chorus]
时光飞逝，记忆永恒
每一个音符都是故事

[Chorus]
这是我们的${musicStyle}时代
${musicTheme}在心中燃烧
用${language}诉说梦想
让音乐带我们远航

[Verse 2]
在${musicStyle}的世界里
${musicTheme}永远不会褪色
用${lyricStyle}的方式表达
对生活的热爱和追求

[Bridge]
当夜幕降临，星光闪烁
${musicStyle}的魔力依然存在
${musicTheme}在心中永恒
用${language}诉说未来

[Chorus]
这是我们的${musicStyle}时代
${musicTheme}在心中燃烧
用${language}诉说梦想
让音乐带我们远航

[Outro]
${musicStyle}的节奏继续
${musicTheme}在心中永恒`;
    }
    
    return lyrics;
  }

  async generateLyrics(params: LyricsGenerationParams): Promise<string> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return this.generateMockLyrics(params);
  }

  async rewriteLyrics(
    originalLyrics: string, 
    selectedPortion: string, 
    rewriteRequest: string,
    modelType: 'basic' | 'pro' = 'basic'
  ): Promise<string> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    // 简单的重写逻辑
    const rewritten = selectedPortion.replace(/的/g, '之')
                                   .replace(/在/g, '于')
                                   .replace(/用/g, '以')
                                   .replace(/让/g, '使');
    
    return `[重写部分]
${rewritten}

${rewriteRequest}的要求已经满足，歌词更加优美和富有诗意。`;
  }

  async regenerateLyrics(params: LyricsGenerationParams, previousLyrics: string): Promise<string> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 2500));
    
    // 生成完全不同的模拟歌词
    const newParams = { ...params };
    newParams.musicTheme = newParams.musicTheme + ' (重新演绎)';
    
    return this.generateMockLyrics(newParams);
  }
}

export const mockAiService = new MockAIService();
