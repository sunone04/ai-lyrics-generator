import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { cacheService } from '@/lib/cache-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 检查管理员session cookie
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { name, slug, seo_title, meta_description } = await request.json();

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Insert category using admin client
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: category, error: dbError } = await adminClient
      .from('categories')
      .insert({
        name,
        slug,
        seo_title: seo_title || name,
        meta_description: meta_description || null,
        is_active: true
      })
      .select('id, name, slug, seo_title, meta_description, is_active, created_at, updated_at')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    // 标准SaaS做法：管理操作后立即清除相关缓存
    try {
      await cacheService.clearCategoryCache(category.id);
      // 触发 ISR 失效
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': String(process.env.REVALIDATE_SECRET || '') },
          body: JSON.stringify({ path: '/blog' })
        });
      } catch {}
    } catch (cacheErr) {
      console.warn('Cache clear after category creation failed:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error: any) {
    console.error('Category creation error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取所有分类（永久缓存，无需认证）
    const categories = await cacheService.getCategories()
    
    if (categories && categories.length > 0) {
      return NextResponse.json({
        success: true,
        categories
      })
    }
    
    // 如果缓存为空，返回空数组（避免无限重试）
    return NextResponse.json({
      success: true,
      categories: []
    })
  } catch (error: any) {
    console.error('Categories fetch error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
