'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useData } from '@/lib/contexts/data-context';
import { useAuth } from '@/lib/contexts/auth-context';
import toast from 'react-hot-toast';
import { downloadTextFile } from '@/lib/utils';
import { DocumentArrowDownIcon, ClipboardDocumentIcon, ShareIcon } from '@heroicons/react/24/outline';

interface GenerationStatus {
  status: 'connecting' | 'generating' | 'completed' | 'error' | 'timeout';
  liveText: string;
  error?: string;
  generationId?: string;
  totalTime?: number;
}

function LiveGenerationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile, user, profile, bumpProfileCounts } = useAuth();
  const { setFavorite } = useData();
  const [status, setStatus] = useState<GenerationStatus>({
    status: 'connecting',
    liveText: ''
  });
  const [rationaleText, setRationaleText] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [selectedText, setSelectedText] = useState('');
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteRequest, setRewriteRequest] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const get = (key: string) => (searchParams.get(key) || '').trim();
  const language = get('language') || 'English';
  const musicStyle = get('musicStyle') || 'Pop';
  const musicTheme = get('musicTheme') || undefined;
  const lengthOption = get('lengthOption') || undefined;
  const lyricStyle = get('lyricStyle') || undefined;
  const intentOrRequest = get('intentOrRequest') || undefined;
  const artistStyle = get('artistStyle') || undefined;
  const emotionIntensityParam = get('emotionIntensity');
  const emotionIntensity = emotionIntensityParam ? (parseInt(emotionIntensityParam, 10) || undefined) : undefined;
  const rhymeRequirement = get('rhymeRequirement') || undefined;
  const songStructure = get('songStructure') || undefined;
  const paragraphLength = get('paragraphLength') || undefined;
  const bpmParam = get('bpm');
  const bpm = bpmParam ? (parseInt(bpmParam, 10) || 0) : 0;
  const useBpm = get('useBpm') === 'true';
  const melody = get('melody') || undefined;
  const syllablePattern = get('syllablePattern') || undefined;
  const modelType = (get('modelType') as 'basic' | 'pro') || undefined;
  const regen = get('regen') === '1' || get('regen') === 'true';
  const includeRationale = false;
  const personalStyleIdParam = get('personalStyleId');
  const personalStyleId = personalStyleIdParam ? (parseInt(personalStyleIdParam, 10) || undefined) : undefined;

  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);

  useEffect(() => {
    const startGeneration = async () => {
      try {
        setStatus(prev => ({ ...prev, status: 'connecting' }));

        const controller = new AbortController();
        abortControllerRef.current = controller;

        if (!language || !musicStyle) {
          toast.error('Missing required parameters. Please set Language and Music Style.');
          router.replace('/generate');
          return;
        }

        const payload: Record<string, any> = {};
        const setIf = (key: string, value: any) => {
          if (value === undefined || value === null) return;
          if (typeof value === 'string') {
            const s = value.trim();
            if (!s) return;
            payload[key] = s;
            return;
          }
          payload[key] = value;
        };

        setIf('language', language);
        setIf('musicStyle', musicStyle);
        setIf('musicTheme', musicTheme);
        setIf('lengthOption', lengthOption);
        setIf('lyricStyle', lyricStyle);
        setIf('intentOrRequest', intentOrRequest);
        setIf('artistStyle', artistStyle);
        if (emotionIntensity) setIf('emotionIntensity', emotionIntensity);
        setIf('rhymeRequirement', rhymeRequirement);
        setIf('songStructure', songStructure);
        setIf('paragraphLength', paragraphLength);
        if (useBpm && bpm) { payload.useBpm = true; payload.bpm = bpm; }
        setIf('melody', melody);
        setIf('syllablePattern', syllablePattern);
        setIf('modelType', modelType);
        if (personalStyleId) payload.personalStyleId = personalStyleId;
        if (regen) payload.regen = true;

        const response = await fetch('/api/generate-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({} as any));
          const serverMsg = (errorData && (errorData.error || errorData.message)) as string | undefined;
          throw new Error(serverMsg || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) throw new Error('No response body');

        setStatus(prev => ({ ...prev, status: 'generating' }));

        timeoutRef.current = setTimeout(() => {
          setStatus(prev => ({ ...prev, status: 'timeout', error: 'Generation timed out. Please try again.' }));
          if (abortControllerRef.current) abortControllerRef.current.abort();
        }, 60000);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const resetTimeout = () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setStatus(prev => ({ ...prev, status: 'timeout', error: 'Generation timed out. Please try again.' }));
            try { abortControllerRef.current?.abort(); } catch { }
          }, 120000);
        };

        try { if (timeoutRef.current) clearTimeout(timeoutRef.current); } catch { }
        resetTimeout();

        try {
          const processEventBlock = async (eventBlock: string) => {
            const normalized = eventBlock.replace(/\r\n/g, '\n');
            const lines = normalized.split('\n').filter(l => l.trim() && !l.startsWith(':'));
            const dataLines = lines.filter(l => l.startsWith('data:'));
            if (dataLines.length === 0) return;

            const dataPayload = dataLines.map(l => l.slice(5).trimStart()).join('\n');
            try {
              const data = JSON.parse(dataPayload);
              if (data.type === 'chunk') {
                setStatus(prev => ({ ...prev, liveText: prev.liveText + (data.content || '') }));
                resetTimeout();
              } else if (data.type === 'rationale') {
                if (typeof data.content === 'string') setRationaleText(data.content);
              } else if (data.type === 'complete') {
                clearTimeout(timeoutRef.current!);
                setStatus(prev => ({
                  ...prev,
                  status: 'completed',
                  generationId: (data.id ? String(data.id) : prev.generationId),
                  totalTime: Date.now() - startTimeRef.current
                }));
                try { bumpProfileCounts({ generation: 1 }); } catch { }
                try {
                  if (!data.id) {
                    const res = await fetch('/api/me/generations?page=1&pageSize=1', { cache: 'no-store' });
                    const j = await res.json();
                    const gen = j?.generations?.[0];
                    if (gen?.id) setStatus(prev => ({ ...prev, generationId: String(gen.id) }));
                  }
                } catch { }
              } else if (data.type === 'error') {
                clearTimeout(timeoutRef.current!);
                setStatus(prev => ({ ...prev, status: 'error', error: data.message || 'Generation failed' }));
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          };

          const findSep = (buf: string) => {
            const idxLF = buf.indexOf('\n\n');
            const idxCRLF = buf.indexOf('\r\n\r\n');
            if (idxLF === -1) return idxCRLF;
            if (idxCRLF === -1) return idxLF;
            return Math.min(idxLF, idxCRLF);
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let sepIndex: number;
            while ((sepIndex = findSep(buffer)) !== -1) {
              const eventBlock = buffer.slice(0, sepIndex);
              const sep = buffer.substr(sepIndex, 4) === '\r\n\r\n' ? '\r\n\r\n' : '\n\n';
              buffer = buffer.slice(sepIndex + sep.length);
              await processEventBlock(eventBlock);
            }
          }
          if (buffer.trim()) await processEventBlock(buffer);
        } finally {
          reader.releaseLock();
        }

      } catch (error: any) {
        console.error('Generation error:', error);
        clearTimeout(timeoutRef.current!);
        let errorMessage = 'Failed to generate lyrics';
        if (error.name === 'AbortError') {
          errorMessage = 'Generation was cancelled';
        } else if (error.message) {
          errorMessage = error.message;
        }
        setStatus(prev => ({ ...prev, status: 'error', error: errorMessage }));
      }
    };

    startGeneration();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const fetchFavoriteState = async () => {
      try {
        if (status.status !== 'completed' || !status.generationId) return;
        const res = await fetch(`/api/generations/${status.generationId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (j?.generation && typeof j.generation.is_favorited === 'boolean') {
          setIsFavorited(Boolean(j.generation.is_favorited));
        }
      } catch { }
    };
    fetchFavoriteState();
  }, [status.status, status.generationId]);

  const handleToggleFavorite = async () => {
    try {
      if (!user) { router.push('/auth/signin'); return; }
      if (!status.generationId) return;
      setIsTogglingFavorite(true);
      const next = !isFavorited;
      await setFavorite(parseInt(String(status.generationId), 10), next);
      setIsFavorited(next);
      toast.success(next ? 'Added to favorites' : 'Removed from favorites');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update favorite');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  useEffect(() => {
    const handlePageHide = () => { try { abortControllerRef.current?.abort(); } catch { } };
    return () => {};
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connecting':
        return <Loader2 className="h-6 w-6 animate-spin text-violet-400" />;
      case 'generating':
        return <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-400" />;
      case 'timeout':
        return <Clock className="h-6 w-6 text-amber-400" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connecting':
        return 'Preparing to generate your lyrics…';
      case 'generating':
        return 'AI is crafting high-quality lyrics for you. This may take a moment, thanks for your patience…';
      case 'completed':
        return 'Generation complete!';
      case 'error':
        return 'Generation failed. Please try again.';
      case 'timeout':
        return 'Generation timed out. Please try again later.';
      default:
        return 'Processing…';
    }
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const updateSelectionUI = () => {
    const selection = window.getSelection();
    const container = lyricsContainerRef.current;
    if (!selection || !container || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowRewriteButton(false);
      setSelectionPosition(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text || text.length < 5) {
      setShowRewriteButton(false);
      setSelectionPosition(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    if (!container.contains(startNode) || !container.contains(endNode)) {
      setShowRewriteButton(false);
      setSelectionPosition(null);
      return;
    }
    setSelectedText(text);
    const rects = range.getClientRects();
    const rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offset = 10;
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + offset;
    if (rect.bottom + 48 > vh) y = Math.max(rect.top - offset - 40, 8);
    x = Math.min(Math.max(x, 8), vw - 8);
    setSelectionPosition({ x, y });
    setShowRewriteButton(true);
  };

  const handleTextSelection = (event: React.MouseEvent | React.TouchEvent) => {
    updateSelectionUI();
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRewriteButtonClick = () => {
    setShowRewriteButton(false);
    setSelectionPosition(null);
    setShowRewriteModal(true);
  };

  const handleCloseRewriteModal = () => {
    setShowRewriteModal(false);
    setRewriteRequest('');
  };

  const handleClearSelection = () => {
    setShowRewriteButton(false);
    setSelectionPosition(null);
    setSelectedText('');
    try { window.getSelection()?.removeAllRanges(); } catch { }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (showRewriteModal) return;
      const target = e.target as Element;
      if (!target.closest('.lyrics-container') && !target.closest('.rewrite-button')) {
        handleClearSelection();
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [showRewriteModal]);

  useEffect(() => {
    const onSelChange = () => updateSelectionUI();
    const onScroll = () => { if (showRewriteButton) updateSelectionUI(); };
    document.addEventListener('selectionchange', onSelChange);
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('selectionchange', onSelChange);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [showRewriteButton]);

  const handleRewrite = async () => {
    if (!selectedText || !rewriteRequest.trim() || !status.liveText) return;
    setIsRewriting(true);
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalLyrics: status.liveText, selectedText, rewriteRequest, modelType }),
      });
      if (!response.ok) throw new Error('Rewrite failed');
      const resp = await response.json();
      const rewrittenPortion: string = resp.rewrittenLyrics || resp.rewrittenPortion;
      const updatedLyrics = status.liveText.replace(selectedText, rewrittenPortion);
      setStatus(prev => ({ ...prev, liveText: updatedLyrics }));
      if (status.generationId) {
        try {
          await fetch(`/api/generations/${status.generationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generated_lyrics: updatedLyrics }),
          });
        } catch { }
      }
      try { bumpProfileCounts({ rewrite: 1 }); } catch { }
      setShowRewriteModal(false);
      setRewriteRequest('');
      handleClearSelection();
    } catch (e) {
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="min-h-screen noise-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-white">AI Lyrics Generation</h1>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
            {status.status === 'generating' && (
              <Badge variant="secondary" className="bg-white/5 text-zinc-400 border-white/10">
                {getElapsedTime()}
              </Badge>
            )}
          </div>
        </div>

        <Card className="mb-6 border-white/5 bg-white/[0.02] shadow-2xl shadow-black/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Generation Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {musicTheme && (
                <div>
                  <span className="font-medium text-zinc-300">Theme:</span>
                  <span className="ml-2 text-zinc-500">{musicTheme}</span>
                </div>
              )}
              {language && (
                <div>
                  <span className="font-medium text-zinc-300">Language:</span>
                  <span className="ml-2 text-zinc-500">{language}</span>
                </div>
              )}
              {musicStyle && (
                <div>
                  <span className="font-medium text-zinc-300">Style:</span>
                  <span className="ml-2 text-zinc-500">{musicStyle}</span>
                </div>
              )}
              {lengthOption && (
                <div>
                  <span className="font-medium text-zinc-300">Length:</span>
                  <span className="ml-2 text-zinc-500">{lengthOption}</span>
                </div>
              )}
              {lyricStyle && (
                <div>
                  <span className="font-medium text-zinc-300">Lyric Style:</span>
                  <span className="ml-2 text-zinc-500">{lyricStyle}</span>
                </div>
              )}
              {artistStyle && (
                <div>
                  <span className="font-medium text-zinc-300">Artist:</span>
                  <span className="ml-2 text-zinc-500">{artistStyle}</span>
                </div>
              )}
              {modelType && (
                <div>
                  <span className="font-medium text-zinc-300">Model:</span>
                  <span className="ml-2 text-zinc-500">{modelType === 'pro' ? 'Pro' : 'Basic'}</span>
                </div>
              )}
              {personalStyleId && (
                <div>
                  <span className="font-medium text-zinc-300">Style ID:</span>
                  <span className="ml-2 text-zinc-500">{personalStyleId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-white/5 bg-white/[0.02] shadow-2xl shadow-black/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Lyrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px]">
              {status.liveText ? (
                <div
                  ref={lyricsContainerRef}
                  className="lyrics-container relative"
                  onMouseUp={handleTextSelection}
                  onTouchEnd={handleTextSelection}
                >
                  <pre className="whitespace-pre-wrap text-white leading-relaxed cursor-text select-text p-2" style={{ userSelect: 'text' }}>
                    {status.liveText}
                  </pre>
                  {status.status === 'generating' && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
                  )}
                  {status.status === 'completed' && showRewriteButton && selectionPosition && (
                    <button
                      onClick={handleRewriteButtonClick}
                      className="rewrite-button fixed z-50 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-violet-600/20 transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                      style={{ left: `${selectionPosition.x}px`, top: `${selectionPosition.y}px`, transform: 'translateX(-50%)' }}
                    >
                      Rewrite Selected
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-zinc-500">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-violet-400" />
                    <p>Waiting for AI to respond...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {rationaleText && (
          <Card className="mb-6 border-white/5 bg-white/[0.02] shadow-2xl shadow-black/40">
            <CardHeader>
              <CardTitle className="text-lg text-white">Creative Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none text-zinc-300">
                <pre className="whitespace-pre-wrap leading-relaxed">{rationaleText}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {status.liveText && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(status.liveText); toast.success('Lyrics copied to clipboard!'); } catch { toast.error('Failed to copy lyrics'); }
              }}
              className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
            >
              <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
              Copy
            </button>
            <button
              onClick={() => { const filename = `lyrics-${new Date().toISOString().split('T')[0]}.txt`; downloadTextFile(status.liveText, filename); toast.success('Lyrics downloaded!'); }}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={!user || status.status !== 'completed' || !status.generationId || isTogglingFavorite}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-500 transition-colors disabled:opacity-60 shadow-lg shadow-pink-600/20"
            >
              {isTogglingFavorite ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : isFavorited ? (
                <HeartIconSolid className="h-5 w-5 mr-2" />
              ) : (
                <HeartIcon className="h-5 w-5 mr-2" />
              )}
              {isFavorited ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={async () => {
                try {
                  const shareUrl = typeof window !== 'undefined'
                    ? window.location.href
                    : (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/generate/result/live` : '/generate/result/live');
                  if ((navigator as any).share) {
                    await (navigator as any).share({ title: 'AI Generated Lyrics', text: status.liveText || '', url: shareUrl });
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied to clipboard!');
                  }
                } catch (e: any) { if (e?.name !== 'AbortError') toast.error('Failed to share'); }
              }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Share
            </button>
            <Button onClick={() => router.push('/generate')} variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5">Generate New</Button>
            <Button onClick={() => router.push('/dashboard')} className="bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10">Go to Dashboard</Button>
          </div>
        )}

        {status.liveText && (
          <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Audio Preview</h2>
            </div>
            {!audioFile ? (
              <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-zinc-600" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-zinc-400">
                    <label htmlFor="live-audio-upload" className="cursor-pointer">
                      <span className="text-violet-400 hover:text-violet-300">Upload an audio file</span>
                      <span> to preview with your lyrics</span>
                    </label>
                    <input
                      id="live-audio-upload"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('audio/')) { toast.error('Please select an audio file'); return; }
                        if (file.size > 10 * 1024 * 1024) { toast.error('Audio file must be less than 10MB'); return; }
                        setAudioFile(file);
                        if (audioUrl) URL.revokeObjectURL(audioUrl);
                        const url = URL.createObjectURL(file);
                        setAudioUrl(url);
                        toast.success('Audio uploaded successfully!');
                      }}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-zinc-600">MP3, WAV, M4A up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-white">{audioFile.name}</p>
                      <p className="text-xs text-zinc-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setAudioFile(null); }} className="text-sm text-red-400 hover:text-red-300">Remove</button>
                </div>
                {audioUrl && (
                  <audio controls className="w-full">
                    <source src={audioUrl} />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-600">Audio files are only stored temporarily in your browser and are not uploaded to our servers.</p>
          </div>
        )}

        {showRewriteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Rewrite Selected Lyrics</h3>
                <p className="text-sm text-zinc-400">Tell AI how you want to improve the selected text</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Selected Text:</label>
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                  <pre className="whitespace-pre-wrap text-sm text-white">{selectedText}</pre>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">How would you like to rewrite this? *</label>
                <textarea
                  value={rewriteRequest}
                  onChange={(e) => setRewriteRequest(e.target.value)}
                  className="w-full h-24 p-3 border border-white/10 rounded-lg text-white resize-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 bg-white/[0.03] placeholder-zinc-600"
                  placeholder="e.g., Make it more emotional, change the rhyme scheme, use different metaphors..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button onClick={handleCloseRewriteModal} variant="outline" disabled={isRewriting} className="border-white/10 text-zinc-400 hover:bg-white/5">Cancel</Button>
                <Button onClick={handleRewrite} disabled={isRewriting || !rewriteRequest.trim()} className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20">
                  {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveGenerationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen noise-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    }>
      <LiveGenerationContent />
    </Suspense>
  );
}
