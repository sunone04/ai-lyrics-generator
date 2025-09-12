import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cacheService } from '@/lib/cache-service';
import { createServerComponentClient } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import { Post } from '@/lib/types';
import ShareButton from '@/components/ui/share-button';

// Next.js 15: dynamic route params may be a Promise
type BlogPostPageProps = { params: Promise<{ slug: string }> };

// 生成静态参数 - 这是SSG的关键
export async function generateStaticParams() {
  // 在构建时使用管理员客户端，不依赖cookies
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published');

  // 过滤掉可能有问题的文章
  const validPosts = posts?.filter(post => 
    post.slug && 
    post.slug.length > 0 && 
    post.slug !== 'a12' // 暂时排除有问题的文章
  ) || [];

  return validPosts.map((post) => ({
    slug: post.slug,
  }));
}

// 获取单个博客文章（构建时获取，运行时无需认证）
async function getBlogPost(slug: string): Promise<Post | null> {
  // 使用AdminClient，无需认证检查
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
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

// 获取相关文章
async function getRelatedPosts(post: Post): Promise<Post[]> {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();

  const { data: relatedPosts, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('category_id', post.category_id)
    .neq('id', post.id) // 排除当前文章
    .eq('status', 'published')
    .limit(3);

  if (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }

  return relatedPosts || [];
}

// 获取所有分类
async function getAllCategories() {
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

// 动态生成元数据
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.seo_title || post.title,
    description: post.meta_description,
    keywords: post.category?.name ? [post.category.name, 'songwriting', 'lyrics', 'music'] : undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      authors: ['AI Lyrics Generator'],
      section: post.category?.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.meta_description,
    },
  };
}

// 生成结构化数据
function generateStructuredData(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description,
    author: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: 'https://ai-lyrics-generator.net'
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: 'https://ai-lyrics-generator.net'
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://ai-lyrics-generator.net/blog/${post.slug}`
    },
    articleSection: post.category?.name,
    keywords: [post.category?.name, 'songwriting', 'lyrics', 'music'].filter(Boolean).join(', '),
    url: `https://ai-lyrics-generator.net/blog/${post.slug}`,
    image: 'https://ai-lyrics-generator.net/og-image.jpg'
  };
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

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <ClientBreadcrumbs /> */}
          
          <article className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 文章头部 */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                {post.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {post.category.name}
                  </span>
                )}
                {post.published_at && (
                  <time className="text-sm text-gray-500" dateTime={post.published_at}>
                    {formatDate(post.published_at)}
                  </time>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {post.title}
              </h1>
              
              {post.meta_description && (
                <p className="text-xl text-black leading-relaxed">
                  {post.meta_description}
                </p>
              )}
            </div>

            {/* 文章内容 */}
            <div className="px-6 py-8">
              <div className="prose prose-lg max-w-none prose-blue prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900">
                {post.content ? (
                  <>
                    <div 
                      className="blog-content"
                      dangerouslySetInnerHTML={{ __html: post.content.replace(/on\w+="[^"]*"/g, '') }} 
                    />
                    <div className="not-prose mt-10 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Try Our AI Lyrics Generator</h3>
                      <p className="text-gray-600 mb-4">Put these ideas into practice instantly and create professional-quality lyrics.</p>
                      <Link href="/generate" className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium">
                        Generate Lyrics
                      </Link>
                    </div>
                  </>
                ) : (
                  <p>Content not available.</p>
                )}
              </div>
            </div>

            {/* 文章底部 */}
            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                {post.published_at && (
                  <div className="text-sm text-gray-500">
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

          {/* 相关文章推荐 */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Continue Reading
            </h2>
            {relatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        {relatedPost.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {relatedPost.category.name}
                          </span>
                        )}
                        {relatedPost.published_at && (
                          <time className="text-xs text-gray-500" dateTime={relatedPost.published_at}>
                            {formatDate(relatedPost.published_at)}
                          </time>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`} className="hover:text-blue-600 transition-colors">
                          {relatedPost.title}
                        </Link>
                      </h3>
                      
                      {relatedPost.meta_description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {relatedPost.meta_description}
                        </p>
                      )}
                      
                      <Link
                        href={`/blog/${relatedPost.slug}`}
                        className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Read more →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Explore More Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/blog/category/${category.slug}`}
                      className="inline-block bg-white text-gray-700 py-2 px-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-sm text-center"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/blog"
                    className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
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

// 强制完全静态输出，且不自动再验证
export const dynamic = 'force-static';
// 禁止动态参数回退（仅服务构建/重新验证过的路径）
export const dynamicParams = false;
// 启用ISR - 永久缓存，只在管理操作时通过 /api/revalidate 刷新
export const revalidate = false;
