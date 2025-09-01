'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { PersonalStyle, PersonalStyleFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Loading from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';

export default function PersonalStylePage() {
  const { user, profile } = useAuth();
  const { isActiveUser } = useTrial();
  const [personalStyles, setPersonalStyles] = useState<PersonalStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PersonalStyleFormData>({
    title: '',
    lyrics: '',
    music_style: '',
    language: 'English'
  });
  const [submitting, setSubmitting] = useState(false);

  // 检查用户是否为会员（包含试用期）
  const isMember = isActiveUser;

  useEffect(() => {
    if (user && isMember) {
      fetchPersonalStyles();
    } else {
      // 非会员用户也需要设置loading为false
      setLoading(false);
    }
  }, [user, isMember]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchPersonalStyles = async (nextPage = page) => {
    try {
      const response = await fetch(`/api/personal-styles?page=${nextPage}&pageSize=${pageSize}`);
      const data = await response.json();
      if (data.success) {
        setPersonalStyles(data.personalStyles || []);
        if (data.pagination) {
          setTotal(data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch personal styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isMember) return;

    setSubmitting(true);
    try {
      const url = editingId ? `/api/personal-styles/${editingId}` : '/api/personal-styles';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchPersonalStyles(1);
      } else {
        alert(data.error || 'Failed to save personal style');
      }
    } catch (error) {
      console.error('Failed to save personal style:', error);
      alert('Failed to save personal style');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (style: PersonalStyle) => {
    setFormData({
      title: style.title,
      lyrics: style.lyrics,
      music_style: style.music_style || '',
      language: style.language
    });
    setEditingId(style.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this personal style?')) return;

    try {
      const response = await fetch(`/api/personal-styles/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPersonalStyles(1);
      } else {
        alert('Failed to delete personal style');
      }
    } catch (error) {
      console.error('Failed to delete personal style:', error);
      alert('Failed to delete personal style');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      lyrics: '',
      music_style: '',
      language: 'English'
    });
  };

  const handleInputChange = (field: keyof PersonalStyleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your personal styles.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Premium Feature</h1>
          <p className="text-gray-600 mb-6">
            Personal Style Library is a premium feature. Upgrade to create and manage your own lyric styles that AI can learn from.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href="/pricing">View Pricing</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/generate">Back to Generator</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Personal Style Library', href: '/personal-style' }
          ]} 
        />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Personal Style Library
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your own lyrics to train AI with your unique writing style. 
              Create up to 5 personal styles that will influence future AI generations.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {personalStyles.length}/5
                </div>
                <div className="text-gray-600">Personal Styles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {total}
                </div>
                <div className="text-gray-600">Total Styles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {isMember ? 'Active' : 'Inactive'}
                </div>
                <div className="text-gray-600">Membership</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Personal Styles
            </h2>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Add New Style
            </Button>
          </div>

          {/* Personal Styles List */}
          {personalStyles.length === 0 ? (
            <Card>
              <CardContent className="text-center p-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Personal Styles Yet</h3>
                <p className="text-gray-500 mb-6">
                  Start building your personal style library by uploading your own lyrics.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Create Your First Style
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalStyles.map((style) => (
                <Card key={style.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {style.title}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(style)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(style.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {style.music_style || 'No style'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {style.language}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {style.lyrics}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{style.word_count} words</span>
                        <span>{new Date(style.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fetchPersonalStyles(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchPersonalStyles(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {editingId ? 'Edit Personal Style' : 'Create New Personal Style'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a descriptive title"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Music Style (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.music_style}
                      onChange={(e) => handleInputChange('music_style', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Pop, Rock, Hip Hop"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language *
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Russian">Russian</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lyrics *
                    </label>
                    <textarea
                      value={formData.lyrics}
                      onChange={(e) => handleInputChange('lyrics', e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Paste your lyrics here... (max 500 characters)"
                      maxLength={500}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.lyrics.length}/500 characters
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? 'Saving...' : (editingId ? 'Update Style' : 'Create Style')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
