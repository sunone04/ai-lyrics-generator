// 简单的AI服务测试脚本
// 运行: node test-ai-service.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// 从环境变量获取API密钥
const apiKey = process.env.GOOGLE_AI_API_KEY || 'AIzaSyDEVTHGnF9uv8Yi5xoZYDfIho3T0PFq32E';

async function testGeminiAPI() {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 测试基础模型
    console.log('📝 Testing Gemini 2.5 Flash (Basic Model)...');
    const basicModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });
    
    const testPrompt = `You are a professional songwriter. Create a short 4-line chorus for a pop song about friendship. Avoid clichés and be original.

Requirements:
- Theme: Friendship
- Style: Pop
- Length: 4 lines
- Avoid overused phrases

Generate only the lyrics with [Chorus] tag.`;

    const result = await basicModel.generateContent(testPrompt);
    const response = await result.response;
    const lyrics = response.text();
    
    console.log('✅ Basic Model Response:');
    console.log(lyrics);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试高级模型
    console.log('📝 Testing Gemini 2.5 Pro (Pro Model)...');
    const proModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });
    
    const proResult = await proModel.generateContent(testPrompt);
    const proResponse = await proResult.response;
    const proLyrics = proResponse.text();
    
    console.log('✅ Pro Model Response:');
    console.log(proLyrics);
    
    console.log('\n🎉 All tests passed! AI service is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 Please check your GOOGLE_AI_API_KEY in .env.local');
    } else if (error.message.includes('model not found')) {
      console.log('💡 Model name might be incorrect. Check the latest Gemini model names.');
    } else {
      console.log('💡 Full error details:', error);
    }
  }
}

// 运行测试
testGeminiAPI();