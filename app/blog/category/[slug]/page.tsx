import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
// import { createServerClient } from '@/lib/supabase-server'; // Unused
// import { BLOG_CATEGORIES } from '@/lib/constants';
// // import ClientBreadcrumbs from '@/components/ui/client-breadcrumbs';
import { formatDate } from '@/lib/utils';
import { Post, Category } from '@/lib/types';
import { cacheService } from '@/lib/cache-service';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 生成静态参数
export async function generateStaticParams() {
  // 在构建时使用管理员客户端，不依赖cookies
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  return categories?.map((category) => ({
    slug: category.slug,
  })) || [];
}

// 获取分类信息
async function getCategory(slug: string): Promise<Category | null> {
  // 首先尝试从缓存获取（需要空值保护）
  const cachedCategories = await cacheService.getCategories();
  const categoryFromCache = Array.isArray(cachedCategories)
    ? cachedCategories.find((cat: any) => cat?.slug === slug)
    : undefined;
  
  if (categoryFromCache) {
    return categoryFromCache as import('@/lib/types').Category;
  }
  
  // 缓存未命中，从数据库获取
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (categoryError || !categoryData) {
    console.error('Error fetching category:', categoryError);
    return null;
  }

  return categoryData;
}

// 获取分类下的文章
async function getCategoryPosts(categoryId: number): Promise<Post[]> {
  // 首先尝试从缓存获取（需要空值保护）
  const cached = await cacheService.getBlogPosts(undefined, 1, 100); // 获取足够多的文章
  
  if (cached && Array.isArray(cached.posts) && cached.posts.length > 0) {
    // 过滤出当前分类的文章
    return cached.posts.filter((post: any) => post?.category_id === categoryId) as Post[];
  }
  
  // 缓存未命中，从数据库获取
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, created_at, updated_at, status, published_at, view_count, category_id,
      category:categories!inner(id, name, slug)
    `)
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .order('published_at', { ascending: false });

  if (postsError) {
    console.error('Error fetching category posts:', postsError);
    return [];
  }

  return (postsData as unknown as import('@/lib/types').Post[]) || [];
}

// 获取其他分类（排除当前分类）
async function getOtherCategories(currentCategoryId: number): Promise<Category[]> {
  // 首先尝试从缓存获取
  const categories = await cacheService.getCategories();
  
  if (Array.isArray(categories) && categories.length > 0) {
    return (categories as unknown as import('@/lib/types').Category[]).filter(cat => cat?.id !== currentCategoryId);
  }
  
  // 缓存未命中，从数据库获取
  const { createAdminClient } = await import('@/lib/supabase-server');
  const supabase = createAdminClient();
  
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at, updated_at')
    .neq('id', currentCategoryId)
    .order('name');

  if (error) {
    console.error('Error fetching other categories:', error);
    return [];
  }

  return (categoriesData as unknown as import('@/lib/types').Category[]) || [];
}

// 动态生成元数据
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - Songwriting Tips & Guides | AI Lyrics Generator`,
    description: `Discover expert ${category.name.toLowerCase()} tips, techniques, and guides for songwriting and lyric creation.`,
    keywords: [category.name.toLowerCase(), 'songwriting', 'lyrics', 'music', 'tips'],
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [posts, otherCategories] = await Promise.all([
    getCategoryPosts(category.id),
    getOtherCategories(category.id)
  ]);

  // 生成结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - AI Lyrics Generator Blog`,
    description: `Articles about ${category.name.toLowerCase()} in songwriting and music creation.`,
    url: `https://ai-lyrics-generator.net/blog/category/${category.slug}`,
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
          author: {
            '@type': 'Organization',
            name: 'AI Lyrics Generator'
          }
        }
      }))
    }
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
              <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
                {category.name}
              </h1>
              <p className="text-xl text-black max-w-2xl mx-auto">
                Expert tips and guides for {category.name.toLowerCase()} in songwriting and music creation
              </p>
              <div className="mt-4">
                <Link
                  href="/blog"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  ← Back to all articles
                </Link>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Articles Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  We&apos;re working on creating amazing {category.name.toLowerCase()} content for you. Check back soon!
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
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
                          {category.name}
                        </span>
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
            )}

            {/* 相关分类 */}
            {otherCategories.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Explore Other Topics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {otherCategories.slice(0, 4).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/blog/category/${cat.slug}`}
                      className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-medium text-gray-900">{cat.name}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Create Your Own Lyrics?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Put these {category.name.toLowerCase()} tips into practice with our AI-powered lyrics generator.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Generate Lyrics Now
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// 启用ISR - 每60秒重新验证一次
// 分类页：180天 ISR；管理操作后按需刷新
export const revalidate = 15552000;

// 启用动态路由 - 允许访问未预生成的分类页面
export const dynamicParams = true;