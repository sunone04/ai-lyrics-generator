'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FORM_OPTIONS } from '@/lib/constants';
import { LyricsGenerationParams } from '@/lib/types';
import { LoadingButton } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { SparklesIcon, LanguageIcon, PencilIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 独立的组件来处理 useSearchParams
function GenerateContent() {
  const searchParams = useSearchParams();
  
  return <GenerateForm searchParams={searchParams} />;
}

// 主要的生成表单组件
function GenerateForm({ searchParams }: { searchParams: URLSearchParams }) {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveLyrics, setLiveLyrics] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeData, setUpgradeData] = useState<any>(null);
  const [params, setParams] = useState<LyricsGenerationParams>({
    language: 'English',
    musicStyle: 'Pop',
    musicTheme: 'Love & Romance',
    lengthOption: 'Medium (2-3 verses + chorus)',
    lyricStyle: 'Conversational',
    intentOrRequest: '',
    artistStyle: '',
    emotionIntensity: 50,
    rhymeRequirement: 'Perfect rhymes',
    songStructure: 'Verse-Chorus',
    paragraphLength: '',
    bpm: 120,
    useBpm: false,
    melody: '',
    syllablePattern: '',
    modelType: 'basic'
  });
  
  // Custom input states for "Other" options
  const [customInputs, setCustomInputs] = useState({
    language: '',
    musicStyle: '',
    musicTheme: '',
    lengthOption: '',
    lyricStyle: '',
    rhymeRequirement: '',
    songStructure: ''
  });
  
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Simple arrow animation handlers
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Force reset all arrows to default state on mount
    const resetAllArrows = () => {
      form.querySelectorAll('.custom-select').forEach(select => {
        select.classList.remove('open');
      });
    };

    const handleSelectFocus = (e: Event) => {
      const select = e.target as HTMLSelectElement;
      const customSelect = select.closest('.custom-select');
      if (customSelect) {
        // Close ALL dropdowns first
        resetAllArrows();
        // Then open this one
        customSelect.classList.add('open');
      }
    };

    const handleSelectBlur = (e: Event) => {
      const select = e.target as HTMLSelectElement;
      const customSelect = select.closest('.custom-select');
      if (customSelect) {
        // Small delay to allow selection to complete
        setTimeout(() => {
          customSelect.classList.remove('open');
        }, 150);
      }
    };

    const handleSelectChange = (e: Event) => {
      const select = e.target as HTMLSelectElement;
      const customSelect = select.closest('.custom-select');
      if (customSelect) {
        customSelect.classList.remove('open');
      }
    };

    // Initial cleanup
    resetAllArrows();

    // Add event listeners to all selects
    const selects = form.querySelectorAll('.custom-select select');
    selects.forEach(select => {
      select.addEventListener('focus', handleSelectFocus);
      select.addEventListener('blur', handleSelectBlur);
      select.addEventListener('change', handleSelectChange);
    });

    return () => {
      selects.forEach(select => {
        select.removeEventListener('focus', handleSelectFocus);
        select.removeEventListener('blur', handleSelectBlur);
        select.removeEventListener('change', handleSelectChange);
      });
    };
  }, []);

  // Load parameters from URL if present (for regeneration)
  useEffect(() => {
    if (searchParams) {
      const urlParams: Partial<LyricsGenerationParams> = {};
      
      // Parse all possible parameters from URL
      const paramKeys = [
        'language', 'musicStyle', 'musicTheme', 'lengthOption', 
        'lyricStyle', 'intentOrRequest', 'artistStyle', 'emotionIntensity',
        'rhymeRequirement', 'songStructure', 'paragraphLength', 'bpm', 'modelType',
        'useBpm', 'melody', 'syllablePattern'
      ];
      
      paramKeys.forEach(key => {
        const value = searchParams.get(key);
        if (value) {
          // Handle type conversion for specific fields
          if (key === 'emotionIntensity' || key === 'bpm') {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              (urlParams as any)[key] = numValue;
            }
          } else if (key === 'useBpm') {
            (urlParams as any)[key] = value === 'true';
          } else {
            (urlParams as any)[key] = value;
          }
        }
      });
      
      // Update params if any URL parameters were found
      if (Object.keys(urlParams).length > 0) {
        setParams(prev => ({ ...prev, ...urlParams }));
      }
    }
  }, [searchParams]);

  const handleInputChange = useCallback((field: keyof LyricsGenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleCustomInputChange = useCallback((field: string, value: string) => {
    setCustomInputs(prev => ({ ...prev, [field]: value }));
    // Don't update params here - keep it as "Other" to maintain the input field visibility
  }, []);

  const showUpgradeModal = (data: any) => {
    setUpgradeData(data);
    setShowUpgrade(true);
  };

  const handleUpgrade = () => {
            router.push('/auth/signin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Save current form state before redirecting to login
      const formState = {
        params,
        customInputs,
        timestamp: Date.now()
      };
      localStorage.setItem('generate_form_state', JSON.stringify(formState));
      
      toast.error('Please sign in to generate lyrics');
      router.push('/auth/signin?returnTo=' + encodeURIComponent('/generate'));
      return;
    }

    try {
      // Prepare params for submission, replacing "Other" values with custom inputs
      const submissionParams = { ...params };
      
      // Replace "Other" values with actual custom inputs and validate
      Object.keys(customInputs).forEach(key => {
        if (params[key as keyof LyricsGenerationParams] === 'Other') {
          const customValue = customInputs[key as keyof typeof customInputs];
          if (!customValue || !customValue.trim()) {
            throw new Error(`Please enter a custom ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          }
          (submissionParams as any)[key] = customValue.trim();
        }
      });

      // Redirect to live result page to handle streaming UI via SSE
      const search = new URLSearchParams();
      (Object.keys(submissionParams) as (keyof LyricsGenerationParams)[]).forEach((key) => {
        const value = (submissionParams as any)[key];
        if (value !== undefined && value !== null && value !== '') search.set(String(key), String(value));
      });
      router.push(`/generate/result/live?${search.toString()}`);
      return;
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate lyrics');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 relative">
      {/* Loading Overlay */}
      {(isLoading || isStreaming) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Creating Your Lyrics</h3>
            <p className="text-gray-600 mb-4">{loadingStep || 'Processing your request...'}</p>
            {isStreaming && (
              <div className="mt-4 max-h-64 overflow-auto text-left bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm whitespace-pre-wrap">
                {liveLyrics || 'Waiting for AI to respond...'}
              </div>
            )}
            <div className="flex justify-center space-x-1 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-gray-500">Please wait while our AI crafts your lyrics...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI Lyrics Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Generate Professional Lyrics
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
              Create original, high-quality lyrics with our advanced AI lyrics generator. 
              Set your preferences below and let our AI craft the perfect lyrics for your music.
            </p>

          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 md:p-10 border border-white/20">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              {/* Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="flex items-center text-base font-semibold text-gray-800 mb-3">
                    <LanguageIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Language *
                  </label>
                  <div className="custom-select">
                    <select
                      value={params.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  {params.language === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom language..."
                      value={customInputs.language}
                      onChange={(e) => handleCustomInputChange('language', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>

                {/* Music Style */}
                <div className="space-y-2">
                  <label className="flex items-center text-base font-semibold text-gray-800 mb-3">
                    <SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />
                    Music Style *
                  </label>
                  <div className="custom-select">
                    <select
                      value={params.musicStyle}
                      onChange={(e) => handleInputChange('musicStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.musicStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  {params.musicStyle === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom music style..."
                      value={customInputs.musicStyle}
                      onChange={(e) => handleCustomInputChange('musicStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Music Theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Music Theme *
                  </label>
                  <div className="custom-select">
                    <select
                      name="musicTheme"
                      value={params.musicTheme}
                      onChange={(e) => handleInputChange('musicTheme', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.musicThemes.map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                      ))}
                    </select>
                  </div>
                  {params.musicTheme === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom theme..."
                      value={customInputs.musicTheme}
                      onChange={(e) => handleCustomInputChange('musicTheme', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Length *
                  </label>
                  <div className="custom-select">
                    <select
                      value={params.lengthOption}
                      onChange={(e) => handleInputChange('lengthOption', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.lengthOptions.map(length => (
                        <option key={length} value={length}>{length}</option>
                      ))}
                    </select>
                  </div>
                  {params.lengthOption === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom length..."
                      value={customInputs.lengthOption || ''}
                      onChange={(e) => handleCustomInputChange('lengthOption', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Lyric Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Lyric Style *
                  </label>
                  <div className="custom-select">
                    <select
                      name="lyricStyle"
                      value={params.lyricStyle}
                      onChange={(e) => handleInputChange('lyricStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.lyricStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  {params.lyricStyle === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom lyric style..."
                      value={customInputs.lyricStyle}
                      onChange={(e) => handleCustomInputChange('lyricStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>

                {/* Song Structure */}
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Song Structure *
                  </label>
                  <div className="custom-select">
                    <select
                      value={params.songStructure}
                      onChange={(e) => handleInputChange('songStructure', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {FORM_OPTIONS.songStructures.map(structure => (
                        <option key={structure} value={structure}>{structure}</option>
                      ))}
                    </select>
                  </div>
                  {params.songStructure === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom song structure..."
                      value={customInputs.songStructure}
                      onChange={(e) => handleCustomInputChange('songStructure', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Artist Style */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Reference Artist Style (Optional)
                </label>
                <input
                  type="text"
                  value={params.artistStyle}
                  onChange={(e) => handleInputChange('artistStyle', e.target.value)}
                  className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                  placeholder="e.g., Taylor Swift, Drake, Ed Sheeran"
                />
              </div>

              {/* Emotion Intensity */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Emotion Intensity: {params.emotionIntensity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={params.emotionIntensity}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    handleInputChange('emotionIntensity', newValue);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${params.emotionIntensity}%, #e5e7eb ${params.emotionIntensity}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle (1)</span>
                  <span>Intense (100)</span>
                </div>
              </div>

              {/* Rhyme Requirement */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Rhyme Requirements
                </label>
                <div className="custom-select">
                  <select
                    value={params.rhymeRequirement}
                    onChange={(e) => handleInputChange('rhymeRequirement', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                  >
                    {FORM_OPTIONS.rhymeRequirements.map(req => (
                      <option key={req} value={req}>{req}</option>
                    ))}
                  </select>
                </div>
                {params.rhymeRequirement === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom rhyme requirement..."
                    value={customInputs.rhymeRequirement}
                    onChange={(e) => handleCustomInputChange('rhymeRequirement', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                    maxLength={50}
                    required
                  />
                )}
              </div>

              {/* BPM and Melody */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    BPM (Optional)
                  </label>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="useBpm"
                      checked={params.useBpm}
                      onChange={(e) => handleInputChange('useBpm', e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useBpm" className="text-sm text-gray-600">
                      生效
                    </label>
                  </div>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={params.bpm}
                    onChange={(e) => handleInputChange('bpm', parseInt(e.target.value) || 120)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    placeholder="120"
                  />
                </div>

                {/* Melody */}
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Melody (Optional)
                  </label>
                  <input
                    type="text"
                    value={params.melody}
                    onChange={(e) => handleInputChange('melody', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                    placeholder="例如主歌轻快、缓缓升高，在副歌达到高潮..."
                  />
                </div>
              </div>

              {/* Syllable Pattern */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Syllable Pattern (Optional)
                </label>
                <input
                  type="text"
                  value={params.syllablePattern}
                  onChange={(e) => handleInputChange('syllablePattern', e.target.value)}
                  className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                  placeholder="例如：8-8-6-8 或 主歌每句8个字，副歌每句6个字"
                />
              </div>

              {/* Model Type */}
              <div>
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Model Type
                  </label>
                  <div className="custom-select">
                    <select
                      value={params.modelType}
                      onChange={(e) => handleInputChange('modelType', e.target.value as 'basic' | 'pro')}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    >
                      <option value="basic">Basic Model (Free)</option>
                      <option value="pro">Pro Model (Premium)</option>
                    </select>
                  </div>
                </div>
                {params.modelType === 'pro' && (
                  <p className="text-sm text-amber-600 mt-1">
                    Pro model requires a premium subscription
                  </p>
                )}
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  value={params.intentOrRequest}
                  onChange={(e) => handleInputChange('intentOrRequest', e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                  placeholder="Any specific requirements, mood, or creative direction..."
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {params.intentOrRequest.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-8">
                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-5 px-8 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 font-semibold text-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{loadingStep || 'Generating...'}</span>
                    </div>
                  ) : (
                    '🎵 Generate Lyrics'
                  )}
                </LoadingButton>
                
                {/* Loading Progress Indicator */}
                {isLoading && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>AI is crafting your lyrics...</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This usually takes 10-30 seconds</p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              🔒 Based on privacy protection, your lyrics will be stored for a maximum of 24 hours. 
              Please download or favorite them in time.
            </p>
          </div>
          
          {/* Navigation Links - Moved to bottom */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/edit"
                className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Lyrics
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && upgradeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <SparklesIcon className="h-6 w-6 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Daily Limit Reached
              </h3>
              
              <p className="text-gray-600 mb-4">
                {upgradeData.message}
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {upgradeData.upgradeMessage}
                </p>
                <div className="text-xs text-gray-600">
                  • Unlimited daily generations
                  • Advanced AI models
                  • Priority support
                  • Export to multiple formats
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 主导出组件，用 Suspense 包裹 useSearchParams
export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}