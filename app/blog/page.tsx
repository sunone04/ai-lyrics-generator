import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { cacheService } from '@/lib/cache-service';
import { BLOG_CATEGORIES } from '@/lib/constants';
import { Post } from '@/lib/types';
import { buildTitleBase, buildDescription, clampTitle } from '@/lib/seo';


export const metadata: Metadata = {
  title: buildTitleBase('Songwriting Tips & AI Guides'),
  description: buildDescription(
    'Songwriting tips, lyric techniques, and AI lyrics generator guides to create professional lyrics. Tutorials and best practices for artists and producers.'
  ),
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
    title: clampTitle('Songwriting Tips & AI Guides'),
    description: buildDescription('Songwriting tips, lyric techniques, and AI lyrics generator guides.'),
    type: 'website',
    url: '/blog',
  },
  alternates: {
    canonical: '/blog',
  },
};

async function getBlogPosts() {
  try {
    let posts = await cacheService.getBlogPosts(undefined, 1, 12);
    
    if (posts && posts.posts && posts.posts.length > 0) {
      return { posts: posts.posts, totalCount: posts.total || 0 };
    }
    
    return { posts: [], totalCount: 0 };
  } catch (error) {
    console.error('Unexpected error in getBlogPosts:', error);
    return { posts: [], totalCount: 0 };
  }
}

async function getCategories() {
  try {
    let categories = await cacheService.getCategories();
    
    if (categories && categories.length > 0) {
      return categories;
    }
    
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="min-h-screen noise-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Songwriting Blog
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Expert tips, techniques, and insights for creating amazing lyrics and music
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Ready to create? <Link href="/generate" className="text-violet-400 hover:text-violet-300 transition-colors">Try the AI Lyrics Generator</Link>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {posts.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-zinc-500">
                    We&apos;re working on creating amazing content for you. Check back soon!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map((post: Post) => (
                      <article key={post.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors">
                        <div className="p-6">
                          <div className="flex items-center space-x-2 mb-3">
                            {post.category && (
                              <Link
                                href={`/blog/category/${post.category.slug}`}
                                prefetch={false}
                                className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                              >
                                {post.category.name}
                              </Link>
                            )}
                          </div>
                          
                          <h2 className="text-lg font-bold text-white mb-3">
                            <Link
                              href={`/blog/${post.slug}`}
                              prefetch={false}
                              className="hover:text-violet-400 transition-colors"
                            >
                              {post.title}
                            </Link>
                          </h2>
                          
                          {post.meta_description && (
                            <p className="text-sm text-zinc-500 mb-4 leading-relaxed line-clamp-3">
                              {post.meta_description}
                            </p>
                          )}
                          
                          <Link
                            href={`/blog/${post.slug}`}
                            prefetch={false}
                            className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                          >
                            Read more
                            <svg className="ml-1 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  {totalCount > 12 && (
                    <div className="mt-12 text-center">
                      <Link
                        href="/blog/page/2"
                        prefetch={false}
                        className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-500 transition-colors"
                      >
                        View More Articles
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <p className="mt-2 text-xs text-zinc-600">
                        Showing 12 of {totalCount} articles
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 mb-8">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {(categories || []).map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        prefetch={false}
                        className="text-sm text-zinc-500 hover:text-violet-400 transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-6">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Start Creating
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Ready to put these tips into practice? Generate professional lyrics with our AI.
                </p>
                <Link
                  href="/generate"
                  prefetch={false}
                  className="block w-full bg-violet-600 hover:bg-violet-500 text-white text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
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

export const dynamic = 'force-static';
export const revalidate = false;
