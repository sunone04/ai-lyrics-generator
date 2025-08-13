import { NextResponse } from 'next/server';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { validatePaddleConfig } from '@/lib/paddle-validator';

export async function GET() {
  try {
    // 首先验证配置
    const validation = validatePaddleConfig();
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: '配置不完整',
        details: validation.errors
      }, { status: 400 });
    }

    // 初始化Paddle SDK
    const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: process.env.NODE_ENV === 'production' ? Environment.production : Environment.sandbox,
    });

    try {
      // 尝试获取价格列表来测试连接
      const prices = await paddle.prices.list();
      
      return NextResponse.json({
        success: true,
        message: 'Paddle API连接成功',
        details: {
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
          pricesCount: '连接成功，价格列表已获取'
        }
      });
    } catch (paddleError: any) {
      console.error('Paddle API连接失败:', paddleError);
      
      return NextResponse.json({
        success: false,
        error: 'Paddle API连接失败',
        details: paddleError.message || '未知错误'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '连接测试过程中发生错误',
      details: error.message
    }, { status: 500 });
  }
}
