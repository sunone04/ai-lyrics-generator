'use client'; // <= 让 Next.js 13+ 知道这是客户端组件，可使用 hooks（useState、useEffect…）

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useData } from '@/lib/contexts/data-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { createClient } from '@/lib/supabase';
import { LoadingButton } from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import {
  MusicalNoteIcon,
  LanguageIcon,
  SparklesIcon,
  ClockIcon,
  HeartIcon,
  MicrophoneIcon,
  PaintBrushIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { FORM_OPTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ---------- 类型定义 ---------- */
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
  personalStyleId?: number;
  includeRationale?: boolean;
}

interface PersonalStyleGroup {
  id: number;
  name: string;
  user_id: string;
  created_at: string;
}

/* ========== 子组件：真正使用 searchParams ========== */
function GenerateContent() {
  const searchParams = useSearchParams();
  return <GenerateForm searchParams={searchParams} />;
}

/* ========== 表单主组件 ========== */
function GenerateForm({ searchParams }: { searchParams: URLSearchParams }) {
  const { user, loading: userLoading } = useAuth();
  const { isInTrial, isActiveUser, canUseTrial } = useTrial();
  const router = useRouter();
  // Optional regen flag carried via URL when coming from a prior result
  const incomingRegen = (typeof window !== 'undefined') ? (searchParams.get('regen') || '') : '';

  // Max length limits for custom 'Other' inputs
  const OTHER_LIMITS = {
    language: 40,
    musicStyle: 40,
    musicTheme: 80,
    lengthOption: 60,
    lyricStyle: 50,
    rhymeRequirement: 80,
    songStructure: 60,
  } as const;

  // Max length limits for additional free-text fields
  const FREE_TEXT_LIMITS = {
    intentOrRequest: 500,
    artistStyle: 100,
    melody: 120,
    syllablePattern: 50,
    paragraphLength: 80,
  } as const;

  const { personalStyles, loadingPersonalStyles, fetchPersonalStyles } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [showPersonalStyle, setShowPersonalStyle] = useState(false);

  const [customInputs, setCustomInputs] = useState({
    language: '',
    musicStyle: '',
    musicTheme: '',
    lengthOption: '',
    lyricStyle: '',
    rhymeRequirement: '',
    songStructure: ''
  });

  const [params, setParams] = useState<LyricsGenerationParams>({
    language: 'English',
    musicStyle: 'Pop',
    musicTheme: 'Love & Romance',
    lengthOption: 'Medium (2-3 verses + chorus)',
    lyricStyle: 'Narrative',
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
    modelType: 'basic',
    includeRationale: true,
  });

  // 前端硬限制：当自由文本超过上限时，立即截断到上限（与 maxLength 体验一致）
  useEffect(() => {
    const ft = FREE_TEXT_LIMITS as Record<string, number>;
    const updated: Partial<LyricsGenerationParams> = {};
    let changed = false;
    const clamp = (key: keyof typeof FREE_TEXT_LIMITS) => {
      const v = (params as any)[key];
      const max = ft[key];
      if (typeof v === 'string' && v.length > max) {
        (updated as any)[key] = v.slice(0, max);
        changed = true;
      }
    };
    clamp('intentOrRequest');
    clamp('artistStyle');
    clamp('melody');
    clamp('syllablePattern');
    clamp('paragraphLength');
    if (changed) setParams({ ...params, ...updated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.intentOrRequest,
    params.artistStyle,
    params.melody,
    params.syllablePattern,
    params.paragraphLength,
  ]);

  // 前端硬限制：Other 自定义输入的上限即时截断
  useEffect(() => {
    const limits = OTHER_LIMITS as Record<string, number>;
    const next = { ...customInputs };
    let changed = false;
    (Object.keys(next) as Array<keyof typeof next>).forEach((key) => {
      const v = next[key];
      const max = limits[key as any];
      if (typeof v === 'string' && max && v.length > max) {
        next[key] = v.slice(0, max);
        changed = true;
      }
    });
    if (changed) setCustomInputs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customInputs.language,
    customInputs.musicStyle,
    customInputs.musicTheme,
    customInputs.lengthOption,
    customInputs.lyricStyle,
    customInputs.rhymeRequirement,
    customInputs.songStructure,
  ]);

  /* 仅高级用户拉取个人风格库（SWR） */
  useEffect(() => {
    if (user && isActiveUser && showPersonalStyle) fetchPersonalStyles(false);
  }, [user, isActiveUser, showPersonalStyle, fetchPersonalStyles]);

  /* ---------- 提交 ---------- */
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to generate lyrics');
      router.push('/auth/signin?returnTo=/generate');
      return;
    }
    // Premium gating for Personal Style
    if (params.personalStyleId && !isActiveUser) {
      toast.error('Personal Style is a Premium feature. If eligible, your free trial will activate automatically after sign-in; otherwise, please upgrade.');
      router.push('/pricing');
      return;
    }
    // 校验自定义 Other 输入
    const errors: string[] = [];
    (Object.keys(customInputs) as Array<keyof typeof customInputs>).forEach((key) => {
      if ((params as any)[key] === 'Other') {
        const value = customInputs[key].trim();
        if (!value) {
          errors.push(`Please specify your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
        const max = (OTHER_LIMITS as any)[key] as number;
        if (max && value.length > max) {
          errors.push(`Please keep ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} within ${max} characters`);
        }
      }
    });

    // Validate other free text fields
    const ft = FREE_TEXT_LIMITS as Record<string, number>;
    const checkField = (field: keyof typeof FREE_TEXT_LIMITS, label: string) => {
      const v = (params as any)[field];
      if (typeof v === 'string' && v.trim() && v.trim().length > ft[field]) {
        errors.push(`${label} must be ${ft[field]} characters or less`);
      }
    };
    checkField('intentOrRequest', 'Creative direction');
    checkField('artistStyle', 'Artist style');
    checkField('melody', 'Melody');
    checkField('syllablePattern', 'Syllable pattern');
    checkField('paragraphLength', 'Paragraph length');
    if (errors.length) { toast.error(errors[0]); return; }

    setIsLoading(true);
    try {
      const final = {
        ...params,
        language: params.language === 'Other' ? customInputs.language : params.language,
        musicStyle: params.musicStyle === 'Other' ? customInputs.musicStyle : params.musicStyle,
        musicTheme: params.musicTheme === 'Other' ? customInputs.musicTheme : params.musicTheme,
        lengthOption: params.lengthOption === 'Other' ? customInputs.lengthOption : params.lengthOption,
        lyricStyle: params.lyricStyle === 'Other' ? customInputs.lyricStyle : params.lyricStyle,
        rhymeRequirement: params.rhymeRequirement === 'Other' ? customInputs.rhymeRequirement : params.rhymeRequirement,
        songStructure: params.songStructure === 'Other' ? customInputs.songStructure : params.songStructure
      } as any;

      const qs = new URLSearchParams();
      Object.entries(final).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      });
      if (incomingRegen) {
        qs.set('regen', incomingRegen);
      }
      router.push(`/generate/result/live?${qs.toString()}`);
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- loading 态 ---------- */
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  /* ---------- 渲染 ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs />
        {/* Header */}
        <div className="text-center mb-12 pt-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-[1.1]">
            <span className="block">AI Lyrics Generator</span>
            <span className="block gradient-title descender-fix">Create Perfect Song & Rap Lyrics</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Generate professional song and rap lyrics with our AI lyrics generator.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* -------- Basic Information -------- */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold mr-3">1</div>
              <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
              {/* Language */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><LanguageIcon className="w-5 h-5 mr-2 text-blue-600" />Language *</label>
                <select value={params.language} onChange={(e) => setParams({ ...params, language: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {FORM_OPTIONS.languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {params.language === 'Other' && <input type="text" value={customInputs.language} onChange={(e) => setCustomInputs({ ...customInputs, language: e.target.value })} placeholder="Specify language" maxLength={OTHER_LIMITS.language} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />}
              </div>
              {/* Music Style */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><MusicalNoteIcon className="w-5 h-5 mr-2 text-blue-600" />Music Style *</label>
                <select value={params.musicStyle} onChange={(e) => setParams({ ...params, musicStyle: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {FORM_OPTIONS.musicStyles.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {params.musicStyle === 'Other' && <input type="text" value={customInputs.musicStyle} onChange={(e) => setCustomInputs({ ...customInputs, musicStyle: e.target.value })} placeholder="Specify style" maxLength={OTHER_LIMITS.musicStyle} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />}
              </div>
              {/* Theme */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><HeartIcon className="w-5 h-5 mr-2 text-blue-600" />Theme *</label>
                <select value={params.musicTheme} onChange={(e) => setParams({ ...params, musicTheme: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {FORM_OPTIONS.musicThemes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {params.musicTheme === 'Other' && <input type="text" value={customInputs.musicTheme} onChange={(e) => setCustomInputs({ ...customInputs, musicTheme: e.target.value })} placeholder="Specify theme" maxLength={OTHER_LIMITS.musicTheme} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />}
              </div>
              {/* Length */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><ClockIcon className="w-5 h-5 mr-2 text-blue-600" />Length *</label>
                <select value={params.lengthOption} onChange={(e) => setParams({ ...params, lengthOption: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {FORM_OPTIONS.lengthOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {params.lengthOption === 'Other' && <input type="text" value={customInputs.lengthOption} onChange={(e) => setCustomInputs({ ...customInputs, lengthOption: e.target.value })} placeholder="Specify length" maxLength={OTHER_LIMITS.lengthOption} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />}
              </div>
            </div>
          </div>

          {/* -------- Style & Creative Direction -------- */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold mr-3">2</div>
              <h2 className="text-base font-semibold text-gray-900">Style & Creative Direction</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
              {/* Lyric Style */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><PaintBrushIcon className="w-5 h-5 mr-2 text-purple-600" />Lyric Style *</label>
                <select value={params.lyricStyle} onChange={(e) => setParams({ ...params, lyricStyle: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {FORM_OPTIONS.lyricStyles.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {params.lyricStyle === 'Other' && <input type="text" value={customInputs.lyricStyle} onChange={(e) => setCustomInputs({ ...customInputs, lyricStyle: e.target.value })} placeholder="Specify lyric style" maxLength={OTHER_LIMITS.lyricStyle} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />}
              </div>
              {/* Song Structure */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><MusicalNoteIcon className="w-5 h-5 mr-2 text-purple-600" />Song Structure *</label>
                <select value={params.songStructure} onChange={(e) => setParams({ ...params, songStructure: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {FORM_OPTIONS.songStructures.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {params.songStructure === 'Other' && <input type="text" value={customInputs.songStructure} onChange={(e) => setCustomInputs({ ...customInputs, songStructure: e.target.value })} placeholder="Specify structure" maxLength={OTHER_LIMITS.songStructure} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />}
              </div>
              {/* Rhyme */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />Rhyme Requirements</label>
                <select value={params.rhymeRequirement} onChange={(e) => setParams({ ...params, rhymeRequirement: e.target.value })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {FORM_OPTIONS.rhymeRequirements.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {params.rhymeRequirement === 'Other' && <input type="text" value={customInputs.rhymeRequirement} onChange={(e) => setCustomInputs({ ...customInputs, rhymeRequirement: e.target.value })} placeholder="Specify rhyme" maxLength={OTHER_LIMITS.rhymeRequirement} className="w-full mt-2 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />}
              </div>
              {/* Artist Style */}
              <div>
                <label className="flex items-center text-base font-semibold text-gray-700 mb-2"><MicrophoneIcon className="w-5 h-5 mr-2 text-purple-600" />Artist Style Reference</label>
                <input type="text" value={params.artistStyle} onChange={(e) => setParams({ ...params, artistStyle: e.target.value })} placeholder="e.g., Taylor Swift, Drake" maxLength={FREE_TEXT_LIMITS.artistStyle} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            {/* Creative Direction */}
            <div className="pl-11 mt-6">
              <label className="block text-base font-semibold text-gray-700 mb-2">Creative Direction & Special Requirements</label>
              <textarea value={params.intentOrRequest} onChange={(e) => setParams({ ...params, intentOrRequest: e.target.value })} placeholder="Describe mood, direction…" rows={3} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>

            {/* Emotion Intensity */}
            <div className="pl-11 mt-6">
              <label className="block text-base font-semibold text-gray-700 mb-2">Emotion Intensity: <span className="text-purple-600 font-bold">{params.emotionIntensity}%</span></label>
              <input type="range" min={1} max={100} value={params.emotionIntensity} onChange={(e) => setParams({ ...params, emotionIntensity: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-sm text-gray-600 mt-1"><span>Subtle</span><span>Intense</span></div>
            </div>
          </div>

          {/* -------- Advanced Options -------- */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold mr-3">3</div>
              <h2 className="text-base font-semibold text-gray-900">Advanced Options</h2>
            </div>

            {/* BPM */}
            <div className="flex items-center space-x-3 pl-11 mb-6">
              <input id="useBpm" type="checkbox" checked={params.useBpm} onChange={(e) => setParams({ ...params, useBpm: e.target.checked })} className="w-5 h-5 text-pink-600 border border-gray-300 rounded focus:ring-pink-500 cursor-pointer" />
              <label htmlFor="useBpm" className="text-base font-semibold text-gray-700 cursor-pointer">Specify BPM</label>
              {params.useBpm && <input type="number" min={60} max={200} value={params.bpm} onChange={(e) => setParams({ ...params, bpm: Number(e.target.value) })} className="w-24 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />}
            </div>

            {/* Advanced Inputs */}
            <div className="grid grid-cols-1 gap-6 pl-11">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Melody Description</label>
                <input type="text" value={params.melody} onChange={(e) => setParams({ ...params, melody: e.target.value })} placeholder="Describe melody…" className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Syllable Pattern</label>
                <input type="text" value={params.syllablePattern} onChange={(e) => setParams({ ...params, syllablePattern: e.target.value })} placeholder="e.g., 8-8-6-6" maxLength={FREE_TEXT_LIMITS.syllablePattern} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Paragraph Length Preference</label>
                <input type="text" value={params.paragraphLength} onChange={(e) => setParams({ ...params, paragraphLength: e.target.value })} placeholder="e.g., 4 lines per verse" maxLength={FREE_TEXT_LIMITS.paragraphLength} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
            </div>

            {/* Creative Rationale (default on) */}
            <div className="pl-11 mt-6 flex items-start gap-3">
              <input
                id="includeRationale"
                type="checkbox"
                checked={params.includeRationale ?? true}
                onChange={(e) => setParams({ ...params, includeRationale: e.target.checked })}
                className="mt-1 w-5 h-5 text-pink-600 border border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
              />
              <div>
                <label htmlFor="includeRationale" className="text-base font-semibold text-gray-700 cursor-pointer">
                  Explain creative rationale (Why these lyrics)
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, AI also provides a short, professional songwriter explanation of the theme, structure, rhyme and stylistic choices — so you understand why the lyrics were crafted this way.
                </p>
              </div>
            </div>

            {user && isActiveUser && (
              <div className="pl-11 mt-6">
                {!showPersonalStyle ? (
                  <button
                    type="button"
                    onClick={() => { setShowPersonalStyle(true); fetchPersonalStyles(true); }}
                    className="inline-flex items-center px-6 py-3 text-base font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Choose from Personal Style
                  </button>
                ) : (
                  <>
                    {loadingPersonalStyles && (
                      <div className="text-sm text-gray-600">Loading personal styles...</div>
                    )}
                    {!loadingPersonalStyles && personalStyles.length === 0 && (
                      <div className="text-sm text-gray-700">
                        No personal styles yet. <Link href="/personal-style" className="text-purple-700 underline">Create one</Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Personal Style */}
            {showPersonalStyle && user && isActiveUser && !loadingPersonalStyles && personalStyles.length > 0 && (
              <div className="pl-11 mt-6">
                <label className="block text-base font-semibold text-gray-700 mb-2">Personal Style (Optional)</label>
                <select value={params.personalStyleId || ''} onChange={(e) => setParams({ ...params, personalStyleId: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="">None selected</option>
                  {personalStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* 非高级用户提示 */}
            {(!user || !isActiveUser) && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg ml-11 mt-6">
                <h3 className="text-base font-bold text-purple-900 mb-1">Personal Style Library</h3>
                <p className="text-sm text-purple-700 mb-2">Train AI to write in your unique style by uploading your existing lyrics.</p>
                {!user ? (
                  <button onClick={() => router.push('/auth/signin?returnTo=/generate')} className="text-sm text-purple-600 hover:text-purple-800 font-semibold underline">Sign in to access</button>
                ) : (
                  <Link href="/pricing" className="text-sm text-purple-600 hover:text-purple-800 font-semibold underline">Upgrade to Premium</Link>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div className="pl-11 mt-8 pt-6 border-t border-gray-200">
              <label className="block text-base font-semibold text-gray-700 mb-3">AI Model Quality</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setParams({ ...params, modelType: 'basic' })} className={`p-4 border rounded-xl cursor-pointer transition-all ${params.modelType === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <div className="flex items-center justify-between mb-1"><h3 className="text-base font-bold text-gray-900">Standard Quality</h3><span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">Free</span></div>
                  <p className="text-sm text-gray-600">Great quality for everyday lyrics creation</p>
                </div>
                <div onClick={async () => {
                  if (!user) { toast.error('Please sign in'); router.push('/auth/signin?returnTo=/generate'); return; }
                  if (!isInTrial && !isActiveUser) {
                    if (canUseTrial) {
                      // Auto activation runs in background after login; guide user to retry shortly
                      toast('Preparing your free trial... Please try again in a moment.', { icon: '⏳' } as any);
                    } else {
                      toast.error('Pro model requires subscription');
                    }
                    return;
                  }
                  setParams({ ...params, modelType: 'pro' });
                }} className={`p-4 border rounded-xl cursor-pointer transition-all ${params.modelType === 'pro' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'} ${!user || (!isInTrial && !isActiveUser) ? 'opacity-75' : ''}`}>
                  <div className="flex items-center justify-between mb-1"><h3 className="text-base font-bold text-gray-900">Premium Quality</h3><span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">Premium</span></div>
                  <p className="text-sm text-gray-600">Advanced creativity & superior results</p>
                </div>
              </div>
            </div>
          </div>

          {/* -------- Generate Button -------- */}
          <div className="flex justify-center pt-6 border-t border-gray-200">
            <LoadingButton isLoading={isLoading} onClick={handleSubmit} className="px-10 py-3 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer">
              {!user ? 'Sign In to Generate Lyrics ✨' : 'Generate AI Lyrics Now ✨'}
            </LoadingButton>
          </div>

          {/* SEO & Sign-in Tip */}
          <div className="mt-10 p-4 bg-gray-50 rounded-lg border">
            <h2 className="text-base font-bold text-gray-900 mb-2">🎵 Professional AI Lyrics Generator</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our AI lyrics generator uses advanced artificial intelligence to create professional song lyrics and rap lyrics. Whether you need a <strong>rap lyrics generator</strong>, <strong>song lyrics generator</strong>, or custom <strong>lyric generator</strong> for any music style, our AI lyric generator delivers high-quality results instantly.
            </p>
          </div>
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center"><InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" /><p className="text-base text-blue-800">Ready to create amazing lyrics? <Link href="/auth/signin?returnTo=/generate" className="underline font-semibold">Sign in</Link> to access our professional AI lyrics generator!</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 页面壳 ---------- */
export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
