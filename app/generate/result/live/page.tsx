'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
  const [status, setStatus] = useState<GenerationStatus>({
    status: 'connecting',
    liveText: ''
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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
        abortControllerRef.current = new AbortController();

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
          signal: abortControllerRef.current.signal,
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
              generationId: Date.now().toString(),
              totalTime: Date.now() - startTimeRef.current
            });
            return;
          }
        }

        // Handle streaming response
        if (!response.body) {
          throw new Error('No response body');
        }

        setStatus(prev => ({ ...prev, status: 'generating' }));

        // 设置超时
        timeoutRef.current = setTimeout(() => {
          setStatus(prev => ({ 
            ...prev, 
            status: 'timeout',
            error: 'Generation timed out. Please try again.'
          }));
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 60000); // 60秒超时

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
        // Replace initial 60s timer with a 2‑minute inactivity timer
        try { if (timeoutRef.current) clearTimeout(timeoutRef.current); } catch {}
        resetTimeout();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode incrementally to handle multibyte boundaries
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events separated by double newlines
            let sepIndex: number;
            while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
              const eventBlock = buffer.slice(0, sepIndex);
              buffer = buffer.slice(sepIndex + 2);

              // Ignore comment/heartbeat lines starting with ':'
              const lines = eventBlock.split('\n').filter(l => l.trim() && !l.startsWith(':'));
              const dataLines = lines.filter(l => l.startsWith('data:'));
              if (dataLines.length === 0) continue;

              // Concatenate possible multi-line data
              const dataPayload = dataLines
                .map(l => l.slice(5).trimStart())
                .join('\n');

              try {
                const data = JSON.parse(dataPayload);

                if (data.type === 'chunk') {
                  setStatus(prev => ({
                    ...prev,
                    liveText: prev.liveText + (data.content || '')
                  }));
                  resetTimeout();
                } else if (data.type === 'complete') {
                  clearTimeout(timeoutRef.current!);
                  setStatus(prev => ({
                    ...prev,
                    status: 'completed',
                    generationId: Date.now().toString(),
                    totalTime: Date.now() - startTimeRef.current
                  }));
                  return;
                } else if (data.type === 'error') {
                  clearTimeout(timeoutRef.current!);
                  setStatus(prev => ({
                    ...prev,
                    status: 'error',
                    error: data.message || 'Generation failed'
                  }));
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }

          // Flush any remaining buffered event on stream end
          if (buffer.trim()) {
            try {
              const lines = buffer.split('\n').filter(l => l.trim() && !l.startsWith(':'));
              const dataLines = lines.filter(l => l.startsWith('data:'));
              if (dataLines.length) {
                const dataPayload = dataLines.map(l => l.slice(5).trimStart()).join('\n');
                const data = JSON.parse(dataPayload);
                if (data.type === 'chunk' && data.content) {
                  setStatus(prev => ({ ...prev, liveText: prev.liveText + data.content }));
                  resetTimeout();
                } else if (data.type === 'complete') {
                  clearTimeout(timeoutRef.current!);
                  setStatus(prev => ({
                    ...prev,
                    status: 'completed',
                    generationId: Date.now().toString(),
                    totalTime: Date.now() - startTimeRef.current
                  }));
                } else if (data.type === 'error') {
                  clearTimeout(timeoutRef.current!);
                  setStatus(prev => ({ ...prev, status: 'error', error: data.message || 'Generation failed' }));
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse trailing SSE data:', parseError);
            }
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

  // 当页面隐藏/卸载时立即中止（移动端后台/标签切换优化）
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
        return 'Connecting to AI service...';
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

      {/* Generation Parameters */}
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

      {/* Live Generation Output */}
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
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {status.liveText}
                  {status.status === 'generating' && (
                    <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse" />
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

      {/* Action Buttons */}
      {status.status === 'completed' && (
        <div className="mt-6 flex gap-4 justify-center">
          <Button 
            onClick={() => router.push(`/generate/result/${status.generationId}`)}
            className="min-w-[120px]"
          >
            View Details
          </Button>
          <Button 
            onClick={() => router.push('/generate')}
            variant="outline"
          >
            Generate New
          </Button>
        </div>
      )}

      {/* Active CPU Optimization Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Active CPU Optimization</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Concurrent generation limit: 1 per user</li>
          <li>• Parameter deduplication: 2-hour cache</li>
          <li>• First chunk timeout: 45 seconds</li>
          <li>• Total soft timeout: 3 minutes</li>
          <li>• Periodic heartbeat to keep connection alive</li>
        </ul>
      </div>
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
