'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { Generation, Profile } from '@/lib/types';
import { downloadTextFile } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { 
  DocumentArrowDownIcon, 
  ClipboardDocumentIcon, 
  HeartIcon,
  ArrowPathIcon,
  PencilIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ResultPage() {
  return <GenerationResultContent />;
}

function GenerationResultContent() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteRequest, setRewriteRequest] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  const generationId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Get generation
        let generationData, genError;
        if (user) {
          // If user is logged in, get their generation
          const result = await supabase
            .from('generations')
            .select('*')
            .eq('id', generationId)
            .eq('user_id', user.id)
            .single();
          generationData = result.data;
          genError = result.error;
        } else {
          // If no user, try to get public generation (for SEO)
          const result = await supabase
            .from('generations')
            .select('*')
            .eq('id', generationId)
            .single();
          generationData = result.data;
          genError = result.error;
        }

        if (genError || !generationData) {
          toast.error('Generation not found');
          router.push('/dashboard');
          return;
        }

        setGeneration(generationData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load generation');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [generationId, router, user, authLoading]);

  const handleCopy = async () => {
    if (!generation) return;
    
    try {
      await copyToClipboard(generation.generated_lyrics);
      toast.success('Lyrics copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy lyrics');
    }
  };

  const handleDownload = () => {
    if (!generation) return;
    
    const filename = `lyrics-${new Date().toISOString().split('T')[0]}.txt`;
    downloadTextFile(generation.generated_lyrics, filename);
    toast.success('Lyrics downloaded!');
  };

  const handleToggleFavorite = async () => {
    if (!generation || !user) return;
    
    setIsToggling(true);
    try {
      const newFavoriteStatus = !generation.is_favorited;
      
      const response = await fetch('/api/user/generations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          generationId: generation.id,
          isFavorited: newFavoriteStatus
        })
      });
      
      if (response.ok) {
        setGeneration(prev => prev ? { ...prev, is_favorited: newFavoriteStatus } : null);
        toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      } else {
        throw new Error('Failed to toggle favorite');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorite');
    } finally {
      setIsToggling(false);
    }
  };

  const handleRegenerate = () => {
    // Navigate back to generate page with parameters
    const searchParams = new URLSearchParams({
      language: generation?.language || '',
      musicStyle: generation?.music_style || '',
      musicTheme: generation?.music_theme || '',
      lengthOption: generation?.length_option || '',
      lyricStyle: generation?.lyric_style || '',
      intentOrRequest: generation?.intent_or_request || '',
      artistStyle: generation?.artist_style || '',
      emotionIntensity: generation?.emotion_intensity?.toString() || '50',
      rhymeRequirement: generation?.rhyme_requirement || '',
      songStructure: generation?.song_structure || '',
      paragraphLength: generation?.paragraph_length || '',
      bpm: generation?.bpm?.toString() || '120',
      useBpm: generation?.bpm ? 'true' : 'false',
      melody: generation?.melody || '',
      syllablePattern: generation?.syllable_pattern || '',
      modelType: generation?.model_used || 'basic'
    });
    
    router.push(`/generate?${searchParams.toString()}`);
  };

  const handleStartEdit = () => {
    if (generation) {
      setEditedLyrics(generation.generated_lyrics);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedLyrics('');
  };

  const handleSaveEdit = async () => {
    if (!generation || !user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/generations/${generation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generated_lyrics: editedLyrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const updatedGeneration = await response.json();
      setGeneration(updatedGeneration);
      setIsEditing(false);
      toast.success('Lyrics updated successfully!');
    } catch (error) {
      console.error('Error saving lyrics:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelection = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selected = selection.toString().trim();
      if (selected.length > 10) { // Minimum selection length
        setSelectedText(selected);
        
        // Get selection position for button placement
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + window.scrollY + 10
        });
        setShowRewriteButton(true);
        // Keep the selection active even if mouse moves slightly away
        event.preventDefault();
        event.stopPropagation();
      } else {
        setShowRewriteButton(false);
        setSelectionPosition(null);
      }
    } else {
      // Do not immediately clear selection on tiny mouse move; require outside click (handled elsewhere)
      // Keep current selection so user has time to click the floating button
    }
  };

  const handleRewriteButtonClick = () => {
    setShowRewriteButton(false);
    setSelectionPosition(null);
    setShowRewriteModal(true);
    // Keep selectedText for the modal
  };

  const handleClearSelection = () => {
    setShowRewriteButton(false);
    setSelectionPosition(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const handleCloseRewriteModal = () => {
    setShowRewriteModal(false);
    setRewriteRequest('');
    // Keep selectedText and don't clear selection until user clicks outside
  };

  const handleRewrite = async () => {
    if (!generation || !user || !selectedText || !rewriteRequest.trim()) return;

    setIsRewriting(true);
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalLyrics: generation.generated_lyrics,
          selectedPortion: selectedText,
          rewriteRequest: rewriteRequest,
          modelType: generation.model_used || 'basic'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite lyrics');
      }

      const { rewrittenPortion } = await response.json();
      
      // Replace the selected text with the rewritten version
      const updatedLyrics = generation.generated_lyrics.replace(selectedText, rewrittenPortion);
      
      // Update the generation in the database
      const updateResponse = await fetch(`/api/generations/${generation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generated_lyrics: updatedLyrics,
        }),
      });

      if (updateResponse.ok) {
        const updatedGeneration = await updateResponse.json();
        setGeneration(updatedGeneration);
        toast.success('Lyrics rewritten successfully!');
      }

      setShowRewriteModal(false);
      setSelectedText('');
      setRewriteRequest('');
      setShowRewriteButton(false);
      setSelectionPosition(null);
    } catch (error) {
      console.error('Error rewriting lyrics:', error);
      toast.error('Failed to rewrite lyrics');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Audio file must be less than 10MB');
        return;
      }
      
      setAudioFile(file);
      
      // Create URL for preview
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newAudioUrl = URL.createObjectURL(file);
      setAudioUrl(newAudioUrl);
      
      toast.success('Audio uploaded successfully!');
    }
  };

  const handleRemoveAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Clear selection when clicking outside (but not when modal is open or immediately after making a selection)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't clear selection if rewrite modal is open
      if (showRewriteModal) return;
      
      const target = event.target as Element;
      // If a selection is present and rewrite button is visible, keep it even if mouseup occurred slightly outside
      if (selectedText && showRewriteButton) return;

      if (!target.closest('.lyrics-container') && !target.closest('.rewrite-button')) {
        handleClearSelection();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showRewriteModal, selectedText, showRewriteButton]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/generate/result/${generationId}`;
    const shareText = `Check out these amazing AI-generated lyrics! 🎵\n\n"${generation?.generated_lyrics?.substring(0, 100)}..."\n\nGenerated with AI Lyrics Generator`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Lyrics',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const canEdit = profile?.status === 'active';
  const canUseProModel = profile?.status === 'active';

  if (isLoading) {
    return <LoadingPage text="Loading your lyrics..." />;
  }

  if (!generation) {
    return <div>Generation not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Generated Lyrics
            </h1>
            <p className="text-lg text-gray-600">
              Created on {new Date(generation.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Lyrics Display */}
          <div className="bg-white shadow rounded-lg p-6 md:p-8 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Generated Lyrics</h2>
              {user && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-base text-black leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Edit your lyrics here..."
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || editedLyrics.trim() === ''}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    ✨ AI Rewrite Feature
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    Select any part of the lyrics below and click the "Rewrite Selected" button that appears. 
                    Perfect for improving specific verses, chorus, or lines!
                  </p>
                  <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                    ⚠️ Warning: Selected lyrics will be replaced with new AI-generated content. 
                    We recommend downloading your lyrics first as backup.
                  </p>
                </div>
                <div className="lyrics-container relative" onMouseUp={handleTextSelection}>
                  <pre 
                    className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed cursor-text select-text p-2"
                    style={{ userSelect: 'text' }}
                  >
                    {generation.generated_lyrics}
                  </pre>
                  
                  {/* Floating Rewrite Button */}
                  {showRewriteButton && selectionPosition && (
                    <button
                      onClick={handleRewriteButtonClick}
                      className="rewrite-button fixed z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                      style={{
                        left: `${selectionPosition.x}px`,
                        top: `${selectionPosition.y}px`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Rewrite Selected</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Audio Upload Section (Premium Feature) */}
          {user && profile?.status === 'active' && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Audio Preview</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Premium Feature
                </span>
              </div>
              
              {!audioFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <label htmlFor="audio-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">Upload an audio file</span>
                        <span> to preview with your lyrics</span>
                      </label>
                      <input
                        id="audio-upload"
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500">MP3, WAV, M4A up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{audioFile.name}</p>
                        <p className="text-xs text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveAudio}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {audioUrl && (
                    <audio controls className="w-full">
                      <source src={audioUrl} />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4 justify-center text-base">
              <button
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                Copy
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download
              </button>

              <button
                onClick={handleToggleFavorite}
                disabled={isToggling}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  generation.is_favorited
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {generation.is_favorited ? (
                  <HeartIconSolid className="h-5 w-5 mr-2" />
                ) : (
                  <HeartIcon className="h-5 w-5 mr-2" />
                )}
                {generation.is_favorited ? 'Favorited' : 'Favorite'}
              </button>

              <button
                onClick={handleRegenerate}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Regenerate
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>

              {canEdit && (
                <button
                  onClick={() => router.push(`/edit/${generation.id}`)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Generation Parameters */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Generation Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Language:</span> 
                <span className="ml-2">{generation.language}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Music Style:</span> 
                <span className="ml-2">{generation.music_style}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Theme:</span> 
                <span className="ml-2">{generation.music_theme}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Length:</span> 
                <span className="ml-2">{generation.length_option}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Lyric Style:</span> 
                <span className="ml-2">{generation.lyric_style}</span>
              </div>
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Song Structure:</span> 
                <span className="ml-2">{generation.song_structure}</span>
              </div>
              {generation.artist_style && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">Artist Style:</span> 
                  <span className="ml-2">{generation.artist_style}</span>
                </div>
              )}
              {generation.emotion_intensity && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">Emotion Intensity:</span> 
                  <span className="ml-2">{generation.emotion_intensity}/100</span>
                </div>
              )}
              {generation.rhyme_requirement && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">Rhyme Requirement:</span> 
                  <span className="ml-2">{generation.rhyme_requirement}</span>
                </div>
              )}
              {generation.bpm && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">BPM:</span> 
                  <span className="ml-2">{generation.bpm}</span>
                </div>
              )}
              {generation.melody && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">Melody:</span> 
                  <span className="ml-2">{generation.melody}</span>
                </div>
              )}
              {generation.syllable_pattern && (
                <div className="text-gray-900">
                  <span className="font-semibold text-gray-700">Syllable Pattern:</span> 
                  <span className="ml-2">{generation.syllable_pattern}</span>
                </div>
              )}
              <div className="text-gray-900">
                <span className="font-semibold text-gray-700">Model Used:</span> 
                <span className="ml-2">{generation.model_used === 'pro' ? 'Pro Model' : 'Basic Model'}</span>
              </div>
              {generation.intent_or_request && (
                <div className="md:col-span-2 text-gray-900">
                  <span className="font-semibold text-gray-700">Additional Requirements:</span> 
                  <span className="ml-2">{generation.intent_or_request}</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700 font-semibold">
              🔒 Based on privacy protection, your lyrics will be stored for a maximum of 24 hours. 
              Please download or favorite them in time.
            </p>
          </div>
        </div>
      </div>

      {/* Rewrite Modal */}
      {showRewriteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Rewrite Selected Lyrics
              </h3>
              <p className="text-sm text-gray-600">
                Tell AI how you want to improve the selected text
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Text:
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-900">
                  {selectedText}
                </pre>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you like to rewrite this? *
              </label>
              <textarea
                value={rewriteRequest}
                onChange={(e) => setRewriteRequest(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg text-black resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Make it more emotional, change the rhyme scheme, use different metaphors..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseRewriteModal}
                disabled={isRewriting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRewrite}
                disabled={isRewriting || !rewriteRequest.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isRewriting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rewriting...
                  </>
                ) : (
                  'Rewrite with AI'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                <ShareIcon className="h-6 w-6 text-indigo-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Share Your Lyrics
              </h3>
              
              <p className="text-gray-600 mb-4">
                Share these amazing AI-generated lyrics with others!
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/generate/result/${generationId}`;
                    copyToClipboard(shareUrl);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Link
                </button>
                
                <button
                  onClick={() => {
                    const shareText = `Check out these amazing AI-generated lyrics! 🎵\n\n"${generation?.generated_lyrics?.substring(0, 100)}..."\n\nGenerated with AI Lyrics Generator: ${window.location.origin}/generate/result/${generationId}`;
                    copyToClipboard(shareText);
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy Lyrics + Link
                </button>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}