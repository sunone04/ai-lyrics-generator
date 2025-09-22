'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
  cached?: boolean;
}

function LiveGenerationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile, user, profile } = useAuth();
  const [status, setStatus] = useState<GenerationStatus>({
    status: 'connecting',
    liveText: ''
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Partial rewrite state
  const [selectedText, setSelectedText] = useState('');
  const [showRewriteButton, setShowRewriteButton] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteRequest, setRewriteRequest] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Share / utility state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Parse URL parameters (align with LyricsGenerationParams)
  const language = searchParams.get('language') || '';
  const musicStyle = searchParams.get('musicStyle') || '';
  const musicTheme = searchParams.get('musicTheme') || '';
  const lengthOption = searchParams.get('lengthOption') || '';
  const lyricStyle = searchParams.get('lyricStyle') || '';
  const intentOrRequest = searchParams.get('intentOrRequest') || '';
  const artistStyle = searchParams.get('artistStyle') || '';
  const emotionIntensity = parseInt(searchParams.get('emotionIntensity') || '0', 10) || 0;
  const rhymeRequirement = searchParams.get('rhymeRequirement') || '';
  const songStructure = searchParams.get('songStructure') || '';
  const paragraphLength = searchParams.get('paragraphLength') || '';
  const bpm = parseInt(searchParams.get('bpm') || '0', 10) || 0;
  const useBpm = searchParams.get('useBpm') === 'true';
  const melody = searchParams.get('melody') || '';
  const syllablePattern = searchParams.get('syllablePattern') || '';
  const modelType = (searchParams.get('modelType') as 'basic' | 'pro') || 'basic';
  const regen = searchParams.get('regen') === '1' || searchParams.get('regen') === 'true';

  useEffect(() => {
    const startGeneration = async () => {
      try {
        setStatus(prev => ({ ...prev, status: 'connecting' }));
        
        // 创建可中止的请求控制器
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Check for cached result first (Active CPU optimization)
        const response = await fetch('/api/generate-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language,
            musicStyle,
            musicTheme,
            lengthOption,
            lyricStyle,
            intentOrRequest,
            artistStyle,
            emotionIntensity,
            rhymeRequirement,
            songStructure,
            paragraphLength,
            bpm,
            useBpm,
            melody,
            syllablePattern,
            modelType,
            regen
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle cached result (Active CPU optimization)
        if (response.headers.get('content-type')?.includes('application/json')) {
          const cachedData = await response.json();
          if (cachedData.cached) {
            setStatus({
              status: 'completed',
              liveText: cachedData.result,
              cached: true,
              // Generation will be fetched after completion
              totalTime: Date.now() - startTimeRef.current
            });
            try { await refreshProfile(true); } catch {}
            // Try to resolve the newest generation id
            try {
              const res = await fetch('/api/me/generations?page=1&pageSize=1', { cache: 'no-store' });
              const j = await res.json();
              const gen = j?.generations?.[0];
              if (gen?.id) setStatus(prev => ({ ...prev, generationId: String(gen.id) }));
            } catch {}
            return;
          }
        }

        // Handle streaming response
        if (!response.body) {
          throw new Error('No response body');
        }

        setStatus(prev => ({ ...prev, status: 'generating' }));

        // 璁剧疆瓒呮椂
        timeoutRef.current = setTimeout(() => {
          setStatus(prev => ({ 
            ...prev, 
            status: 'timeout',
            error: 'Generation timed out. Please try again.'
          }));
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 60000); // 60绉掕秴鏃?
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        // Inactivity timeout: reset on every chunk; avoid aborting on mobile background
        const resetTimeout = () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setStatus(prev => ({ 
              ...prev, 
              status: 'timeout',
              error: 'Generation timed out. Please try again.'
            }));
            try { abortControllerRef.current?.abort(); } catch {}
          }, 120000);
        };
        // Replace initial 60s timer with a 2鈥憁inute inactivity timer
        try { if (timeoutRef.current) clearTimeout(timeoutRef.current); } catch {}
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
              } else if (data.type === 'complete') {
                clearTimeout(timeoutRef.current!);
                setStatus(prev => ({
                  ...prev,
                  status: 'completed',
                  generationId: (data.id ? String(data.id) : prev.generationId),
                  totalTime: Date.now() - startTimeRef.current
                }));
                try { await refreshProfile(true); } catch {}
                // Fetch the latest generation id for persistence/navigation
                try {
                  if (!data.id) {
                    const res = await fetch('/api/me/generations?page=1&pageSize=1', { cache: 'no-store' });
                    const j = await res.json();
                    const gen = j?.generations?.[0];
                    if (gen?.id) setStatus(prev => ({ ...prev, generationId: String(gen.id) }));
                  }
                } catch {}
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

          if (buffer.trim()) {
            await processEventBlock(buffer);
          }
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
        
        setStatus(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage
        }));
      }
    };

    startGeneration();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      try { abortControllerRef.current?.abort(); } catch {}
    };
    const handleVisibility = () => {
      // disabled: keep streaming when tab is hidden
    };
    // disabled on mobile: do not abort on background
    // window.addEventListener('pagehide', handlePageHide);
    // document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      // window.removeEventListener('pagehide', handlePageHide);
      // document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connecting':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'generating':
        return <Loader2 className="h-6 w-6 animate-spin text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'timeout':
        return <Clock className="h-6 w-6 text-orange-500" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connecting':
        return 'AI is thinking...';
      case 'generating':
        return 'AI is generating your lyrics...';
      case 'completed':
        return status.cached ? 'Retrieved from cache' : 'Generation completed!';
      case 'error':
        return 'Generation failed';
      case 'timeout':
        return 'Generation timeout';
      default:
        return 'Processing...';
    }
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Text selection handlers for partial rewrite (robust + mobile friendly)
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
    let y = rect.bottom + offset; // viewport coords (for fixed)
    if (rect.bottom + 48 > vh) {
      y = Math.max(rect.top - offset - 40, 8);
    }
    x = Math.min(Math.max(x, 8), vw - 8);
    setSelectionPosition({ x, y });
    setShowRewriteButton(true);
  };

  const handleTextSelection = (event: React.MouseEvent | React.TouchEvent) => {
    updateSelectionUI();
    // Prevent accidental clear and bubbling on selection end
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
    try { window.getSelection()?.removeAllRanges(); } catch {}
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

  // Global selection listeners for better reliability (desktop + mobile)
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
        body: JSON.stringify({
          originalLyrics: status.liveText,
          selectedText,
          rewriteRequest,
          modelType,
        }),
      });
      if (!response.ok) throw new Error('Rewrite failed');
      const resp = await response.json();
      const rewrittenPortion: string = resp.rewrittenLyrics || resp.rewrittenPortion;
      const updatedLyrics = status.liveText.replace(selectedText, rewrittenPortion);
      setStatus(prev => ({ ...prev, liveText: updatedLyrics }));

      // Persist to DB if we resolved a generation id
      if (status.generationId) {
        try {
          await fetch(`/api/generations/${status.generationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generated_lyrics: updatedLyrics }),
          });
        } catch {}
      }

      try { await refreshProfile(true); } catch {}
      setShowRewriteModal(false);
      setRewriteRequest('');
      handleClearSelection();
    } catch (e) {
      // ignore
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Lyrics Generation</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          {status.status === 'generating' && (
            <Badge variant="secondary">
              {getElapsedTime()}
            </Badge>
          )}
          {status.cached && (
            <Badge variant="outline" className="text-green-600">
              Cached Result
            </Badge>
          )}
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Generation Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Theme:</span>
              <p className="text-gray-600 truncate">{musicTheme}</p>
            </div>
            <div>
              <span className="font-medium">Genre:</span>
              <p className="text-gray-600">{musicStyle}</p>
            </div>
            <div>
              <span className="font-medium">Style:</span>
              <p className="text-gray-600">{lyricStyle}</p>
            </div>
            <div>
              <span className="font-medium">Language:</span>
              <p className="text-gray-600">{language}</p>
            </div>
            {useBpm && bpm && (
              <div>
                <span className="font-medium">BPM:</span>
                <p className="text-gray-600">{bpm}</p>
              </div>
            )}
            {melody && (
              <div>
                <span className="font-medium">Melody:</span>
                <p className="text-gray-600 truncate">{melody}</p>
              </div>
            )}
            {syllablePattern && (
              <div>
                <span className="font-medium">Syllable Pattern:</span>
                <p className="text-gray-600 truncate">{syllablePattern}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generated Lyrics</CardTitle>
        </CardHeader>
        <CardContent>
          {status.error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Generation Failed</h3>
              <p className="text-gray-600 mb-4">{status.error}</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => router.push('/generate')}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[400px]">
              {status.liveText ? (
                <div
                  ref={lyricsContainerRef}
                  className="lyrics-container relative"
                  onMouseUp={handleTextSelection}
                  onTouchEnd={handleTextSelection}
                >
                  <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed cursor-text select-text p-2" style={{ userSelect: 'text' }}>
                    {status.liveText}
                  </pre>
                  {status.status === 'generating' && (
                    <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse" />
                  )}
                  {status.status === 'completed' && showRewriteButton && selectionPosition && (
                    <button
                      onClick={handleRewriteButtonClick}
                      className="rewrite-button fixed z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                      style={{ left: `${selectionPosition.x}px`, top: `${selectionPosition.y}px`, transform: 'translateX(-50%)' }}
                    >
                      Rewrite Selected
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Waiting for AI to respond...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {status.liveText && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(status.liveText); toast.success('Lyrics copied to clipboard!'); } catch { toast.error('Failed to copy lyrics'); }
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
            Copy
          </button>
          <button
            onClick={() => { const filename = `lyrics-${new Date().toISOString().split('T')[0]}.txt`; downloadTextFile(status.liveText, filename); toast.success('Lyrics downloaded!'); }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download
          </button>
          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({ title: 'AI Generated Lyrics', text: status.liveText || '', url: `${window.location.origin}/generate/result/live` });
                } else {
                  await navigator.clipboard.writeText(status.liveText || '');
                  toast.success('Lyrics copied to clipboard!');
                }
              } catch (e:any) { if (e?.name !== 'AbortError') toast.error('Failed to share'); }
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ShareIcon className="h-5 w-5 mr-2" />
            Share
          </button>
          <Button onClick={() => router.push('/generate')} variant="outline">Generate New</Button>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      )}
      {status.liveText && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Audio Preview</h2>
          </div>
          {!audioFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-gray-600">
                  <label htmlFor="live-audio-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload an audio file</span>
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
                <p className="text-xs text-gray-500">MP3, WAV, M4A up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{audioFile.name}</p>
                    <p className="text-xs text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setAudioFile(null); }} className="text-sm text-red-600 hover:text-red-700">Remove</button>
              </div>
              {audioUrl && (
                <audio controls className="w-full">
                  <source src={audioUrl} />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">Audio files are only stored temporarily in your browser and are not uploaded to our servers.</p>
        </div>
      )}

      {showRewriteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rewrite Selected Lyrics</h3>
              <p className="text-sm text-gray-600">Tell AI how you want to improve the selected text</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Text:</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-900">{selectedText}</pre>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">How would you like to rewrite this? *</label>
              <textarea
                value={rewriteRequest}
                onChange={(e) => setRewriteRequest(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg text-black resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Make it more emotional, change the rhyme scheme, use different metaphors..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button onClick={handleCloseRewriteModal} variant="outline" disabled={isRewriting}>Cancel</Button>
              <Button onClick={handleRewrite} disabled={isRewriting || !rewriteRequest.trim()}>
                {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveGenerationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiveGenerationContent />
    </Suspense>
  );
}



