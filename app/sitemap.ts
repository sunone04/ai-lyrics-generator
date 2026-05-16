import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG } from '@/lib/constants';

// 极长 ISR：仅在按需 revalidate 或部署时刷新
export const revalidate = 31536000;

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
      url: `${baseUrl}/edit`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/personal-style`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
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

  // Blog category pages (from DB to reflect admin updates)
  let categoryPages: MetadataRoute.Sitemap = [];

  // Get blog posts and pagination info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let blogPosts: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paginationPages: any[] = [];
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return [...staticPages];
    }
    
    const supabase = createClient(url, key);
    
    // Fetch active categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categories) {
      categoryPages = categories.map((category: any) => ({
        url: `${baseUrl}/blog/category/${category.slug}`,
        lastModified: new Date(category.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }

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
