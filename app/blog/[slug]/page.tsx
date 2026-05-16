import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cacheService } from '@/lib/cache-service';
import { formatDate } from '@/lib/utils';
import { Post } from '@/lib/types';
import ShareButton from '@/components/ui/share-button';
import { buildTitleBase, buildDescription, clampTitle } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { SITE_CONFIG } from '@/lib/constants';

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return [];
  
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published');

  const validPosts = posts?.filter(post => 
    post.slug && 
    post.slug.length > 0 && 
    post.slug !== 'a12'
  ) || [];

  return validPosts.map((post) => ({
    slug: post.slug,
  }));
}

async function getBlogPost(slug: string): Promise<Post | null> {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return null;
  
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !post) {
    return null;
  }

  return post;
}

async function getRelatedPosts(post: Post): Promise<Post[]> {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: relatedPosts, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('category_id', post.category_id)
    .neq('id', post.id)
    .eq('status', 'published')
    .limit(3);

  if (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }

  return relatedPosts || [];
}

async function getAllCategories() {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: buildTitleBase(post.seo_title || post.title || 'Blog Post'),
    description: buildDescription(post.meta_description || ''),
    keywords: post.category?.name ? [post.category.name, 'songwriting', 'lyrics', 'music'] : undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: clampTitle(post.seo_title || post.title || 'Blog Post'),
      description: buildDescription(post.meta_description || ''),
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      authors: ['AI Lyrics Generator'],
      section: post.category?.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: clampTitle(post.seo_title || post.title || 'Blog Post'),
      description: buildDescription(post.meta_description || ''),
    },
  };
}

function generateStructuredData(post: Post) {
  const base = (SITE_CONFIG.url || '').replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || undefined,
    author: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: base,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: base,
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${base}/blog/${post.slug}`,
    },
    articleSection: post.category?.name || undefined,
    keywords: [post.category?.name, 'songwriting', 'lyrics', 'music']
      .filter(Boolean)
      .join(', '),
    url: `${base}/blog/${post.slug}`,
  } as const;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);
  const allCategories = await getAllCategories();
  const structuredData = generateStructuredData(post);
  const base = (SITE_CONFIG.url || '').replace(/\/$/, '');
  const breadcrumbItems: any[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: base },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${base}/blog` },
  ];
  if (post.category?.slug && post.category?.name) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.category.name,
      item: `${base}/blog/category/${post.category.slug}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: post.title,
      item: `${base}/blog/${post.slug}`,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.title,
      item: `${base}/blog/${post.slug}`,
    });
  }
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbList),
        }}
      />
      
      <div className="min-h-screen noise-bg py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          
          <article className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-8 border-b border-white/5">
              <div className="flex items-center space-x-2 mb-4">
                {post.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {post.category.name}
                  </span>
                )}
                {post.published_at && (
                  <time className="text-xs text-zinc-500" dateTime={post.published_at}>
                    {formatDate(post.published_at)}
                  </time>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {post.title}
              </h1>
              
              {post.meta_description && (
                <p className="text-base text-zinc-400 leading-relaxed">
                  {post.meta_description}
                </p>
              )}
            </div>

            <div className="px-6 py-8">
              <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-zinc-400 prose-a:text-violet-400 prose-strong:text-zinc-200 prose-code:text-violet-300 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/5">
                {post.content ? (
                  <>
                    <div 
                      className="blog-content"
                      dangerouslySetInnerHTML={{ __html: post.content.replace(/on\w+="[^"]*"/g, '') }} 
                    />
                    <div className="not-prose mt-10 p-6 rounded-xl border border-violet-500/20 bg-violet-600/5">
                      <h3 className="text-lg font-semibold text-white mb-2">Try Our AI Lyrics Generator</h3>
                      <p className="text-sm text-zinc-400 mb-4">Put these ideas into practice instantly and create professional-quality lyrics.</p>
                      <Link href="/generate" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 px-5 rounded-lg transition-colors text-sm font-medium">
                        Generate Lyrics
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500">Content not available.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-5 border-t border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                {post.published_at && (
                  <div className="text-xs text-zinc-600">
                    Published: {formatDate(post.published_at)}
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <ShareButton 
                    title={post.title}
                    description={post.meta_description || undefined}
                  />
                </div>
              </div>
            </div>
          </article>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6">
              Continue Reading
            </h2>
            {relatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors">
                    <div className="p-5">
                      <div className="flex items-center space-x-2 mb-3">
                        {relatedPost.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {relatedPost.category.name}
                          </span>
                        )}
                        {relatedPost.published_at && (
                          <time className="text-[11px] text-zinc-600" dateTime={relatedPost.published_at}>
                            {formatDate(relatedPost.published_at)}
                          </time>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`} className="hover:text-violet-400 transition-colors">
                          {relatedPost.title}
                        </Link>
                      </h3>
                      
                      {relatedPost.meta_description && (
                        <p className="text-xs text-zinc-500 line-clamp-3">
                          {relatedPost.meta_description}
                        </p>
                      )}
                      
                      <Link
                        href={`/blog/${relatedPost.slug}`}
                        className="inline-block mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                      >
                        Read more →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white mb-4 text-center">
                  Explore More Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/blog/category/${category.slug}`}
                      className="text-xs text-zinc-400 hover:text-white py-2 px-3 rounded-lg border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-colors text-center"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/blog"
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    View All Posts →
                  </Link>
                </div>
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
