'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useData } from '@/lib/contexts/data-context';
import { useTrial } from '@/lib/hooks/use-trial';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  MusicalNoteIcon,
  HeartIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLyrics?: boolean;
}

interface GenerationResult {
  lyrics: string;
  generationId: string | null;
  isFavorited: boolean;
}

const SUGGESTION_PROMPTS = [
  { label: 'Rap verse about overcoming obstacles', prompt: 'Write a rap verse about overcoming obstacles and staying true to yourself. Make it punchy with internal rhymes.' },
  { label: 'Pop love song chorus', prompt: 'Write a catchy pop love song chorus about finding the right person at the wrong time.' },
  { label: 'Rock ballad about freedom', prompt: 'Write a rock ballad verse about breaking free from expectations and finding your own path.' },
  { label: 'R&B late-night vibes', prompt: 'Write an R&B song about late-night thoughts and memories. Smooth and soulful.' },
  { label: 'Folk song about journey', prompt: 'Write a folk song about a long journey home. Include vivid imagery of nature and roads.' },
  { label: 'Hip-hop hook with energy', prompt: 'Write a high-energy hip-hop hook about success and celebration. Make it memorable.' },
];

function GenerateAgentPage() {
  const { user, loading: userLoading, bumpProfileCounts } = useAuth();
  const { isActiveUser } = useTrial();
  const { personalStyles, fetchPersonalStyles } = useData();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPersonalStyleId, setSelectedPersonalStyleId] = useState<number | undefined>();
  const [useProModel, setUseProModel] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user && isActiveUser && showSettings) fetchPersonalStyles(false);
  }, [user, isActiveUser, showSettings, fetchPersonalStyles]);

  const addMessage = (role: 'user' | 'assistant', content: string, isLyrics = false) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      timestamp: new Date(),
      isLyrics,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleSend = async (customPrompt?: string) => {
    const prompt = customPrompt || inputValue.trim();
    if (!prompt || isGenerating) return;

    if (!user) {
      toast.error('Please sign in to generate lyrics');
      router.push('/auth/signin?returnTo=/generate');
      return;
    }

    if (useProModel && !isActiveUser) {
      toast.error('Pro model requires a premium subscription');
      return;
    }

    addMessage('user', prompt);
    setInputValue('');
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const allMessages = [...messages, { role: 'user' as const, content: prompt }].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const payload: Record<string, any> = {
        messages: allMessages,
        modelType: useProModel ? 'pro' : 'basic',
      };
      if (selectedPersonalStyleId) payload.personalStyleId = selectedPersonalStyleId;

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const assistantMsg = addMessage('assistant', '');
      let fullLyrics = '';
      let generationId: string | null = null;

      timeoutRef.current = setTimeout(() => {
        toast.error('Generation timed out');
        setIsGenerating(false);
        try { controller.abort(); } catch {}
      }, 120000);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          toast.error('Generation timed out');
          setIsGenerating(false);
          try { controller.abort(); } catch {}
        }, 120000);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ') && !line.startsWith(':')) continue;
            if (line.startsWith(':')) continue;

            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'chunk') {
                fullLyrics += data.content || '';
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullLyrics, isLyrics: true } : m
                ));
                resetTimeout();
              } else if (data.type === 'complete') {
                generationId = data.id ? String(data.id) : null;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Generation failed');
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== 'Generation failed') {
                continue;
              }
              throw parseError;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (fullLyrics) {
        setGenerationResult({ lyrics: fullLyrics, generationId, isFavorited: false });
        try { bumpProfileCounts({ generation: 1 }); } catch {}
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Generation failed');
      }
    } finally {
      setIsGenerating(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, -1));
      setGenerationResult(null);
      setTimeout(() => handleSend(lastUserMsg.content), 100);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyrics-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  const handleToggleFavorite = async () => {
    if (!user || !generationResult?.generationId) return;
    setIsTogglingFavorite(true);
    try {
      const next = !generationResult.isFavorited;
      const res = await fetch(`/api/generations/${generationResult.generationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorited: next }),
      });
      if (!res.ok) throw new Error('Failed to update favorite');
      setGenerationResult(prev => prev ? { ...prev, isFavorited: next } : null);
      toast.success(next ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-14">
      {!user && (
        <div className="border-b border-white/5 bg-violet-600/5">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                Free Trial
              </span>
              <p className="text-sm text-zinc-300 mt-1">Sign up for a 3-day free trial. No credit card required.</p>
            </div>
            <Link
              href="/auth/signin?signup=1&returnTo=/generate"
              prefetch={false}
              className="text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-md transition-colors shrink-0"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6">
        {/* Settings bar */}
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <CpuChipIcon className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium text-zinc-400">Agent</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <select
              value={useProModel ? 'pro' : 'basic'}
              onChange={(e) => {
                const isPro = e.target.value === 'pro';
                if (isPro && !isActiveUser) {
                  toast.error('Pro model requires premium subscription');
                  return;
                }
                setUseProModel(isPro);
              }}
              className="text-[11px] text-zinc-500 bg-transparent border border-white/10 rounded px-2 py-1 hover:border-white/20 transition-colors cursor-pointer"
            >
              <option value="basic">Flash</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {user && isActiveUser && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${showSettings ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-400'}`}
              >
                <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <Link
              href="/edit"
              prefetch={false}
              className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-400 transition-colors flex items-center gap-1"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              Editor
            </Link>
          </div>
        </div>

        {/* Personal Style */}
        {showSettings && user && isActiveUser && (
          <div className="border-b border-white/5 px-4 py-3 bg-white/[0.02]">
            <label className="text-[11px] font-medium text-zinc-500 mb-1.5 block">Personal Style</label>
            <select
              value={selectedPersonalStyleId || ''}
              onChange={(e) => setSelectedPersonalStyleId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full text-xs text-zinc-400 border border-white/10 rounded-md px-3 py-2 bg-transparent"
            >
              <option value="">None</option>
              {personalStyles.map((ps: any) => (
                <option key={ps.id} value={ps.id}>{ps.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-2">What kind of lyrics do you want?</h2>
              <p className="text-sm text-zinc-500 mb-10 max-w-md">
                Describe your song — genre, mood, theme, language, or just a feeling.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {SUGGESTION_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.prompt)}
                    disabled={isGenerating}
                    className="px-4 py-3 bg-white/[0.03] border border-white/5 rounded-lg text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="text-xs text-zinc-400 font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[75%] bg-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : msg.isLyrics ? (
                <div className="max-w-[85%] w-full rounded-2xl rounded-bl-sm border border-white/5 bg-white/[0.02] overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                    <MusicalNoteIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] font-medium text-zinc-500">Lyrics</span>
                  </div>
                  <div className="p-5">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300 leading-relaxed">{msg.content}</pre>
                    {isGenerating && (
                      <span className="inline-block w-1.5 h-4 align-middle ml-1 bg-violet-400/70 animate-pulse" />
                    )}
                  </div>
                  {!isGenerating && msg.content && (
                    <div className="px-4 py-2 border-t border-white/5 flex items-center gap-1">
                      <button onClick={() => handleCopy(msg.content)} className="p-1.5 text-zinc-600 hover:text-violet-400 transition-colors rounded-md hover:bg-white/5 cursor-pointer" title="Copy">
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownload(msg.content)} className="p-1.5 text-zinc-600 hover:text-emerald-400 transition-colors rounded-md hover:bg-white/5 cursor-pointer" title="Download">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                      </button>
                      {generationResult?.generationId && (
                        <button
                          onClick={handleToggleFavorite}
                          disabled={isTogglingFavorite}
                          className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors rounded-md hover:bg-white/5 cursor-pointer"
                          title={generationResult.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {generationResult.isFavorited ? (
                            <HeartIconSolid className="w-4 h-4 text-rose-400" />
                          ) : (
                            <HeartIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button onClick={handleRegenerate} className="p-1.5 text-zinc-600 hover:text-cyan-400 transition-colors rounded-md hover:bg-white/5 cursor-pointer" title="Regenerate">
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[75%] bg-white/[0.04] text-zinc-300 px-4 py-2.5 rounded-2xl rounded-bl-sm border border-white/5">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              )}
            </div>
          ))}

          {isGenerating && !messages.some(m => m.isLyrics && m.role === 'assistant') && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] px-4 py-3 rounded-2xl rounded-bl-sm border border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the lyrics you want..."
                rows={1}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none transition-colors"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '44px';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="shrink-0 w-11 h-11 flex items-center justify-center bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl transition-colors cursor-pointer"
              >
                <StopCircleIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="shrink-0 w-11 h-11 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-zinc-600 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-700 mt-2 text-center">
            AI-generated content may vary. Review before use.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GenerateAgentPage;
