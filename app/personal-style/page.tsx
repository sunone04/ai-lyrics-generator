'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { PersonalStyle, PersonalStyleFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Loading from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';

export default function PersonalStylePage() {
  const { user, profile } = useAuth();
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

  // 检查用户是否为会员
  const isMember = profile?.status === 'active';

  useEffect(() => {
    if (user && isMember) {
      fetchPersonalStyles();
    } else {
      // 非会员用户也需要设置loading为false
      setLoading(false);
    }
  }, [user, isMember]);

  const fetchPersonalStyles = async () => {
    try {
      const response = await fetch('/api/personal-styles');
      const data = await response.json();
      if (data.success) {
        setPersonalStyles(data.personalStyles || []);
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
        fetchPersonalStyles();
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

      const data = await response.json();
      if (data.success) {
        fetchPersonalStyles();
      } else {
        alert(data.error || 'Failed to delete personal style');
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
    setEditingId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // 渲染页面头部和功能介绍
  const renderHeader = () => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">Personal Style Library</h1>
      
      {/* 功能介绍 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">🎵 Transform Your Lyrics into AI Training Data</h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The Personal Style Library allows you to upload your own original lyrics as sample examples for AI training. 
          This enables our AI to learn from your unique writing style, vocabulary preferences, and creative approach, 
          resulting in high-quality lyrics that match your personal artistic voice.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-2">✨ How It Works</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Upload up to 5 of your original lyrics</li>
              <li>• Each lyric can be up to 500 words</li>
              <li>• AI learns your style and vocabulary</li>
              <li>• Generate lyrics that match your voice</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-2">🎯 Perfect For</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Songwriters with unique styles</li>
              <li>• Artists wanting consistent voice</li>
              <li>• Musicians with specific themes</li>
              <li>• Anyone seeking personalized AI</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Pro Tip</h3>
          <p className="text-blue-700 text-sm">
            Upload diverse lyrics across different themes and emotions to give AI a comprehensive understanding of your style. 
            The more variety you provide, the better the AI can adapt to different creative contexts.
          </p>
        </div>
      </div>
    </div>
  );

  // 非登录用户显示
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        {renderHeader()}
        
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Ready to Create Your Personal AI Style?</h3>
            <p className="text-blue-700 mb-6 leading-relaxed">
              Sign in to start uploading your original lyrics and train our AI to understand your unique creative voice. 
              Your personal style library will help generate lyrics that truly reflect your artistic identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <a href="/auth/signin">Sign In to Get Started</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/pricing">View Premium Plans</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 非会员用户显示
  if (!isMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        {renderHeader()}
        
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-purple-800 mb-4">Unlock Your Personal Style Library</h3>
            <p className="text-purple-700 mb-6 leading-relaxed">
              Personal Style Library is a premium feature that allows you to train our AI with your own lyrics. 
              Upgrade to premium to upload up to 5 of your original songs and create truly personalized AI-generated lyrics.
            </p>
            <div className="bg-white p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Premium Benefits:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Upload up to 5 personal lyrics</li>
                <li>✓ AI learns your unique style</li>
                <li>✓ Generate personalized lyrics</li>
                <li>✓ Unlimited generations</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <a href="/pricing">Upgrade to Premium</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      {renderHeader()}

      {/* Upload Button */}
      {personalStyles.length < 5 && !showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>
            Upload New Style
          </Button>
        </div>
      )}

      {/* Upload/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Personal Style' : 'Upload New Personal Style'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter song title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Music Style
                </label>
                <input
                  type="text"
                  value={formData.music_style}
                  onChange={(e) => setFormData({ ...formData, music_style: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Hip Hop, Pop, Rock"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Language *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Russian">Russian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Lyrics *
                </label>
                                 <textarea
                   required
                   maxLength={500}
                   rows={8}
                   value={formData.lyrics}
                   onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter your lyrics here (max 500 words)"
                 />
                 <div className="text-sm text-sm text-gray-500 mt-1">
                   {formData.lyrics.split(/\s+/).filter(word => word.length > 0).length} / 500 words
                 </div>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Update' : 'Upload')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Personal Styles List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Your Personal Styles ({personalStyles.length}/5)
        </h2>
        
        {personalStyles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No personal styles uploaded yet. Start by uploading your first style!
            </CardContent>
          </Card>
        ) : (
          personalStyles.map((style) => (
            <Card key={style.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{style.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      {style.music_style && (
                        <Badge variant="secondary">{style.music_style}</Badge>
                      )}
                      <Badge variant="outline">{style.language}</Badge>
                      <span className="text-sm text-gray-500">
                        {style.word_count} words
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(style)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(style.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {style.lyrics}
                  </pre>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(style.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
