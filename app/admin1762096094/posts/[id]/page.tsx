'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { Category, Post } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { LoadingButton } from '@/components/ui/loading';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/admin-config';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postId, setPostId] = useState<string>('');
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

  const fetchPost = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPost(data);
      setFormData({
        title: data.title || '',
        content: data.content || '',
        slug: data.slug || '',
        seo_title: data.seo_title || '',
        meta_description: data.meta_description || '',
        category_id: data.category_id?.toString() || '',
        status: data.status || 'draft'
      });
    } catch (_error: any) {
      toast.error('Failed to load post');
      router.push('/admin1762096094');
    }
  }, [router]);

  const fetchCategories = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (_error: any) {
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    const initPage = async () => {
      const { id } = await params;
      setPostId(id);
      
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
      await Promise.all([fetchPost(id), fetchCategories()]);
    };

    initPage();
  }, [router, fetchPost, fetchCategories, params]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // 自动生成slug
      if (field === 'title') {
        updated.slug = slugify(value);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.slug || !formData.category_id) {
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

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          slug: formData.slug,
          seo_title: formData.seo_title || formData.title,
          meta_description: formData.meta_description,
          category_id: parseInt(formData.category_id),
          status: formData.status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update post');
      }

      // 触发相关页面重新生成
      try {
        // 重新验证旧的文章页面
        if (post?.slug !== formData.slug) {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: `/blog/${post?.slug}`,
              secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'dev-secret'
            }),
          });
        }

        // 重新验证新的文章页面
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: `/blog/${formData.slug}`,
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
        console.error('Revalidation error:', revalidateError);
      }

      toast.success('Post updated successfully');
      router.push('/admin1762096094');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
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

      toast.success('Post deleted successfully');
      router.push('/admin1762096094');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || !post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
          <p className="text-gray-600">Update post information and content</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., How to Write Amazing Song Lyrics"
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
                placeholder="how-to-write-amazing-song-lyrics"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL: /blog/{formData.slug || 'post-slug'}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                placeholder="Brief description for SEO and social media..."
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
                onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
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
                  type="button"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Post
                </LoadingButton>
              </div>
              
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Post
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}