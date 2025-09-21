'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NAVIGATION_ITEMS, BLOG_CATEGORIES } from '@/lib/constants';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  SparklesIcon,
  PencilIcon,
  LanguageIcon,
  StarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useOptionalAuth } from '@/lib/contexts/auth-context';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isGenerateDropdownOpen, setIsGenerateDropdownOpen] = useState(false);
  const router = useRouter();
  const auth = useOptionalAuth();
  const user = auth?.user || null;
  const profile = auth?.profile || null;
  const signOut = auth?.signOut || (async () => {});
  const isInTrial = !!(profile?.trial_end_date && new Date(profile.trial_end_date) > new Date() && profile?.status !== 'active');

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // 从profile中获取订阅状态
  const isPro = profile?.status === 'active';
  const isFree = !isPro;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" prefetch={false} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Lyrics Generator
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {NAVIGATION_ITEMS.map((item) => {
                if (item.name === 'Generate') {
                  return (
                    <div key={item.name} className="relative">
                      <div
                        onMouseEnter={() => setIsGenerateDropdownOpen(true)}
                        onMouseLeave={() => setIsGenerateDropdownOpen(false)}
                      >
                        <Link
                          href="/generate"
                          prefetch={false}
                          className="text-gray-700 hover:text-blue-600 px-4 py-3 text-base font-medium flex items-center"
                        >
                          {item.name}
                          <ChevronDownIcon className="ml-1 h-4 w-4" />
                        </Link>
                        {isGenerateDropdownOpen && (
                          <div className="absolute left-0 mt-0 w-52 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50">
                            <div className="py-3">
                              <Link
                                href="/generate"
                                prefetch={false}
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <SparklesIcon className="w-4 h-4 mr-3 text-blue-500" />
                                Generate Lyrics
                              </Link>
                              <Link
                                href="/edit"
                                prefetch={false}
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <PencilIcon className="w-4 h-4 mr-3 text-purple-500" />
                                Polish Lyrics
                              </Link>
                              <Link
                                href="/dashboard"
                                prefetch={false}
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <LanguageIcon className="w-4 h-4 mr-3 text-indigo-500" />
                                Dashboard
                              </Link>
                              <Link
                                href="/personal-style"
                                prefetch={false}
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <StarIcon className="w-4 h-4 mr-3 text-green-500" />
                                Personal Style
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (item.name === 'Blog') {
                  return (
                    <div key={item.name} className="relative">
                      <div
                        onMouseEnter={() => setIsBlogDropdownOpen(true)}
                        onMouseLeave={() => setIsBlogDropdownOpen(false)}
                      >
                        <Link
                          href="/blog"
                          className="text-gray-700 hover:text-blue-600 px-4 py-3 text-base font-medium flex items-center"
                        >
                          {item.name}
                          <ChevronDownIcon className="ml-1 h-4 w-4" />
                        </Link>
                        {isBlogDropdownOpen && (
                          <div className="absolute left-0 mt-0 w-60 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50">
                            <div className="py-3">
                              <Link
                                href="/blog"
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 rounded-lg mx-2 font-medium"
                              >
                                📚 All Articles
                              </Link>
                              <div className="border-t border-gray-100 my-2 mx-4"></div>
                              {BLOG_CATEGORIES.map((category) => (
                                <Link
                                  key={category.slug}
                                  href={`/blog/category/${category.slug}`}
                                  className="block px-4 py-2 text-sm text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-800 transition-all duration-200 rounded-lg mx-2"
                                >
                                  {category.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 px-4 py-3 text-base font-medium"
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Subscription Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPro ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                        <StarIcon className="w-3.5 h-3.5" />
                        <span>PRO</span>
                      </div>
                    ) : isInTrial ? (
                      <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>TRIAL</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>FREE</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Account Button */}
                  <Link
                    href="/account"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer flex items-center gap-2"
                  >
                    <span>Account</span>
                    {user.email && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.email.split('@')[0]}</span>
                    )}
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 cursor-pointer"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Generate Tools for Mobile */}
            <div className="pl-4">
              <div className="text-gray-500 text-sm font-medium mb-2">Tools</div>
              <Link
                href="/edit"
                prefetch={false}
                className="flex items-center text-gray-600 hover:text-purple-600 px-3 py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <PencilIcon className="w-4 h-4 mr-2 text-purple-500" />
                Polish Lyrics
              </Link>
              <Link
                href="/dashboard"
                prefetch={false}
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <LanguageIcon className="w-4 h-4 mr-2 text-indigo-500" />
                Dashboard
              </Link>
              <Link
                href="/personal-style"
                prefetch={false}
                className="flex items-center text-gray-600 hover:text-green-600 px-3 py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <StarIcon className="w-4 h-4 mr-2 text-green-500" />
                Personal Style
              </Link>
            </div>

            {/* Mobile: keep blog simple; no categories list */}

            {/* User actions for mobile */}
            <div className="border-t border-gray-200 pt-4">
              {user ? (
                <div className="space-y-2">
                  {/* Subscription Status Badge */}
                  <div className="px-3">
                    {isPro ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-md w-fit">
                        <StarIcon className="w-4 h-4" />
                        <span>PRO MEMBER</span>
                      </div>
                    ) : isInTrial ? (
                      <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-2 rounded-full text-sm font-medium w-fit">
                        <UserIcon className="w-4 h-4" />
                        <span>TRIAL MEMBER</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm font-medium w-fit">
                        <UserIcon className="w-4 h-4" />
                        <span>FREE MEMBER</span>
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href="/account"
                    prefetch={false}
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white block px-3 py-2 text-base font-medium w-full text-center rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                  >
                    Account
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white block px-3 py-2 text-base font-medium w-full text-center rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer"
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
