"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NAVIGATION_ITEMS, BLOG_CATEGORIES } from '@/lib/constants';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useOptionalAuth, hasAuthHintCookie } from '@/lib/contexts/auth-context';
import { useTrial } from '@/lib/hooks/use-trial';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [authHint, setAuthHint] = useState(false);
  const router = useRouter();
  const auth = useOptionalAuth();
  const user = auth?.user || null;
  const profile = auth?.profile || null;
  const loading = !!auth?.loading;
  const { isInTrial: trialHookInTrial } = useTrial();
  const profileDerivedTrial = !!(profile?.trial_end_date && new Date(profile.trial_end_date) > new Date() && profile?.status !== 'active');
  const isInTrial = !!(trialHookInTrial || profileDerivedTrial);
  const isPro = profile?.status === 'active';

  useEffect(() => {
    setMounted(true);
    try { setAuthHint(hasAuthHintCookie()); } catch { setAuthHint(false); }
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" prefetch={false} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <SparklesIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Lyrica
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {NAVIGATION_ITEMS.map((item) => {
              if (item.name === 'Generate') {
                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => setHoveredItem('generate')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      href="/generate"
                      prefetch={false}
                      className="text-zinc-400 hover:text-white px-3 py-1.5 text-[13px] font-medium transition-colors flex items-center gap-1"
                    >
                      {item.name}
                      <ChevronDownIcon className="h-3 w-3" />
                    </Link>
                    {hoveredItem === 'generate' && (
                      <div className="absolute left-0 top-full pt-2">
                        <div className="w-48 py-1.5 rounded-xl glass-strong shadow-2xl">
                          <Link href="/generate" prefetch={false}
                            className="flex items-center px-3.5 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 mr-2.5 text-violet-400" />
                            AI Agent
                          </Link>
                          <Link href="/edit" prefetch={false}
                            className="flex items-center px-3.5 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <PencilIcon className="w-3.5 h-3.5 mr-2.5 text-cyan-400" />
                            Lyrics Editor
                          </Link>
                          <Link href="/dashboard" prefetch={false}
                            className="flex items-center px-3.5 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <SparklesIcon className="w-3.5 h-3.5 mr-2.5 text-amber-400" />
                            Dashboard
                          </Link>
                          <Link href="/personal-style" prefetch={false}
                            className="flex items-center px-3.5 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <StarIcon className="w-3.5 h-3.5 mr-2.5 text-emerald-400" />
                            Personal Style
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (item.name === 'Blog') {
                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => setHoveredItem('blog')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      href="/blog"
                      className="text-zinc-400 hover:text-white px-3 py-1.5 text-[13px] font-medium transition-colors flex items-center gap-1"
                    >
                      {item.name}
                      <ChevronDownIcon className="h-3 w-3" />
                    </Link>
                    {hoveredItem === 'blog' && (
                      <div className="absolute left-0 top-full pt-2">
                        <div className="w-52 py-1.5 rounded-xl glass-strong shadow-2xl">
                          <Link href="/blog"
                            className="flex items-center px-3.5 py-2 text-[13px] font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            All Articles
                          </Link>
                          <div className="h-px bg-white/5 my-1 mx-3" />
                          {BLOG_CATEGORIES.slice(0, 5).map((category) => (
                            <Link key={category.slug} href={`/blog/category/${category.slug}`}
                              className="block px-3.5 py-1.5 text-[13px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-zinc-400 hover:text-white px-3 py-1.5 text-[13px] font-medium transition-colors"
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {(!mounted || (loading && authHint)) ? (
              <div className="h-7 w-20 bg-white/5 rounded-md animate-pulse" />
            ) : user ? (
              <>
                {isPro ? (
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    PRO
                  </span>
                ) : isInTrial ? (
                  <span className="text-[11px] font-medium text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                    TRIAL
                  </span>
                ) : null}
                <Link
                  href="/account"
                  className="text-[13px] font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                >
                  Account
                </Link>
              </>
            ) : (
              <button
                onClick={() => router.push('/auth/signin')}
                className="text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 px-4 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white p-1 cursor-pointer"
          >
            {isMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-0.5">
            {NAVIGATION_ITEMS.map((item) => (
              <Link key={item.name} href={item.href} prefetch={false}
                className="text-zinc-400 hover:text-white block px-3 py-2 text-sm transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-white/5 mt-2 pt-2 space-y-0.5">
              <Link href="/edit" prefetch={false}
                className="flex items-center text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <PencilIcon className="w-3.5 h-3.5 mr-2" /> Lyrics Editor
              </Link>
              <Link href="/dashboard" prefetch={false}
                className="flex items-center text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <SparklesIcon className="w-3.5 h-3.5 mr-2" /> Dashboard
              </Link>
              <Link href="/personal-style" prefetch={false}
                className="flex items-center text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <StarIcon className="w-3.5 h-3.5 mr-2" /> Personal Style
              </Link>
            </div>
            <div className="border-t border-white/5 mt-2 pt-3">
              {(!mounted || (loading && authHint)) ? (
                <div className="h-9 bg-white/5 rounded-md animate-pulse" />
              ) : user ? (
                <Link href="/account" prefetch={false}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-center text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 px-3 py-2.5 rounded-md transition-colors"
                >
                  Account
                </Link>
              ) : (
                <button onClick={() => { router.push('/auth/signin'); setIsMenuOpen(false); }}
                  className="w-full text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 px-3 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
