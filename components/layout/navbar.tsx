'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { NAVIGATION_ITEMS, BLOG_CATEGORIES } from '@/lib/constants';
import { Profile } from '@/lib/types';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  SparklesIcon,
  PencilIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isGenerateDropdownOpen, setIsGenerateDropdownOpen] = useState(false);
  const router = useRouter();

  // 优化profile获取逻辑
  useEffect(() => {
    if (user && !loading) {
      setProfileLoading(true);
      
      // 先尝试本地缓存
      const cached = localStorage.getItem('profile_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.id === user.id) {
            setProfile(parsed as Profile);
            setProfileLoading(false);
            return; // 使用缓存，不需要再请求
          } else {
            localStorage.removeItem('profile_cache');
          }
        } catch {
          localStorage.removeItem('profile_cache');
        }
      }

      // 获取最新profile
      const refreshProfile = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            const prof = data?.profile || data;
            if (prof?.id) {
              setProfile(prof as Profile);
              localStorage.setItem('profile_cache', JSON.stringify(prof));
            }
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        } finally {
          setProfileLoading(false);
        }
      };
      
      refreshProfile();
    } else if (!user) {
      // 未登录时清除缓存和状态
      setProfile(null);
      setProfileLoading(false);
      localStorage.removeItem('profile_cache');
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    // 退出登录时清理本地缓存
    localStorage.removeItem('profile_cache');
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const getUserStatusDisplay = () => {
    if (!profile) return '';
    
    if (profile.status === 'free') {
      return '(Free)';
    } else if (profile.status === 'active') {
      return '(Premium Member)';
    }
    return '';
  };

  // 优化loading状态判断
  const isNavbarLoading = loading || (user && profileLoading);

  // 如果还在加载认证状态，显示加载状态
  if (isNavbarLoading) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
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
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
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
                          className="text-gray-700 hover:text-blue-600 px-4 py-3 text-base font-medium flex items-center"
                        >
                          {item.name}
                          <ChevronDownIcon className="ml-1 h-4 w-4" />
                        </Link>
                        
                        {/* Generate Dropdown */}
                        {isGenerateDropdownOpen && (
                          <div className="absolute left-0 mt-0 w-52 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="py-3">
                              <Link
                                href="/generate"
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <SparklesIcon className="w-4 h-4 mr-3 text-blue-500" />
                                Generate Lyrics
                              </Link>
                              <Link
                                href="/edit"
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 rounded-lg mx-2"
                              >
                                <PencilIcon className="w-4 h-4 mr-3 text-purple-500" />
                                Polish Lyrics
                              </Link>
                              {user && (
                                <Link
                                  href="/dashboard"
                                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                                >
                                  <LanguageIcon className="w-4 h-4 mr-3 text-green-500" />
                                  History & Favorites
                                </Link>
                              )}
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
                        
                        {/* Blog Dropdown */}
                        {isBlogDropdownOpen && (
                          <div className="absolute left-0 mt-0 w-60 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
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
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {user.email} {getUserStatusDisplay()}
                  </div>
                  <Link
                    href="/account"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Sign Out
                  </button>
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
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Blog Categories for Mobile */}
            <div className="pl-4">
              <div className="text-gray-500 text-sm font-medium mb-2">Blog Categories</div>
              {BLOG_CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  href={`/blog/category/${category.slug}`}
                  className="text-gray-600 hover:text-blue-600 block px-3 py-1 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            
            {/* User actions for mobile */}
            <div className="border-t border-gray-200 pt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Logged in as: {user.email} {getUserStatusDisplay()}
                  </div>
                  <Link
                    href="/account"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-red-600 block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="bg-blue-600 text-white block px-3 py-2 text-base font-medium w-full text-center rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
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