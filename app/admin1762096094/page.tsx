'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { Post, Category } from '@/lib/types';
import { LoadingPage } from '@/components/ui/loading';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/admin-config';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      // 管理员权限检查
      if (!isAdmin(user.email)) {
        router.push('/');
        return;
      }
      
      setUser(user);
      await fetchData();
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 获取分类
      const supabase = createClient();
      const { data: categoriesFromDB, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, seo_title, meta_description, sort_order, is_active, created_at, updated_at')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesFromDB || []);

      // 获取文章（避免select(*)，只选择必要字段）
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, title, slug, status, created_at, updated_at, published_at, view_count, category_id,
          category:categories!inner(id, name, slug, created_at, updated_at)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts((postsData as unknown as Post[]) || []);

    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      // Get user session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete post');
      }

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      // Get user session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  if (isLoading) {
    return <LoadingPage text="Loading admin panel..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage blog posts and categories</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Posts ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categories.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'posts' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Blog Posts</h2>
                  <button
                    onClick={() => router.push('/admin1762096094/posts/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Post
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600 mb-6">Create your first blog post to get started</p>
                    <button
                      onClick={() => router.push('/admin1762096094/posts/new')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Post
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                          <tr key={post.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{post.title}</div>
                              <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{post.category?.name}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                post.status === 'published' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {post.status === 'published' && (
                                  <button
                                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View"
                                  >
                                    <EyeIcon className="h-5 w-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => router.push(`/admin1762096094/posts/${post.id}`)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
                  <button
                    onClick={() => router.push('/admin1762096094/categories/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Category
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-600 mb-6">Create your first category to organize posts</p>
                    <button
                      onClick={() => router.push('/admin1762096094/categories/new')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Category
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => router.push(`/admin1762096094/categories/${category.id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}