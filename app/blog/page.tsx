import { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { BLOG_CATEGORIES } from '@/lib/constants';
// import ClientBreadcrumbs from '@/components/ui/client-breadcrumbs';
import { formatDate } from '@/lib/utils';
import { Post } from '@/lib/types';
// import { Category } from '@/lib/types'; // Unused

import { cacheService } from '@/lib/cache-service';

export const metadata: Metadata = {
  title: 'AI Lyrics Generator Blog - Songwriting Tips, Rap Lyrics & Music Guides',
  description: 'Expert songwriting tips, rap lyrics techniques, and AI lyrics generator guides. Learn professional songwriting, lyric writing, and music composition from industry experts. Free tutorials for musicians and rappers.',
  keywords: [
    'ai lyrics generator tips',
    'songwriting tips', 
    'rap lyrics techniques',
    'lyric writing guide',
    'music composition',
    'ai lyrics tutorial',
    'songwriting techniques',
    'rap writing tips',
    'hip hop lyrics guide',
    'song lyrics tutorial',
    'professional songwriting',
    'lyric generator guide'
  ],
  openGraph: {
    title: 'AI Lyrics Generator Blog - Songwriting Tips, Rap Lyrics & Music Guides',
    description: 'Expert songwriting tips, rap lyrics techniques, and AI lyrics generator guides. Learn professional songwriting and music composition.',
    type: 'website',
  },
  alternates: {
    canonical: '/blog',
  },
};

async function getBlogPosts() {
  try {
    // 使用永久缓存方法
    let posts = await cacheService.getBlogPosts(undefined, 1, 12);
    
    if (posts && posts.posts && posts.posts.length > 0) {
      return { posts: posts.posts, totalCount: posts.total || 0 };
    }
    
    // 如果缓存为空，返回空结果（避免无限重试）
    return { posts: [], totalCount: 0 };
  } catch (error) {
    console.error('Unexpected error in getBlogPosts:', error);
    return { posts: [], totalCount: 0 };
  }
}

async function getCategories() {
  try {
    // 使用永久缓存方法
    let categories = await cacheService.getCategories();
    
    if (categories && categories.length > 0) {
      return categories;
    }
    
    // 如果缓存为空，返回默认分类
    return BLOG_CATEGORIES;
  } catch (error) {
    console.error('Unexpected error in getCategories:', error);
    return BLOG_CATEGORIES;
  }
}

export default async function BlogPage() {
  const [{ posts, totalCount }, categories] = await Promise.all([
    getBlogPosts(),
    getCategories()
  ]);

  // 生成结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AI Lyrics Generator Blog',
    description: 'Expert tips, techniques, and guides for songwriting, lyric creation, and using AI tools effectively.',
    url: 'https://ai-lyrics-generator.net/blog',
    publisher: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: 'https://ai-lyrics-generator.net'
    },
    blogPost: posts.map((post: Post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.meta_description,
      url: `https://ai-lyrics-generator.net/blog/${post.slug}`,
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Organization',
        name: 'AI Lyrics Generator'
      }
    }))
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <ClientBreadcrumbs /> */}
        
        <div className="mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Songwriting Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Expert tips, techniques, and insights for creating amazing lyrics and music
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    We&apos;re working on creating amazing content for you. Check back soon!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center space-x-2 mb-3">
                            {post.category && (
                              <Link
                                href={`/blog/category/${post.category.slug}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                {post.category.name}
                              </Link>
                            )}
                            <span className="text-gray-300">•</span>
                            <time className="text-sm text-gray-500" dateTime={post.created_at}>
                              {formatDate(post.created_at)}
                            </time>
                          </div>
                          
                          <h2 className="text-xl font-bold text-black mb-3 line-clamp-2">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {post.title}
                            </Link>
                          </h2>
                          
                                                      {post.meta_description && (
                              <p className="text-black mb-4 leading-relaxed line-clamp-3">
                                {post.meta_description}
                              </p>
                            )}
                          
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Read more
                            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* 分页链接 */}
                  {totalCount > 12 && (
                    <div className="mt-12 text-center">
                      <Link
                        href="/blog/page/2"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        View More Articles
                        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <p className="mt-2 text-sm text-gray-500">
                        Showing 12 of {totalCount} articles
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Start Creating
                </h3>
                <p className="text-gray-600 mb-4">
                  Ready to put these tips into practice? Generate professional lyrics with our AI.
                </p>
                <Link
                  href="/generate"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Generate Lyrics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// 启用ISR - 每60秒重新验证一次
// 博客首页：180天 ISR；管理操作时通过 /api/revalidate 立即刷新
export const revalidate = 15552000;