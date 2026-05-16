'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { LoadingButton } from '@/components/ui/loading';
import { useAuth } from '@/lib/contexts/auth-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { SparklesIcon, ClockIcon, PencilIcon, ClipboardDocumentIcon, DocumentArrowDownIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function EditPage() {
  const { user, profile } = useAuth();
  const { isInTrial } = useTrial();
  const router = useRouter();

  const [lyrics, setLyrics] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [rewriteRequest, setRewriteRequest] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTextSelection = () => {
    try {
      const sel = window.getSelection();
      const text = sel ? sel.toString() : '';
      setSelectedText(text.trim());
    } catch {}
  };

  const handleCopy = async () => {
    if (!lyrics.trim()) return toast.error('No lyrics to copy');
    try { await navigator.clipboard.writeText(lyrics); toast.success('Lyrics copied'); } catch { toast.error('Copy failed'); }
  };

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) || '';
        setLyrics(content);
        toast.success('Lyrics loaded successfully');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a .txt file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) || '';
        setLyrics(content);
        toast.success('Lyrics loaded successfully');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please drop a .txt file');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      toast.success('Audio file loaded');
    } else {
      toast.error('Please upload an audio file');
    }
  };

  const handleDownload = () => {
    if (!lyrics.trim()) return toast.error('No lyrics to download');
    const blob = new Blob([lyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-lyrics-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Lyrics downloaded');
  };

  const handleRewrite = async () => {
    if (!selectedText.trim()) return toast.error('Please select some text to rewrite');
    if (!rewriteRequest.trim()) return toast.error('Please provide rewrite instructions');
    if (!user) { toast.error('Please sign in to use the rewrite feature'); router.push('/auth/signin'); return; }
    if (!profile || (profile.status !== 'active' && !isInTrial)) { toast.error('Premium or trial membership required'); router.push('/pricing'); return; }

    setIsRewriting(true);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalLyrics: lyrics, selectedText, rewriteRequest })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to rewrite lyrics');
      setLyrics((prev) => prev.replace(selectedText, data.rewrittenLyrics));
      setSelectedText('');
      setRewriteRequest('');
      toast.success('Lyrics rewritten');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to rewrite lyrics');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />

        <div className="mt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-violet-500/10 rounded-full text-violet-400 text-sm font-medium mb-6">
              <PencilIcon className="w-4 h-4 mr-2" />
              Premium AI Lyrics Editor
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-6">
              AI Lyrics Editor
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-6">
              Edit and refine your lyrics with advanced AI assistance. Upload, edit, and perfect your songs with professional tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/generate" className="inline-flex items-center px-4 py-2 bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors cursor-pointer">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate Lyrics
              </Link>
              <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <ClockIcon className="w-4 h-4 mr-2" />
                View History
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl shadow-black/40">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Lyrics</h2>
                  <div className="flex space-x-2">
                    <button onClick={handleCopy} className="p-2 text-zinc-500 hover:text-violet-400 transition-colors cursor-pointer" title="Copy">
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                    <button onClick={handleDownload} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer" title="Download">
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {!lyrics ? (
                  <div
                    className="border-2 border-dashed border-white/10 rounded-lg p-12 text-center hover:border-violet-500/40 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <DocumentArrowUpIcon className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Upload or paste your lyrics</h3>
                    <p className="text-zinc-500 mb-4">Drag and drop a .txt file here, or click to browse</p>
                    <input ref={fileInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleTextFileUpload} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-500 cursor-pointer"
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <textarea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        onMouseUp={handleTextSelection}
                        onKeyUp={handleTextSelection}
                        className="w-full h-96 p-6 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 font-mono text-base text-white bg-white/[0.03] shadow-inner selection:bg-violet-500/30 selection:text-white placeholder-zinc-600 transition-colors"
                        placeholder="Your lyrics will appear here..."
                      />
                      <div className="absolute top-2 right-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-zinc-500 border border-white/5">
                        Tip: Select text to rewrite with AI
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <button onClick={() => setLyrics('')} className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer">Clear lyrics</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-violet-400" />
                  AI Rewrite
                </h3>

                {selectedText ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Selected Text:</label>
                    <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-md text-sm max-h-40 overflow-auto">
                      <div className="flex justify-between items-start gap-3">
                        <div className="text-violet-300 whitespace-pre-wrap break-words">"{selectedText}"</div>
                        <button onClick={() => setSelectedText('')} className="text-violet-400 hover:text-violet-300 flex-shrink-0 cursor-pointer">Clear</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-xs text-zinc-600">Tip: Highlight a verse/chorus or lines to rewrite</div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Rewrite Instructions:</label>
                  <textarea
                    value={rewriteRequest}
                    onChange={(e) => setRewriteRequest(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 text-sm text-white bg-white/[0.03] placeholder-zinc-600 transition-colors"
                    placeholder="e.g., Make it more emotional; change the rhyme scheme; simplify the language; punchier chorus"
                  />
                </div>

                <LoadingButton
                  onClick={handleRewrite}
                  isLoading={isRewriting}
                  disabled={!selectedText || !rewriteRequest.trim()}
                  className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-500 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-violet-600/20"
                >
                  {isRewriting ? 'Rewriting...' : selectedText ? 'Rewrite Selected Text' : 'Select Text First'}
                </LoadingButton>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600">Daily rewrite limit:</span>
                    <span className="font-medium text-zinc-400">{profile?.rewrite_count || 0}/30</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mt-6">
                <h4 className="font-medium text-white mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button onClick={() => router.push('/generate')} className="w-full text-left text-violet-400 hover:text-violet-300 transition-colors">- Generate new lyrics</button>
                  <button onClick={() => router.push('/dashboard')} className="w-full text-left text-violet-400 hover:text-violet-300 transition-colors">- View your lyrics history</button>
                  <button onClick={() => router.push('/pricing')} className="w-full text-left text-violet-400 hover:text-violet-300 transition-colors">- Upgrade subscription</button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 mt-6 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold text-white mb-4">Audio Preview</h3>
            {!audioUrl ? (
              <div>
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" id="audio-upload" />
                <label htmlFor="audio-upload" className="block w-full p-4 border-2 border-dashed border-white/10 rounded-lg text-center hover:border-violet-500/40 transition-colors cursor-pointer">
                  <span className="text-zinc-500">Upload an audio file to preview with your lyrics</span>
                </label>
              </div>
            ) : (
              <div>
                <audio controls className="w-full mb-4">
                  <source src={audioUrl} type={audioFile?.type} />
                  Your browser does not support the audio element.
                </audio>
                <button onClick={() => { setAudioFile(null); setAudioUrl(null); }} className="text-red-400 hover:text-red-300 transition-colors">Remove audio</button>
              </div>
            )}
            <p className="text-sm text-zinc-600 mt-2">Audio files are only stored temporarily in your browser and are not uploaded to our servers.</p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-600">Your lyrics are processed securely and are not permanently stored on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
