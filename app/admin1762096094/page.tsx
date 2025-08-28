import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ADMIN_CONFIG } from '@/lib/admin-config';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${ADMIN_CONFIG.signInPath}?returnTo=${encodeURIComponent(ADMIN_CONFIG.adminPath)}`);
  }

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // 读取必要数据（服务端渲染）
  const { data: categories } = await adminDb
    .from('categories')
    .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at, updated_at')
    .order('name');

  const { data: posts } = await adminDb
    .from('posts')
    .select(`
      id, title, slug, status, created_at, updated_at, published_at, view_count, category_id,
      category:categories(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage blog posts and categories</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Blog Posts</h2>
            <Link href="/admin1762096094/posts/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Post
            </Link>
          </div>

          {!posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">Create your first blog post to get started</p>
              <Link href="/admin1762096094/posts/new" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block">
                Create Post
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post: any) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{post.category?.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {post.status === 'published' && (
                            <a href={`/blog/${post.slug}`} target="_blank" className="text-blue-600 hover:text-blue-900" title="View">
                              <EyeIcon className="h-5 w-5" />
                            </a>
                          )}
                          <Link href={`/admin1762096094/posts/${post.id}`} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          {/* 删除动作保留到 API 页面内处理，避免在此示例增加复杂性 */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <Link href="/admin1762096094/categories/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Category
            </Link>
          </div>

          {!categories || categories.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-600 mb-6">Create your first category to organize posts</p>
              <Link href="/admin1762096094/categories/new" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block">
                Create Category
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: any) => (
                <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <div className="flex space-x-1">
                      <Link href={`/admin1762096094/categories/${category.id}`} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      {/* 删除动作保留到编辑页面，避免在此示例增加复杂性 */}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">/blog/category/{category.slug}</p>
                  {category.meta_description && (
                    <p className="text-sm text-gray-500">{category.meta_description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}