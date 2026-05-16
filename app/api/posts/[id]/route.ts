import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { cacheService } from '@/lib/cache-service';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
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
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { title, content, slug, seo_title, meta_description, category_id, status, published_at } = await request.json();

    if (!title || !content || !slug || !category_id) {
      return NextResponse.json(
        { error: 'Title, content, slug, and category are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
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
        published_at: published_at ?? null,
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

    try {
      const payloads: { path: string }[] = [
        { path: '/blog' },
        { path: '/sitemap.xml' },
      ];

      if (post?.slug) {
        payloads.push({ path: `/blog/${post.slug}` });
      }

      if (post?.category_id) {
        try {
          const catClient = createAdminClient();
          if (catClient) {
            const { data: cat } = await catClient
              .from('categories')
              .select('slug')
              .eq('id', post.category_id)
              .single();
            if (cat?.slug) {
              payloads.push({ path: `/blog/category/${cat.slug}` });
            }
          }
        } catch {}
      }

      await Promise.all(
        payloads.map(p => fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': String(process.env.REVALIDATE_SECRET || '') },
          body: JSON.stringify(p)
        }))
      );
    } catch (error) {
      console.error('Failed to revalidate cache:', error);
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
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }
    
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    const { data: toDelete } = await adminClient
      .from('posts')
      .select('slug, category_id')
      .eq('id', id)
      .single();

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

    try {
      const payloads: { path: string }[] = [
        { path: '/blog' },
        { path: '/sitemap.xml' }
      ];

      if (toDelete?.slug) payloads.push({ path: `/blog/${toDelete.slug}` });

      if (toDelete?.category_id) {
        try {
          const { data: cat } = await adminClient
            .from('categories')
            .select('slug')
            .eq('id', toDelete.category_id)
            .single();
          if (cat?.slug) payloads.push({ path: `/blog/category/${cat.slug}` });
        } catch {}
      }
      await Promise.all(
        payloads.map(p => fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': String(process.env.REVALIDATE_SECRET || '') },
          body: JSON.stringify({ ...p })
        }))
      )

      await cacheService.clearPostCache(parseInt(id))
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
