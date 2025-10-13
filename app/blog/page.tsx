import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { cacheService } from '@/lib/cache-service';
import { BLOG_CATEGORIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Post } from '@/lib/types';


export const metadata: Metadata = {
  title: 'AI Lyrics Generator Blog: Songwriting Tips, Lyric Techniques, and AI Guides',
  description:
    'Songwriting tips, lyric techniques, and AI lyrics generator guides to create professional lyrics. Tutorials and best practices for artists and producers.',
  keywords: [
    'ai lyrics generator blog',
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
    'lyric generator guide',
    'songwriting blog',
    'lyrics blog'
  ],
  openGraph: {
    title: 'AI Lyrics Generator Blog: Songwriting Tips, Lyric Techniques, and AI Guides',
    description: 'Songwriting tips, lyric techniques, and AI lyrics generator guides.',
    type: 'website',
    url: '/blog',
  },
  alternates: {
    canonical: '/blog',
  },
};

async function getBlogPosts() {
  try {
    // 浣跨敤姘镐箙缂撳瓨鏂规硶
    let posts = await cacheService.getBlogPosts(undefined, 1, 12);
    
    if (posts && posts.posts && posts.posts.length > 0) {
      return { posts: posts.posts, totalCount: posts.total || 0 };
    }
    
    // 濡傛灉缂撳瓨涓虹┖锛岃繑鍥炵┖缁撴灉锛堥伩鍏嶆棤闄愰噸璇曪級
    return { posts: [], totalCount: 0 };
  } catch (error) {
    console.error('Unexpected error in getBlogPosts:', error);
    return { posts: [], totalCount: 0 };
  }
}

async function getCategories() {
  try {
    // 浣跨敤姘镐箙缂撳瓨鏂规硶
    let categories = await cacheService.getCategories();
    
    if (categories && categories.length > 0) {
      return categories;
    }
    
    // 濡傛灉缂撳瓨涓虹┖锛岃繑鍥為粯璁ゅ垎绫?    return BLOG_CATEGORIES;
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
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Organization',
        name: 'AI Lyrics Generator'
      }
    }))
  };

  return (
    <>
      {/* 缁撴瀯鍖栨暟鎹?*/}
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
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Expert tips, techniques, and insights for creating amazing lyrics and music
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Ready to create? <Link href="/generate" className="underline hover:text-blue-700">Try the AI Lyrics Generator</Link>
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
                    {posts.map((post: Post) => (
                      <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center space-x-2 mb-3">
                            {post.category && (
                              <Link
                                href={`/blog/category/${post.category.slug}`}
                                prefetch={false}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                {post.category.name}
                              </Link>
                            )}




                          </div>
                          
                          <h2 className="text-xl font-bold text-black mb-3">
                            <Link
                              href={`/blog/${post.slug}`}
                              prefetch={false}
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
                            prefetch={false}
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

                  {/* 鍒嗛〉閾炬帴 */}
                  {totalCount > 12 && (
                    <div className="mt-12 text-center">
                      <Link
                        href="/blog/page/2"
                        prefetch={false}
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
                  {(categories || []).map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        prefetch={false}
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
                  prefetch={false}
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

// 寮哄埗瀹屽叏闈欐€佽緭鍑猴紝涓斾笉鑷姩鍐嶉獙璇?export const dynamic = 'force-static';
// 鍚敤ISR - 姘镐箙缂撳瓨锛屽彧鍦ㄧ鐞嗘搷浣滄椂閫氳繃 /api/revalidate 鍒锋柊
export const revalidate = false;
