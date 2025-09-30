import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { buildTitleBase, buildDescription } from '@/lib/seo';
import { cacheService } from '@/lib/cache-service';
import { formatDate } from '@/lib/utils';
import type { Post, Category } from '@/lib/types';

// Next.js 15: dynamic route params may be a Promise
type CategoryPageProps = { params: Promise<{ slug: string }> };

// 生成静态参数（SSG）
export async function generateStaticParams() {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true);

  return categories?.map((c) => ({ slug: c.slug })) || [];
}

async function getCategory(slug: string): Promise<Category | null> {
  // 尝试从缓存中读取
  const cached = await cacheService.getCategories();
  const byCache = Array.isArray(cached)
    ? (cached as any[]).find((c) => c?.slug === slug)
    : null;
  if (byCache) return byCache as Category;

  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, created_at, updated_at, is_active, sort_order, seo_title, meta_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return data as Category;
}

async function getCategoryPosts(categoryId: number): Promise<Post[]> {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30);
  if (error || !data) return [] as any;
  return data as any;
}

async function getOtherCategories(currentId: number): Promise<Category[]> {
  const cached = await cacheService.getCategories();
  if (Array.isArray(cached) && cached.length) {
    return (cached as any[]).filter((c) => c?.id !== currentId) as Category[];
  }
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data || []) as any;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    return { title: 'Category Not Found' };
  }
  return {
    title: buildTitleBase(`${category.name} Tips & Guides`),
    description: buildDescription(`Discover expert ${category.name.toLowerCase()} tips, techniques, and guides for songwriting and lyric creation.`),
    keywords: [category.name.toLowerCase(), 'songwriting', 'lyrics', 'music', 'tips'],
    alternates: { canonical: `/blog/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = (await params);
  const category = await getCategory(slug);
  if (!category) {
    // 分类不存在：语义化 404
    notFound();
  }

  const [posts, otherCategories] = await Promise.all([
    getCategoryPosts((category as Category).id),
    getOtherCategories((category as Category).id)
  ]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${(category as Category).name} - AI Lyrics Generator Blog`,
    description: `Articles about ${(category as Category).name.toLowerCase()} in songwriting and music creation.`,
    url: `https://ai-lyrics-generator.net/blog/category/${(category as Category).slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.meta_description,
          url: `https://ai-lyrics-generator.net/blog/${post.slug}`,
          datePublished: post.created_at,
          author: { '@type': 'Organization', name: 'AI Lyrics Generator' }
        }
      }))
    }
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
                {(category as Category).name}
              </h1>
              <p className="text-xl text-black max-w-2xl mx-auto">
                Expert tips and guides for {(category as Category).name.toLowerCase()} in songwriting and music creation
              </p>
              <div className="mt-4">
                <Link href="/blog" className="text-blue-600 hover:text-blue-500 font-medium">
                  &larr; Back to all articles
                </Link>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Yet</h3>
                <p className="text-gray-600 mb-6">
                  We&apos;re working on creating amazing {(category as Category).name.toLowerCase()} content for you. Check back soon!
                </p>
                <Link href="/blog" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Browse All Articles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(category as Category).name}
                        </span>
                        <span className="text-gray-300" aria-hidden="true">&middot;</span>
                        <time className="text-sm text-gray-500" dateTime={post.created_at}>
                          {formatDate(post.created_at)}
                        </time>
                      </div>

                      <h2 className="text-xl font-bold text-black mb-3">
                        <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>

                      {post.meta_description && (
                        <p className="text-black mb-4 leading-relaxed line-clamp-3">
                          {post.meta_description}
                        </p>
                      )}

                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium">
                        Read more
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

