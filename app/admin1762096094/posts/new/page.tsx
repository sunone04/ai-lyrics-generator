'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/admin-config';

export default function NewPostPage() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    seo_title: '',
    meta_description: '',
    category_id: '',
    status: 'draft' as 'draft' | 'published'
  });
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
      await fetchCategories();
    };

    checkAuth();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch categories');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from title
      if (field === 'title' && !prev.slug) {
        updated.slug = slugify(value);
      }
      
      // Auto-generate SEO title from title
      if (field === 'title' && !prev.seo_title) {
        updated.seo_title = value;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category_id) {
      console.log('Validation failed:', { title: formData.title, content: formData.content, category_id: formData.category_id });
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Get user session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const slug = formData.slug || slugify(formData.title);
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          slug,
          seo_title: formData.seo_title || formData.title,
          meta_description: formData.meta_description,
          category_id: parseInt(formData.category_id),
          status: formData.status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create post');
      }

      // 如果文章已发布，触发静态页面重新生成
      if (formData.status === 'published') {
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: '/blog',
              secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'dev-secret'
            }),
          });

          // 重新验证新文章页面
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: `/blog/${slug}`,
              secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'dev-secret'
            }),
          });
        } catch (revalidateError) {
          console.warn('Failed to revalidate pages:', revalidateError);
          // 不阻止文章创建，只是记录警告
        }
      }

      toast.success('Post created successfully');
      router.push('/admin1762096094');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">Write and publish a new blog post</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Enter post title"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="url-friendly-slug"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL: /blog/{formData.slug || 'your-slug'}
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="Write your post content here... Use the toolbar buttons for formatting."
                rows={15}
              />
            </div>

            {/* SEO Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => handleInputChange('seo_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="SEO optimized title (defaults to post title)"
                maxLength={60}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.seo_title.length}/60 characters (recommended: 50-60)
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Brief description for search engines and social media"
                maxLength={160}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.meta_description.length}/160 characters (recommended: 150-160)
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push('/admin1762096094')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              
              <div className="space-x-3">
                <LoadingButton
                  type="button"
                  isLoading={isLoading}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, status: 'draft' }));
                    handleSubmit(new Event('submit') as any);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Save as Draft
                </LoadingButton>
                
                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Publish
                </LoadingButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}