import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, tag, secret } = body;

    // 验证密钥（在生产环境中使用环境变量）
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (path) {
      // 重新验证特定路径
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    }

    if (tag) {
      // 重新验证特定标签
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag 
    });
  } catch (err) {
    console.error('Error revalidating:', err);
    return NextResponse.json({ 
      message: 'Error revalidating',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 支持GET请求用于测试
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

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