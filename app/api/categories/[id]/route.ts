import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-config';
import { cacheService } from '@/lib/cache-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Update category using service role
    const adminSupabase = createAdminClient();
    const { data: category, error: dbError } = await adminSupabase
      .from('categories')
      .update({
        name,
        slug,
        meta_description: meta_description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, slug, meta_description, created_at, updated_at')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    // 标准SaaS做法：管理操作后立即清除相关缓存
    try {
      await cacheService.clearCategoryCache(parseInt(id));
      console.log('Blog cache cleared after category update');
      // 触发 ISR 失效：博客首页、分类页
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/blog', secret: process.env.REVALIDATE_SECRET })
        });
      } catch {}
    } catch (cacheErr) {
      console.warn('Cache clear after category update failed:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error: any) {
    console.error('Category update error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Check if any posts are using this category
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('category_id', id);

    if (postsError) {
      console.error('Posts check error:', postsError);
      return NextResponse.json(
        { error: 'Failed to check category usage' },
        { status: 500 }
      );
    }

    if (posts && posts.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${posts.length} post(s) are using this category.` },
        { status: 400 }
      );
    }
    
    // Delete category using admin client with service role
    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    // 标准SaaS做法：删除分类后立即清除相关缓存
    try {
      await cacheService.clearCategoryCache(parseInt(id));
      console.log('Blog cache cleared after category deletion');
    } catch (cacheErr) {
      console.warn('Cache clear after category deletion failed:', cacheErr);
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Category deletion error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}