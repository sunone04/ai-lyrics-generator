import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-config';
import { cacheService } from '@/lib/cache-service';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create service client to verify token
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { name, slug, meta_description } = await request.json();

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Insert category using admin client (service role)
    const adminClient = createAdminClient();
    const { data: category, error: dbError } = await adminClient
      .from('categories')
      .insert({
        name,
        slug,
        meta_description: meta_description || null
      })
      .select('id, name, slug, meta_description, created_at, updated_at')
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
      console.log('Blog cache cleared after category creation');
      // 触发 ISR 失效
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/blog', secret: process.env.REVALIDATE_SECRET })
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