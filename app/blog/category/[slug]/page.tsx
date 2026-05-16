import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/breadcrumbs';

import { buildTitleBase, buildDescription } from '@/lib/seo';
import { cacheService } from '@/lib/cache-service';
import { formatDate } from '@/lib/utils';
import type { Post, Category } from '@/lib/types';
import { SITE_CONFIG } from '@/lib/constants';

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true);

  return categories?.map((c) => ({ slug: c.slug })) || [];
}

async function getCategory(slug: string): Promise<Category | null> {
  const cached = await cacheService.getCategories();
  const byCache = Array.isArray(cached)
    ? (cached as any[]).find((c) => c?.slug === slug)
    : null;
  if (byCache) return byCache as Category;

  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return null;
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
  if (!supabase) return [] as any;
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
  if (!supabase) return [] as any;
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
  const base = (SITE_CONFIG.url || '').replace(/\/$/, '');
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${base}/blog` },
      { '@type': 'ListItem', position: 3, name: (category as Category).name, item: `${base}/blog/category/${(category as Category).slug}` },
    ],
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />

      <div className="min-h-screen noise-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="mt-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {(category as Category).name}
              </h1>
              <p className="text-base text-zinc-400 max-w-2xl mx-auto">
                Expert tips and guides for {(category as Category).name.toLowerCase()} in songwriting and music creation
              </p>
              <div className="mt-4">
                <Link href="/blog" className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  ← Back to all articles
                </Link>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <h3 className="text-lg font-medium text-white mb-2">No Articles Yet</h3>
                <p className="text-sm text-zinc-500 mb-6">
                  We&apos;re working on creating amazing {(category as Category).name.toLowerCase()} content for you. Check back soon!
                </p>
                <Link href="/blog" className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                  Browse All Articles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <article key={post.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors">
                    <div className="p-5">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {(category as Category).name}
                        </span>
                        <span className="text-zinc-700" aria-hidden="true">·</span>
                        <time className="text-[11px] text-zinc-600" dateTime={post.created_at}>
                          {formatDate(post.created_at)}
                        </time>
                      </div>

                      <h2 className="text-base font-bold text-white mb-2">
                        <Link href={`/blog/${post.slug}`} className="hover:text-violet-400 transition-colors">
                          {post.title}
                        </Link>
                      </h2>

                      {post.meta_description && (
                        <p className="text-xs text-zinc-500 mb-4 leading-relaxed line-clamp-3">
                          {post.meta_description}
                        </p>
                      )}

                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                        Read more →
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

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;
