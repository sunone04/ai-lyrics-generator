import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { cacheService } from '@/lib/cache-service';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Create admin client for database operations
    const adminClient = createAdminClient();
    
    // Get post by ID with category information
    const { data: post, error } = await adminClient
      .from('posts')
      .select(`
        id, title, slug, content, seo_title, meta_description, 
        category_id, status, created_at, updated_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error: any) {
    console.error('Post fetch error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { title, content, slug, seo_title, meta_description, category_id, status, published_at } = await request.json();

    // Validate required fields
    if (!title || !content || !slug || !category_id) {
      return NextResponse.json(
        { error: 'Title, content, slug, and category are required' },
        { status: 400 }
      );
    }

    // Update post using admin client (service role)
    const adminClient = createAdminClient();
    const { data: post, error: dbError } = await adminClient
      .from('posts')
      .update({
        title,
        content,
        slug,
        seo_title: seo_title || title,
        meta_description: meta_description || null,
        category_id,
        status: 'published',
        published_at: published_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title, slug, status, category_id, created_at, updated_at, published_at')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    // 用内部 API 触发按需刷新，尽量减少当前函数工作量
    try {
      const payloads = [
        { path: '/blog' },
        { path: '/sitemap.xml' },
        ...(post.slug && post.status === 'published' ? [{ path: `/blog/${post.slug}` }] : [])
      ]
      await Promise.all(
        payloads.map(p => fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, secret: process.env.REVALIDATE_SECRET })
        }))
      )

      await cacheService.clearPostCache(parseInt(id))
      console.log('Blog cache cleared after post update')
    } catch (reErr) {
      console.warn('Revalidate after post update failed:', reErr)
    }

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error: any) {
    console.error('Post update error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
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
    // 检查管理员session cookie
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }
    
    // Delete post using admin client
    const adminClient = createAdminClient();
    const { error: dbError } = await adminClient
      .from('posts')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    // 删除后触发按需刷新
    try {
      const payloads = [
        { path: '/blog' },
        { path: '/sitemap.xml' }
      ]
      await Promise.all(
        payloads.map(p => fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, secret: process.env.REVALIDATE_SECRET })
        }))
      )

      await cacheService.clearPostCache(parseInt(id))
      console.log('Blog cache cleared after post deletion')
    } catch (cacheErr) {
      console.warn('Cache clear after post deletion failed:', cacheErr)
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Post deletion error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}