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
    const { title, content, slug, seo_title, meta_description, category_id, status, published_at } = await request.json();

    // Validate required fields
    if (!title || !content || !slug || !category_id) {
      return NextResponse.json(
        { error: 'Title, content, slug, and category are required' },
        { status: 400 }
      );
    }

    // Insert post using admin client (service role)
    const adminClient = createAdminClient();
    const { data: post, error: dbError } = await adminClient
      .from('posts')
      .insert({
        title,
        content,
        slug,
        seo_title: seo_title || title,
        meta_description: meta_description || null,
        category_id,
        status: 'published',
        published_at: published_at || new Date().toISOString()
      })
      .select('id, title, slug, status, category_id, created_at, updated_at, published_at')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // 低成本按需刷新（通过内部API，避免在函数内做大量工作）
    try {
      if (post.status === 'published') {
        const payloads = [
          { path: '/blog' },
          { path: '/sitemap.xml' },
          ...(post.slug ? [{ path: `/blog/${post.slug}` }] : []),
          // 粗粒度刷新分类页：不查slug，按需手工刷新具体分类也可
          { path: '/blog' }
        ]
        await Promise.all(
          payloads.map(p => fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': String(process.env.REVALIDATE_SECRET || '') },
            body: JSON.stringify({ ...p })
          }))
        )
      }

      await cacheService.clearPostCache(post.id)
    } catch (reErr) {
      console.warn('Revalidate after post create failed:', reErr)
    }

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error: any) {
    console.error('Post creation error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Create admin client for database operations
    const adminClient = createAdminClient();
    
    // Get all posts with category information
    const { data: posts, error } = await adminClient
      .from('posts')
      .select(`
        id, title, slug, status, excerpt, created_at, updated_at, published_at, view_count, category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      posts
    });

  } catch (error: any) {
    console.error('Posts fetch error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
