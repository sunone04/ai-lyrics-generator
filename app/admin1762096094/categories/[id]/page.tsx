'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/admin-config';
import { Category } from '@/lib/types';

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    meta_description: ''
  });
  const router = useRouter();

  const fetchCategory = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setCategory(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        meta_description: data.meta_description || ''
      });
    } catch (_error: any) {
      toast.error('Failed to load category');
      router.push('/admin1762096094');
    }
  }, [router]);

  useEffect(() => {
    const initPage = async () => {
      const { id } = await params;
      setCategoryId(id);
      
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
      await fetchCategory(id);
    };

    initPage();
  }, [router, fetchCategory, params]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // 自动生成slug（但允许手动修改）
      if (field === 'name' && formData.slug === slugify(formData.name)) {
        updated.slug = slugify(value);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
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

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          meta_description: formData.meta_description || null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      // 触发相关页面重新生成
      try {
        // 重新验证旧的分类页面
        if (category?.slug !== formData.slug) {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: `/blog/category/${category?.slug}`,
              secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'dev-secret'
            }),
          });
        }

        // 重新验证新的分类页面
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: `/blog/category/${formData.slug}`,
            secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'dev-secret'
          }),
        });

        // 重新验证博客首页
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
      } catch (revalidateError) {
        console.warn('Failed to revalidate pages:', revalidateError);
      }

      toast.success('Category updated successfully');
      router.push('/admin1762096094');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

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

      toast.success('Category deleted successfully');
      router.push('/admin1762096094');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || !category) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Category</h1>
          <p className="text-gray-600">Update category information</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., Songwriting Tips"
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
                placeholder="songwriting-tips"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL: /blog/category/{formData.slug || 'category-slug'}
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description (Optional)
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Brief description for SEO and social media..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin1762096094')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                
                <LoadingButton
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Category
                </LoadingButton>
              </div>
              
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Category
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}