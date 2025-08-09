import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
// import ClientBreadcrumbs from '@/components/ui/client-breadcrumbs';
import ShareButton from '@/components/ui/share-button';
import { Post } from '@/lib/types';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

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

// 获取单个博客文章
async function getBlogPost(slug: string): Promise<Post | null> {
  const supabase = await createServerClient();
  
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
      publishedTime: post.created_at,
      modifiedTime: post.created_at,
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
    datePublished: post.created_at,
    dateModified: post.created_at,
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
                <time className="text-sm text-gray-500" dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
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
                  <div dangerouslySetInnerHTML={{ __html: post.content.replace(/on\w+="[^"]*"/g, '') }} />
                ) : (
                  <p>Content not available.</p>
                )}
              </div>
            </div>

            {/* 文章底部 */}
            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Published: {formatDate(post.created_at)}
                </div>
                
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
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Ready to Create Your Own Lyrics?
              </h3>
              <p className="text-gray-600 mb-4">
                Put these songwriting tips into practice with our AI-powered lyrics generator.
              </p>
              <Link
                href="/generate"
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Lyrics Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// 启用ISR - 每60秒重新验证一次
export const revalidate = 60;