'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { LoadingButton } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { 
  DocumentArrowUpIcon, 
  ClipboardDocumentIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  PencilIcon,
  ClockIcon,
  StarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LyricsGenerationParams {
  language: string;
  musicStyle: string;
  musicTheme: string;
  lengthOption: string;
  lyricStyle: string;
  intentOrRequest: string;
  artistStyle: string;
  emotionIntensity: number;
  rhymeRequirement: string;
  songStructure: string;
  paragraphLength: string;
  bpm: number;
  useBpm: boolean;
  melody: string;
  syllablePattern: string;
  modelType: 'basic' | 'pro';
  personalStyleId?: number; // 新增：个人风格ID
}

// 独立的组件来处理 useSearchParams
function GenerateContent() {
  const searchParams = useSearchParams();
  
  return <GenerateForm searchParams={searchParams} />;
}

// 主要的生成表单组件
function GenerateForm({ searchParams }: { searchParams: URLSearchParams }) {
  const { user, profile, loading: authLoading } = useAuth();
  const { isActiveUser } = useTrial();
  const [formData, setFormData] = useState<LyricsGenerationParams>({
    language: 'English',
    musicStyle: 'Pop',
    musicTheme: 'Love',
    lengthOption: 'Short',
    lyricStyle: 'Modern',
    intentOrRequest: '',
    artistStyle: '',
    emotionIntensity: 50,
    rhymeRequirement: 'Standard',
    songStructure: 'Verse-Chorus',
    paragraphLength: 'Standard',
    bpm: 120,
    useBpm: false,
    melody: '',
    syllablePattern: '',
    modelType: 'basic',
    personalStyleId: undefined
  });
  
  // Custom input states for "Other" options
  const [customInputs, setCustomInputs] = useState({
    language: '',
    musicStyle: '',
    musicTheme: '',
    lengthOption: '',
    lyricStyle: '',
    artistStyle: '',
    rhymeRequirement: '',
    songStructure: '',
    paragraphLength: ''
  });

  // Personal styles state
  const [personalStyles, setPersonalStyles] = useState<Array<{id: number, title: string, music_style?: string, language: string}>>([]);
  const [showPersonalStyles, setShowPersonalStyles] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveLyrics, setLiveLyrics] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // 检查用户权限和设置模型类型
  useEffect(() => {
    if (!authLoading && user && profile) {
      const canUseProModel = isActiveUser;
      setFormData(prev => ({
        ...prev,
        modelType: canUseProModel ? 'pro' : 'basic'
      }));
    }
  }, [user, profile, authLoading]);

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
        // Close dropdown after selection
        setTimeout(() => {
          customSelect.classList.remove('open');
        }, 100);
      }
    };

    // Add event listeners
    form.querySelectorAll('select').forEach(select => {
      select.addEventListener('focus', handleSelectFocus);
      select.addEventListener('blur', handleSelectBlur);
      select.addEventListener('change', handleSelectChange);
    });

    return () => {
      // Cleanup event listeners
      form.querySelectorAll('select').forEach(select => {
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
        'useBpm', 'melody', 'syllablePattern', 'personalStyleId'
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
          } else if (key === 'personalStyleId') {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              (urlParams as any)[key] = numValue;
            }
          } else {
            (urlParams as any)[key] = value;
          }
        }
      });
      
      // Update params if any URL parameters were found
      if (Object.keys(urlParams).length > 0) {
        setFormData(prev => ({ ...prev, ...urlParams }));
      }
    }
  }, [searchParams]);

  // Fetch personal styles for premium users
  useEffect(() => {
    if (user && profile?.status === 'active') {
      fetchPersonalStyles();
    }
  }, [user, profile]);

  const fetchPersonalStyles = async () => {
    try {
      const response = await fetch('/api/personal-styles/user');
      const data = await response.json();
      if (data.success) {
        setPersonalStyles(data.personalStyles || []);
      }
    } catch (error) {
      console.error('Failed to fetch personal styles:', error);
    }
  };

  const handleInputChange = (field: keyof LyricsGenerationParams, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomInputChange = (field: keyof typeof customInputs, value: string) => {
    setCustomInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleShowUpgradeModal = (data: any) => {
    setUpgradeReason(data.message);
    setShowUpgradeModal(true);
  };

  const handleUpgrade = () => {
            router.push('/auth/signin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查用户是否已登录
    if (!user) {
      toast.error('Please sign in to generate lyrics');
      router.push('/auth/signin?returnTo=/generate');
      return;
    }

    // 检查用户配额
    // 纯前端：不再请求用户配额

    try {
      // Prepare params for submission, replacing "Other" values with custom inputs
      const submissionParams = { ...formData };
      
      // Replace "Other" values with actual custom inputs and validate
      Object.keys(customInputs).forEach(key => {
        if (formData[key as keyof LyricsGenerationParams] === 'Other') {
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

  // 如果正在加载认证状态，显示加载页面
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                    <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Language *
                  </label>
                  <div className="custom-select">
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                      {/* For now, using placeholder options */}
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.language === 'Other' && (
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
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Music Style *
                  </label>
                  <div className="custom-select">
                    <select
                      value={formData.musicStyle}
                      onChange={(e) => handleInputChange('musicStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                      {/* For now, using placeholder options */}
                      <option value="Pop">Pop</option>
                      <option value="Rock">Rock</option>
                      <option value="Hip Hop">Hip Hop</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Classical">Classical</option>
                      <option value="Country">Country</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.musicStyle === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom music style..."
                      value={customInputs.musicStyle}
                      onChange={(e) => handleCustomInputChange('musicStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      maxLength={50}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Music Theme */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Music Theme *
                </label>
                <div className="custom-select">
                  <select
                    value={formData.musicTheme}
                    onChange={(e) => handleInputChange('musicTheme', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    required
                  >
                    {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                    {/* For now, using placeholder options */}
                    <option value="Love">Love</option>
                    <option value="Sadness">Sadness</option>
                    <option value="Anger">Anger</option>
                    <option value="Joy">Joy</option>
                    <option value="Hope">Hope</option>
                    <option value="Fear">Fear</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.musicTheme === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom music theme..."
                    value={customInputs.musicTheme}
                    onChange={(e) => handleCustomInputChange('musicTheme', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                    maxLength={50}
                    required
                  />
                )}
              </div>

              {/* Length Option */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Length *
                </label>
                <div className="custom-select">
                  <select
                    value={formData.lengthOption}
                    onChange={(e) => handleInputChange('lengthOption', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    required
                  >
                    {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                    {/* For now, using placeholder options */}
                    <option value="Short">Short (1-2 verses)</option>
                    <option value="Medium">Medium (2-3 verses + chorus)</option>
                    <option value="Long">Long (4-5 verses + chorus)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.lengthOption === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom length..."
                    value={customInputs.lengthOption}
                    onChange={(e) => handleCustomInputChange('lengthOption', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                    maxLength={50}
                    required
                  />
                )}
              </div>

              {/* Lyric Style and Song Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Lyric Style *
                  </label>
                  <div className="custom-select">
                    <select
                      name="lyricStyle"
                      value={formData.lyricStyle}
                      onChange={(e) => handleInputChange('lyricStyle', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                      {/* For now, using placeholder options */}
                      <option value="Conversational">Conversational</option>
                      <option value="Poetic">Poetic</option>
                      <option value="Modern">Modern</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.lyricStyle === 'Other' && (
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
                      value={formData.songStructure}
                      onChange={(e) => handleInputChange('songStructure', e.target.value)}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      required
                    >
                      {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                      {/* For now, using placeholder options */}
                      <option value="Verse-Chorus">Verse-Chorus</option>
                      <option value="Verse-Bridge-Chorus">Verse-Bridge-Chorus</option>
                      <option value="Intro-Verse-Chorus-Outro">Intro-Verse-Chorus-Outro</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.songStructure === 'Other' && (
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
                  value={formData.artistStyle}
                  onChange={(e) => handleInputChange('artistStyle', e.target.value)}
                  className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                  placeholder="e.g., Taylor Swift, Drake, Ed Sheeran"
                />
              </div>

              {/* Emotion Intensity */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Emotion Intensity: {formData.emotionIntensity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.emotionIntensity}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    handleInputChange('emotionIntensity', newValue);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${formData.emotionIntensity}%, #e5e7eb ${formData.emotionIntensity}%, #e5e7eb 100%)`
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
                  Rhyme Requirement *
                </label>
                <div className="custom-select">
                  <select
                    value={formData.rhymeRequirement}
                    onChange={(e) => handleInputChange('rhymeRequirement', e.target.value)}
                    className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    required
                  >
                    {/* Assuming FORM_OPTIONS is defined elsewhere or removed if not needed */}
                    {/* For now, using placeholder options */}
                    <option value="Perfect rhymes">Perfect rhymes</option>
                    <option value="Standard rhymes">Standard rhymes</option>
                    <option value="No rhymes">No rhymes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.rhymeRequirement === 'Other' && (
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

              {/* BPM and Model Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    BPM (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id="useBpm"
                      checked={formData.useBpm}
                      onChange={(e) => handleInputChange('useBpm', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="useBpm" className="text-sm text-gray-700">
                      Include BPM
                    </label>
                  </div>
                  {formData.useBpm && (
                    <input
                      type="number"
                      min="60"
                      max="200"
                      value={formData.bpm}
                      onChange={(e) => handleInputChange('bpm', parseInt(e.target.value))}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 mt-3"
                      placeholder="120"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    AI Model
                  </label>
                  <div className="custom-select">
                    <select
                      value={formData.modelType}
                      onChange={(e) => handleInputChange('modelType', e.target.value as 'basic' | 'pro')}
                      className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                    >
                      <option value="basic">Basic Model (Free)</option>
                      <option value="pro">Pro Model (Premium)</option>
                    </select>
                  </div>
                </div>
                {formData.modelType === 'pro' && (
                  <p className="text-sm text-amber-600 mt-1">
                    Pro model available with premium subscription or free trial
                  </p>
                )}
              </div>

              {/* Personal Style Selection */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Personal Style (Optional)
                </label>
                
                {profile?.status === 'active' && personalStyles.length > 0 ? (
                  <>
                    <div className="custom-select">
                      <select
                        value={formData.personalStyleId || ''}
                        onChange={(e) => handleInputChange('personalStyleId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200"
                      >
                        <option value="">No personal style</option>
                        {personalStyles.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.title} {style.music_style ? `(${style.music_style})` : ''} - {style.language}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Select your personal style to help AI understand your writing preferences
                    </p>
                    {formData.personalStyleId && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Selected:</strong> {personalStyles.find(s => s.id === formData.personalStyleId)?.title}
                        </p>
                      </div>
                    )}
                  </>
                ) : profile?.status === 'active' && personalStyles.length === 0 ? (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      <strong>No personal styles yet.</strong> Upload your own lyrics to create a personal style that AI can learn from.
                    </p>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      <a href="/personal-style">Create Personal Style</a>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-800 mb-3">
                      <strong>Personal Style Library</strong> - Upload your own lyrics to train AI with your unique writing style.
                    </p>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="text-purple-700 border-purple-300 hover:bg-purple-100"
                    >
                      <a href="/personal-style">Learn More</a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  value={formData.intentOrRequest}
                  onChange={(e) => handleInputChange('intentOrRequest', e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm hover:border-gray-300 transition-all duration-200 placeholder-gray-500"
                  placeholder="Any specific requirements, mood, or creative direction..."
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.intentOrRequest.length}/500 characters
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
      {showUpgradeModal && upgradeReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Upgrade to Pro</h3>
            <p className="text-gray-600 mb-6">{upgradeReason}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/pricing');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}