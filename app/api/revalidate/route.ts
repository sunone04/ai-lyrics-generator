import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // 保护：要求携带密钥，避免被公开滥用触发 ISR
    const secret = request.headers.get('x-revalidate-secret');
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { path, tag } = body;

    if (path) {
      // 重新验证特定路径
      revalidatePath(path);
    }

    if (tag) {
      // 重新验证特定标签
      revalidateTag(tag);
    }

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag 
    });
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error revalidating',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 支持GET请求用于测试
export async function GET(request: NextRequest) {
  // 保护：要求携带密钥，避免被公开滥用触发 ISR
  const secret = request.headers.get('x-revalidate-secret');
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  // 仅用于内部调用

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ 
      revalidated: true, 
      path,
      now: Date.now() 
    });
  }

  return NextResponse.json({ 
    message: 'Missing path parameter' 
  }, { status: 400 });
}