'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Generation, Profile } from '@/lib/types';
import { SUBSCRIPTION_LIMITS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { 
  HeartIcon, 
  ClockIcon, 
  SparklesIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
 

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [favorites, setFavorites] = useState<Generation[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; generationId: number | null }>({ show: false, generationId: null });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setAuthLoading(false);
      if (!data.user) {
        const returnTo = encodeURIComponent('/dashboard');
        router.replace(`/auth/signin?returnTo=${returnTo}`);
      }
    };
    initAuth();
    return () => { mounted = false; };
  }, [supabase, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && !authLoading) {
          // Payment feedback via query
          const params = new URLSearchParams(window.location.search);
          const payment = params.get('payment');
          if (payment === 'success') toast.success('Payment successful. Your membership will be activated shortly.');
          if (payment === 'failed') toast.error('Payment failed or canceled. Please try again.');
          // Get user profile directly via Supabase
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (prof) setProfile(prof as any);

          // Get recent generations
          const generationsResponse = await fetch('/api/user/generations');
          if (generationsResponse.ok) {
            const generationsResult = await generationsResponse.json();
            setGenerations(generationsResult.generations || []);
          }

          // Get favorites
          const favoritesResponse = await fetch('/api/user/generations?favorites=true');
          if (favoritesResponse.ok) {
            const favoritesResult = await favoritesResponse.json();
            setFavorites(favoritesResult.generations || []);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const handleToggleFavorite = async (generationId: number) => {
    if (!user) {
      toast.error('Please sign in to manage favorites');
      router.push('/auth/signin');
      return;
    }
    
    try {
      const response = await fetch('/api/user/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update favorite');
      }
      
      // Update both lists
      const updatedGenerations = generations.map(gen => 
        gen.id === generationId ? { ...gen, is_favorited: !gen.is_favorited } : gen
      );
      setGenerations(updatedGenerations);

      // Refresh favorites list
      const favoritesResponse = await fetch('/api/user/generations?favorites=true');
      if (favoritesResponse.ok) {
        const favoritesResult = await favoritesResponse.json();
        setFavorites(favoritesResult.generations || []);
      }

      toast.success('Favorite updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorite');
    }
  };

  const handleDeleteClick = (generationId: number) => {
    if (!user) {
      toast.error('Please sign in to delete generations');
      router.push('/auth/signin');
      return;
    }
    
    setDeleteConfirm({ show: true, generationId });
  };

  const handleDeleteConfirm = async () => {
    const generationId = deleteConfirm.generationId;
    if (!generationId) return;
    
    try {
      const response = await fetch('/api/user/generations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete generation');
      }
      
      // Remove from both lists
      setGenerations(prev => prev.filter(gen => gen.id !== generationId));
      setFavorites(prev => prev.filter(gen => gen.id !== generationId));
      
      toast.success('Generation deleted');
      setDeleteConfirm({ show: false, generationId: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete generation');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, generationId: null });
  };

  const getUsageStats = () => {
    if (!profile) return { generations: 0, rewrites: 0, maxGenerations: 1, maxRewrites: 0 };
    
    const limits = profile.status === 'active' ? SUBSCRIPTION_LIMITS.paid : SUBSCRIPTION_LIMITS.free;
    return {
      generations: profile.generation_count,
      rewrites: profile.rewrite_count,
      maxGenerations: limits.maxGenerations,
      maxRewrites: limits.maxLyricOptimizations
    };
  };

  if (isLoading) {
    return <LoadingPage text="Loading your dashboard..." />;
  }

  const stats = getUsageStats();
  const currentList = activeTab === 'recent' ? generations : favorites;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Manage your lyrics and track your creative journey
            </p>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Link
                href="/generate"
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate Lyrics
              </Link>
              <Link
                href="/edit"
                className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Lyrics
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <SparklesIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today&apos;s Generations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.generations}/{stats.maxGenerations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today&apos;s Rewrites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.rewrites}/{stats.maxRewrites}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <HeartIconSolid className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorites</p>
                  <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <EyeIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Lyrics</p>
                  <p className="text-2xl font-bold text-gray-900">{generations.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          {profile && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Subscription Status
                  </h3>
                  <p className="text-gray-600">
                    {profile.status === 'active' ? 'Premium Member' : 'Free Plan'}
                  </p>
                </div>
                {profile.status !== 'active' && (
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recent'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Recent Lyrics ({generations.length})
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'favorites'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Favorites ({favorites.length})
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {currentList.length === 0 ? (
                <div className="text-center py-12">
                  <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'recent' ? 'No lyrics yet' : 'No favorites yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'recent' 
                      ? 'Start creating amazing lyrics with our AI generator'
                      : 'Favorite your best lyrics to keep them forever'
                    }
                  </p>
                  <button
                    onClick={() => router.push('/generate')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Generate Lyrics
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentList.map((generation) => (
                    <div key={generation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {generation.music_style} • {generation.music_theme}
                            </span>
                            {generation.model_used === 'pro' && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            Created {formatDate(generation.created_at)}
                          </p>
                          <p className="text-gray-800 line-clamp-3">
                            {typeof (generation as any).generated_lyrics === 'string'
                              ? ((generation as any).generated_lyrics.slice(0, 200) + '...')
                              : ''}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => router.push(`/generate/result/${generation.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleFavorite(generation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title={generation.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {generation.is_favorited ? (
                              <HeartIconSolid className="h-5 w-5 text-red-600" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(generation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Generation
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this generation? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}