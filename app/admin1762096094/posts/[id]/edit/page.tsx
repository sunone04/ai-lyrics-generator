'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  seo_title: string;
  meta_description: string;
  category_id: number;
  status: string;
  published_at: string;
}

export default function EditPostPage() {
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    checkAdminAuth();
    fetchData();
  }, [postId]);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check');
      if (!response.ok) {
        router.push('/admin1762096094');
        return;
      }
    } catch (err) {
      router.push('/admin1762096094');
    }
  };

  const fetchData = async () => {
    try {
      const [postRes, categoriesRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch('/api/categories')
      ]);

      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData.post);
      } else {
        setError('Failed to fetch post');
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          content: post.content,
          seo_title: post.title, // 使用标题作为SEO标题
          meta_description: post.meta_description,
          category_id: post.category_id,
          status: 'published',
          published_at: (post.published_at && post.published_at.length > 0) ? post.published_at : null,
        }),
      });

      if (response.ok) {
        setSuccess('文章更新成功！');
        timeoutRef.current = setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        const { error } = await response.json();
        setError(error || 'Failed to update post');
      }
    } catch (err) {
      setError('Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Post, value: string | number) => {
    if (post) {
      setPost({ ...post, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <Link
            href="/admin1762096094/posts"
            className="text-blue-600 hover:text-blue-500"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin1762096094/posts"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Posts
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Post Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={post.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                  placeholder="Enter post title"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be used as both the post title and SEO title
                </p>
              </div>

              <div>
                <label htmlFor="slug" className="block text-lg font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={post.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  required
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                  placeholder="post-url-slug"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be used in the URL: /blog/{post.slug}
                </p>
              </div>

              <div>
                <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={post.category_id}
                  onChange={(e) => handleInputChange('category_id', parseInt(e.target.value))}
                  required
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="publishedAt" className="block text-lg font-medium text-gray-700 mb-2">
                  Publish Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="publishedAt"
                  value={post.published_at ? post.published_at.slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('published_at', e.target.value)}
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                />
                <p className="mt-2 text-sm text-gray-500">Leave empty to hide publish time on the page</p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="metaDescription" className="block text-lg font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="metaDescription"
                value={post.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                rows={4}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors resize-none"
                placeholder="Brief description for search engine results"
              />
              <p className="mt-2 text-sm text-gray-500">
                Recommended length: 150-160 characters
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Content</h2>
            
            <div>
              <label htmlFor="content" className="block text-lg font-medium text-gray-700 mb-2">
                Post Content *
              </label>
              <textarea
                id="content"
                value={post.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                required
                rows={30}
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono px-6 py-4 transition-colors resize-none"
                placeholder="Write your post content here. You can use HTML tags for formatting."
              />
              <p className="mt-2 text-sm text-gray-500">
                You can use HTML tags for formatting. Common tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin1762096094/posts"
              className="bg-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-400 transition-colors text-lg font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-10 py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
