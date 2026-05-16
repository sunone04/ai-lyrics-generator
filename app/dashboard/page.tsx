'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useData } from '@/lib/contexts/data-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { SUBSCRIPTION_LIMITS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { TrialStatus } from '@/components/ui/trial-activation';
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
  const { user, profile, loading: authLoading } = useAuth();
  const { isActiveUser, refreshData: refreshTrialData } = useTrial();
  const { 
    generations, 
    favorites, 
    loadingGenerations, 
    loadingFavorites,
    setFavorite,
    deleteGenerationById,
    fetchGenerations,
    fetchFavorites
  } = useData();
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; generationId: number | null }>({ show: false, generationId: null });
  const [favBump, setFavBump] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handlePaymentFeedback = () => {
      const params = new URLSearchParams(window.location.search);
      const payment = params.get('payment');
      if (payment === 'success') toast.success('Payment successful. Your membership will be activated shortly.');
      if (payment === 'failed') toast.error('Payment failed or canceled. Please try again.');
    };

    if (!authLoading && user) {
      handlePaymentFeedback();
      setIsLoading(false);
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      try { fetchFavorites(false); } catch {}
    }
  }, [activeTab, fetchFavorites]);

  useEffect(() => {
    setFavBump(0);
  }, [favorites.length, profile?.favorite_count]);

  if (authLoading) {
    return <LoadingPage text="Checking authentication..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen noise-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="text-center mt-8">
            <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
            <p className="text-zinc-500 mb-6">
              View your AI lyrics generation history, manage favorites, and track your usage.
            </p>
            <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white mb-2">Login Required</h3>
              <p className="text-zinc-400 mb-4">
                Please sign in to access your dashboard and view your generation history.
              </p>
              <button
                onClick={() => router.push('/auth/signin?returnTo=/')}
                className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-500 transition-colors cursor-pointer"
              >
                Sign In to Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = async (generationId: number) => {
    if (!user) {
      toast.error('Please sign in to manage favorites');
      router.push('/auth/signin');
      return;
    }
    try {
      const currentGeneration = generations.find(gen => gen.id === generationId);
      const newFavoriteStatus = !currentGeneration?.is_favorited;
      const maxFavorites = isActiveUser ? 300 : 10;
      const currentFavCountRaw = profile?.favorite_count ?? 0;
      const currentFavCount = Math.max(0, currentFavCountRaw + favBump);
      if (newFavoriteStatus && currentFavCount >= maxFavorites) {
        toast.error("You've reached your favorites limit. Upgrade to save more.");
        router.push('/pricing');
        return;
      }
      await setFavorite(generationId, newFavoriteStatus);
      if (activeTab === 'favorites') {
        try { await fetchFavorites(true); } catch {}
      }
      setFavBump(prev => {
        const next = prev + (newFavoriteStatus ? 1 : -1);
        const bounded = Math.min(maxFavorites - currentFavCountRaw, Math.max(-currentFavCountRaw, next));
        return bounded;
      });
      toast.success('Favorite updated');
    } catch (error: any) {
      toast.error((error && error.message) || 'Failed to update favorite');
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
      await deleteGenerationById(generationId);
      toast.success('Generation deleted');
      setDeleteConfirm({ show: false, generationId: null });
    } catch (error: any) {
      toast.error((error && error.message) || 'Failed to delete generation');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, generationId: null });
  };

  const getUsageStats = () => {
    if (!profile) return { generations: 0, rewrites: 0, maxGenerations: 1, maxRewrites: 0 };
    const limits = isActiveUser ? SUBSCRIPTION_LIMITS.paid : SUBSCRIPTION_LIMITS.free;
    return {
      generations: profile.generation_count,
      rewrites: profile.rewrite_count,
      maxGenerations: limits.maxGenerations,
      maxRewrites: limits.maxLyricOptimizations
    };
  };

  if (isLoading || loadingGenerations || loadingFavorites) {
    return <LoadingPage text="Loading your dashboard..." />;
  }

  const stats = getUsageStats();
  const currentList = activeTab === 'recent' ? generations : favorites;
  const maxFavorites = isActiveUser ? 300 : 10;
  const currentFavCountBase = profile?.favorite_count ?? favorites.length;
  const currentFavCount = Math.max(0, Math.min(maxFavorites, currentFavCountBase + favBump));

  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mt-8">
          {currentFavCount >= maxFavorites && (
            <div className="mb-4 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <div className="mt-0.5 text-amber-400">&#9888;</div>
              <div>
                <p className="text-sm text-amber-400">
                  You&apos;ve reached your favorites limit ({currentFavCount}/{maxFavorites}). Remove some items or upgrade to Premium to save more.
                </p>
              </div>
              <div className="ml-auto">
                <button onClick={() => router.push('/pricing')} className="px-3 py-1.5 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-500 cursor-pointer transition-colors">Upgrade</button>
              </div>
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-lg text-zinc-500 mb-6">
              Manage your lyrics and track your creative journey
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                href="/generate"
                className="inline-flex items-center px-4 py-2 bg-violet-600/10 text-violet-400 rounded-lg hover:bg-violet-600/20 transition-colors cursor-pointer text-sm font-medium"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate Lyrics
              </Link>
              <Link
                href="/edit"
                className="inline-flex items-center px-4 py-2 bg-cyan-600/10 text-cyan-400 rounded-lg hover:bg-cyan-600/20 transition-colors cursor-pointer text-sm font-medium"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Lyrics
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center">
                <div className="bg-violet-500/10 p-2.5 rounded-lg">
                  <SparklesIcon className="h-5 w-5 text-violet-400" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-zinc-500">Today&apos;s Generations</p>
                  <p className="text-xl font-bold text-white">
                    {stats.generations}/{stats.maxGenerations}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center">
                <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-zinc-500">Today&apos;s Rewrites</p>
                  <p className="text-xl font-bold text-white">
                    {stats.rewrites}/{stats.maxRewrites}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center">
                <div className="bg-rose-500/10 p-2.5 rounded-lg">
                  <HeartIconSolid className="h-5 w-5 text-rose-400" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-zinc-500">Favorites</p>
                  <p className="text-xl font-bold text-white">{currentFavCount}/{maxFavorites}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center">
                <div className="bg-amber-500/10 p-2.5 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-zinc-500">Total Lyrics</p>
                  <p className="text-xl font-bold text-white">{generations.length}</p>
                </div>
              </div>
            </div>
          </div>

          {profile && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Subscription Status
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {isActiveUser ? 'Premium Access' : 'Free Plan'}
                    {profile.status === 'active' && ' (Paid)'}
                    {profile.status === 'free' && profile.trial_start_date && ' (Trial)'}
                  </p>
                </div>
                {!isActiveUser && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-500 transition-colors cursor-pointer text-sm font-medium"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/5">
              <nav className="flex space-x-6 px-6">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'recent'
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  Recent Lyrics ({generations.length})
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'favorites'
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  Favorites
                </button>
              </nav>
            </div>

            <div className="p-6">
              {currentList.length === 0 ? (
                <div className="text-center py-12">
                  <SparklesIcon className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {activeTab === 'recent' ? 'No lyrics yet' : 'No favorites yet'}
                  </h3>
                  <p className="text-zinc-500 mb-6">
                    {activeTab === 'recent' 
                      ? 'Start creating amazing lyrics with our AI generator'
                      : 'Favorite your best lyrics to keep them forever'
                    }
                  </p>
                  <button
                    onClick={() => router.push('/generate')}
                    className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-500 transition-colors cursor-pointer text-sm font-medium"
                  >
                    Generate Lyrics
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentList.map((generation) => (
                    <div key={generation.id} className="rounded-lg border border-white/5 bg-white/[0.01] p-4 hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-white">
                              {generation.music_style} - {generation.music_theme}
                            </span>
                            {generation.model_used === 'pro' && (
                              <span className="bg-violet-500/10 text-violet-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-600 text-xs mb-2">
                            Created {formatDate(generation.created_at)}
                          </p>
                          <p className="text-zinc-400 text-sm line-clamp-3">
                            {typeof (generation as any).generated_lyrics === 'string'
                              ? ((generation as any).generated_lyrics.slice(0, 200) + '...')
                              : ''}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            onClick={() => router.push(`/generate/result/${generation.id}`)}
                            className="p-2 text-zinc-600 hover:text-violet-400 transition-colors cursor-pointer"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleFavorite(generation.id)}
                            className="p-2 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                            title={generation.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {generation.is_favorited ? (
                              <HeartIconSolid className="h-4 w-4 text-rose-400" />
                            ) : (
                              <HeartIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(generation.id)}
                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <TrialStatus />
          </div>
        </div>
      </div>

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-xl border border-white/10 bg-zinc-900 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">
                    Delete Generation
                  </h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-zinc-400">
                  Are you sure you want to delete this generation? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-500 transition-colors cursor-pointer"
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
