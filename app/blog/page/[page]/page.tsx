import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { BLOG_CATEGORIES } from '@/lib/constants';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { formatDate } from '@/lib/utils';
import { Category } from '@/lib/types';
// import { Post } from '@/lib/types'; // Unused

interface BlogPageProps {
  params: Promise<{
    page: string;
  }>;
}

const POSTS_PER_PAGE = 12;

// 生成静态参数 - 为分页生成静态页面
export async function generateStaticParams() {
  // 在构建时使用管理员客户端，不依赖cookies
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE);
  
  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }));
}

// 获取分页博客文章
async function getBlogPosts(page: number) {
  const supabase = await createServerClient();
  const offset = (page - 1) * POSTS_PER_PAGE;
  
  const { data: posts, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  if (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], totalCount: 0 };
  }

  return { posts: posts || [], totalCount: count || 0 };
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createServerClient();
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return BLOG_CATEGORIES;
  }

  return categories || BLOG_CATEGORIES;
}

// 动态生成元数据
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { page: pageParam } = await params;
  const page = parseInt(pageParam);
  
  if (isNaN(page) || page < 1) {
    return {
      title: 'Page Not Found',
    };
  }

  const pageTitle = page === 1 
    ? 'Blog - AI Lyrics Generator Tips, Techniques & Guides'
    : `Blog - Page ${page} | AI Lyrics Generator`;

  return {
    title: pageTitle,
    description: 'Discover expert tips, techniques, and guides for songwriting, lyric creation, and using AI tools effectively. Learn from professional songwriters and music industry experts.',
    keywords: ['songwriting tips', 'lyric writing', 'music composition', 'ai lyrics', 'songwriting techniques'],
  };
}

// 分页组件
function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pages = [];
  const showPages = 5; // 显示的页码数量
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  const endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-2 mt-12">
      {/* 上一页 */}
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? '/blog' : `/blog/page/${currentPage - 1}`}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
        >
          Previous
        </Link>
      )}

      {/* 第一页 */}
      {startPage > 1 && (
        <>
          <Link
            href="/blog"
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
          >
            1
          </Link>
          {startPage > 2 && (
            <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
          )}
        </>
      )}

      {/* 页码 */}
      {pages.map((page) => (
        <Link
          key={page}
          href={page === 1 ? '/blog' : `/blog/page/${page}`}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page === currentPage
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {page}
        </Link>
      ))}

      {/* 最后一页 */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
          )}
          <Link
            href={`/blog/page/${totalPages}`}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* 下一页 */}
      {currentPage < totalPages && (
        <Link
          href={`/blog/page/${currentPage + 1}`}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

export default async function BlogPageWithPagination({ params }: BlogPageProps) {
  const { page: pageParam } = await params;
  const page = parseInt(pageParam);
  
  if (isNaN(page) || page < 1) {
    notFound();
  }

  const [{ posts, totalCount }, categories] = await Promise.all([
    getBlogPosts(page),
    getCategories()
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  if (page > totalPages && totalPages > 0) {
    notFound();
  }

  // 生成结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AI Lyrics Generator Blog',
    description: 'Expert tips, techniques, and guides for songwriting, lyric creation, and using AI tools effectively.',
    url: `https://ai-lyrics-generator.net/blog/page/${page}`,
    publisher: {
      '@type': 'Organization',
      name: 'AI Lyrics Generator',
      url: 'https://ai-lyrics-generator.net'
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.meta_description,
      url: `https://ai-lyrics-generator.net/blog/${post.slug}`,
      datePublished: post.created_at,
      dateModified: post.updated_at,
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
          <Breadcrumbs />
          
          <div className="mt-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Songwriting Blog
                {page > 1 && <span className="text-gray-600"> - Page {page}</span>}
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
                      No Posts Found
                    </h3>
                    <p className="text-gray-600">
                      {page === 1 
                        ? "We're working on creating amazing content for you. Check back soon!"
                        : "This page doesn't have any posts yet."
                      }
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

                    {/* 分页 */}
                    <Pagination currentPage={page} totalPages={totalPages} />
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

                {/* 文章统计 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Blog Stats
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Articles:</span>
                      <span className="font-medium">{totalCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Page:</span>
                      <span className="font-medium">{page} of {totalPages}</span>
                    </div>
                  </div>
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
export const revalidate = 60;