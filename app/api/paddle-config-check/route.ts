import { NextResponse } from 'next/server';
import { validatePaddleConfig } from '@/lib/paddle-validator';

export async function GET() {
  try {
    const validation = validatePaddleConfig();
    
    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors
    });
  } catch (error: any) {
    console.error('配置检查失败:', error);
    
    return NextResponse.json({
      isValid: false,
      errors: ['配置检查过程中发生错误']
    }, { status: 500 });
  }
}
