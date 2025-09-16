'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useTrial } from '@/lib/hooks/use-trial';
import { Profile } from '@/lib/types';
import { 
  ArrowUpTrayIcon,
  PencilIcon,
  ClockIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { LoadingButton } from '@/components/ui/loading';

export default function EditPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isInTrial } = useTrial();
  const [lyrics, setLyrics] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [rewriteRequest, setRewriteRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const router = useRouter();

  // 公开可访问：不在进入页面时做鉴权或跳转；仅在执行受限操作时检查权限。
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLyrics(content);
        toast.success('Lyrics loaded successfully');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a .txt file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLyrics(content);
        toast.success('Lyrics loaded successfully');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a .txt file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleRewrite = async () => {
    if (!selectedText.trim()) {
      toast.error('Please select some text to rewrite');
      return;
    }

    if (!rewriteRequest.trim()) {
      toast.error('Please provide rewrite instructions');
      return;
    }

    if (rewriteRequest.trim().length > 500) {
      toast.error('Rewrite instructions must be 500 characters or less');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use the rewrite feature');
      router.push('/auth/signin');
      return;
    }

    if (!profile || (profile.status !== 'active' && !isInTrial)) {
      toast.error('Premium or trial membership required');
      router.push('/pricing');
      return;
    }

    setIsRewriting(true);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalLyrics: lyrics,
          selectedText: selectedText,
          rewriteRequest: rewriteRequest
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rewrite lyrics');
      }

      // Replace selected text with rewritten version
      const newLyrics = lyrics.replace(selectedText, data.rewrittenLyrics);
      setLyrics(newLyrics);
      setSelectedText('');
      setRewriteRequest('');
      
      toast.success(`Lyrics rewritten! ${data.remainingRewrites} rewrites remaining today.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to rewrite lyrics');
    } finally {
      setIsRewriting(false);
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
    if (!lyrics.trim()) {
      toast.error('No lyrics to download');
      return;
    }

    const blob = new Blob([lyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-lyrics-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Lyrics downloaded');
  };

  const handleCopy = async () => {
    if (!lyrics.trim()) {
      toast.error('No lyrics to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(lyrics);
      toast.success('Lyrics copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy lyrics');
    }
  };

  // Allow access without login, but require auth for premium features

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full text-purple-800 text-sm font-medium mb-6">
              <PencilIcon className="w-4 h-4 mr-2" />
              Premium AI Lyrics Editor
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              AI Lyrics Editor
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
              Edit and refine your lyrics with advanced AI assistance. Upload, edit, and perfect your songs with professional tools.
            </p>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/generate"
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate Lyrics
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Lyrics</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Copy"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Download"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {!lyrics ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors"
                  >
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload or paste your lyrics
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop a .txt file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      onMouseUp={handleTextSelection}
                      onKeyUp={handleTextSelection}
                      className="w-full h-96 p-6 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-base text-gray-900 bg-gray-50/50 shadow-inner selection:bg-blue-200 selection:text-blue-900"
                      placeholder="Your lyrics will appear here..."
                    />
                    {lyrics && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-600 border border-gray-200">
                        馃挕 Select text to rewrite with AI
                      </div>
                    )}
                  </div>
                )}

                {lyrics && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setLyrics('')}
                      className="text-gray-600 hover:text-red-600 transition-colors"
                    >
                      Clear lyrics
                    </button>
                  </div>
                )}
              </div>

              {/* Audio Preview */}
              {profile && profile.status === 'active' && (
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Audio Preview
                  </h3>
                  
                  {!audioUrl ? (
                    <div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer"
                      >
                        <span className="text-gray-600">
                          Upload an audio file to preview with your lyrics
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <audio controls className="w-full mb-4">
                        <source src={audioUrl} type={audioFile?.type} />
                        Your browser does not support the audio element.
                      </audio>
                      <button
                        onClick={() => {
                          setAudioFile(null);
                          setAudioUrl(null);
                        }}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove audio
                      </button>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Audio files are only stored temporarily in your browser and are not uploaded to our servers.
                  </p>
                </div>
              )}
            </div>

            {/* AI Rewrite Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
                  AI Rewrite
                </h3>

                {selectedText ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Text:
                    </label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-blue-800">"{selectedText}"</span>
                        <button
                          onClick={() => setSelectedText('')}
                          className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                          title="Clear selection"
                        >
                          鉁?                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            How to use AI Rewrite:
                          </h4>
                          <ol className="text-xs text-gray-600 space-y-1">
                            <li>1. <strong>Select text</strong> in the lyrics editor above</li>
                            <li>2. <strong>Describe</strong> how you want it changed</li>
                            <li>3. <strong>Click Rewrite</strong> to get AI suggestions</li>
                          </ol>
                          <p className="text-sm text-blue-600 mt-2 font-medium">
                            馃挕 Try selecting a verse, chorus, or specific lines
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rewrite Instructions:
                  </label>
                  <textarea
                    value={rewriteRequest}
                    onChange={(e) => setRewriteRequest(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder-gray-500"
                    placeholder="e.g., Make it more emotional, change the rhyme scheme, simplify the language..."
                  />
                </div>

                <LoadingButton
                  onClick={handleRewrite}
                  isLoading={isRewriting}
                  disabled={!selectedText || !rewriteRequest.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {isRewriting ? 'Rewriting...' : selectedText ? 'Rewrite Selected Text' : 'Select Text First'}
                </LoadingButton>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Daily rewrite limit:</span>
                    <span className="font-medium text-gray-700">{profile?.rewrite_count || 0}/30</span>
                  </div>
                  
                  {!selectedText && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        <strong>Quick tips:</strong>
                      </p>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                        <li>鈥?Highlight a verse or chorus</li>
                        <li>鈥?Select problematic lines</li>
                        <li>鈥?Choose specific phrases to improve</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/generate')}
                    className="w-full text-left text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    鈫?Generate new lyrics
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-left text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    鈫?View your lyrics history
                  </button>
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="w-full text-left text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    鈫?Upgrade subscription
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              馃敀 Your lyrics and audio files are processed securely and are not permanently stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 注意：本页为 Client Component，不导出 revalidate/dynamic 段配置。
