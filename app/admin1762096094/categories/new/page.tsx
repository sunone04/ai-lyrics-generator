'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCategoryPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

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

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [name, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          seo_title: name, // 使用名称作为SEO标题
          meta_description: metaDescription,
        }),
      });

      if (response.ok) {
        setSuccess('分类创建成功！正在跳转...');
        setTimeout(() => {
          router.push('/admin1762096094/categories');
        }, 1500);
      } else {
        const { error } = await response.json();
        setError(error || 'Failed to create category');
      }
    } catch (err) {
      setError('Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin1762096094/categories"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Categories
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create New Category</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                  placeholder="Enter category title"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be used as both the category name and SEO title
                </p>
              </div>

              <div>
                <label htmlFor="slug" className="block text-lg font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors"
                  placeholder="category-url-slug"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be used in the URL: /blog/category/{slug}
                </p>
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-lg font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={5}
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg px-6 py-4 transition-colors resize-none"
                  placeholder="Brief description for search engine results"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Recommended length: 150-160 characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin1762096094/categories"
              className="bg-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-400 transition-colors text-lg font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-10 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg"
            >
              {isLoading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
