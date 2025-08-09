import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG, BLOG_CATEGORIES } from '@/lib/constants';

// Revalidate sitemap periodically to include new content
export const revalidate = 60; // seconds

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  
  // Static pages (public, SEO-friendly)
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/generate`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  // Blog category pages
  const categoryPages = BLOG_CATEGORIES.map(category => ({
    url: `${baseUrl}/blog/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Get blog posts and pagination info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let blogPosts: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paginationPages: any[] = [];
  
  try {
    // 创建匿名 Supabase 客户端（不使用 cookies）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get all published posts
    const { data: posts, count } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (posts) {
      blogPosts = posts.map(post => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    }

    // Generate pagination pages
    if (count && count > 12) {
      const totalPages = Math.ceil(count / 12);
      for (let page = 2; page <= totalPages; page++) {
        paginationPages.push({
          url: `${baseUrl}/blog/page/${page}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  return [
    ...staticPages,
    ...categoryPages,
    ...blogPosts,
    ...paginationPages,
  ];
}