'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingButton } from '@/components/ui/loading';
import { validateEmail } from '@/lib/utils';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';

function SignInContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');
  const signup = searchParams.get('signup');
  
  return <SignInForm returnTo={returnTo} initialError={{ error, reason }} initialMode={signup ? 'signup' : 'signin'} />;
}

function SignInForm({ returnTo, initialError, initialMode }: { returnTo: string | null; initialError: { error: string | null; reason: string | null }, initialMode?: 'signup' | 'signin' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (initialError?.error) {
      const map: Record<string, string> = {
        auth_failed: 'Authentication failed. Please try again.',
        missing_code: 'Missing auth code. Please try again.',
        unexpected_error: 'Unexpected error. Please try again.'
      };
      const display = map[initialError.error] || 'Sign in failed. Please try again.';
      setErrors({ general: display });
      if (initialError.reason) {
        console.warn('[Auth Callback] reason=', decodeURIComponent(initialError.reason));
      }
    }
  }, [initialError]);

  const clearErrors = () => {
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && password !== confirmPassword) {
      newErrors.password = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setRegistrationSuccess(false);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    let timeoutId: any;
    const startTimeoutGuard = () => {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setErrors({ general: 'Sign in is taking too long. Please try again.' });
        toast.error('Sign in timeout. Please retry.');
      }, 15000);
    };

    try {
      startTimeoutGuard();

      if (isSignUp) {
        if (!supabase) {
          setErrors({ general: 'Service unavailable' });
          return;
        }
        const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${siteOrigin}/auth/callback`,
          },
        });
        if (error) {
          setErrors({ general: error.message });
        } else {
          setRegistrationSuccess(true);
          setPassword('');
          toast.success('Registration successful. Please check your email for a confirmation link.');
        }
      } else {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (!res.ok || result?.success === false) {
          setErrors({ general: result?.error || 'Sign in failed' });
        } else {
          toast.success('Signed in successfully');
          window.location.href = returnTo ? decodeURIComponent(returnTo) : '/';
        }
      }
    } catch (error: any) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      console.error('[SignIn] unexpected error:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    clearErrors();
    
    if (!supabase) {
      setErrors({ general: 'Service unavailable' });
      setIsGoogleLoading(false);
      return;
    }
    
    try {
      const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteOrigin}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        setErrors({ general: error.message });
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      try {
        console.error('[Auth] Google sign-in unexpected error', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        });
      } catch {}
      setErrors({ general: 'Google sign-in failed. Please try again.' });
      console.error('[GoogleSignIn] unexpected error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    clearErrors();

    if (!supabase) {
      setErrors({ general: 'Service unavailable' });
      setIsLoading(false);
      return;
    }

    try {
      const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${siteOrigin}/auth/callback` },
      });
      if (error) {
        setErrors({ general: error.message });
      } else {
        toast.success('Confirmation email sent. You can resend if needed.');
        setRegistrationSuccess(true);
      }
    } catch (error: any) {
      setErrors({ general: 'Failed to resend confirmation email. Please try again.' });
      console.error('[ResendConfirmation] unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearErrors();
    setRegistrationSuccess(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen noise-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="max-w-md mx-auto mt-8">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] py-8 px-6 shadow-2xl shadow-black/40">
            {registrationSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Check Your Email
                </h1>
                <div className="rounded-lg border border-violet-500/20 bg-violet-600/5 p-4 mb-6">
                  <p className="text-zinc-400 mb-3">
                    We&apos;ve sent a confirmation link to:
                  </p>
                  <p className="font-semibold text-violet-400 text-lg mb-3">{email}</p>
                  <div className="text-sm text-zinc-500 space-y-2">
                    <p className="text-zinc-300 font-medium">Next steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the confirmation link in the email</li>
                      <li>Return here to sign in</li>
                    </ol>
                  </div>
                </div>
                
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
                  <p className="text-sm text-amber-400">
                    <strong className="text-amber-300">Important:</strong> The confirmation link expires in <strong>24 hours</strong>. If you don&apos;t see the email within 5 minutes, check your spam folder or click &ldquo;Resend Email&rdquo; below.
                  </p>
                </div>

                <div className="space-y-3">
                  <LoadingButton
                    onClick={resendConfirmation}
                    isLoading={isLoading}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-500 focus:outline-none font-medium cursor-pointer transition-colors"
                  >
                    Resend Confirmation Email
                  </LoadingButton>
                  
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setIsSignUp(false);
                    }}
                    className="w-full bg-violet-600 text-white py-2 px-4 rounded-lg hover:bg-violet-500 focus:outline-none font-medium cursor-pointer transition-colors"
                  >
                    Continue to Sign In
                  </button>
                  
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setEmail('');
                    }}
                    className="w-full bg-white/5 text-zinc-400 py-2 px-4 rounded-lg hover:bg-white/10 hover:text-white focus:outline-none font-medium cursor-pointer transition-colors"
                  >
                    Use Different Email
                  </button>
                </div>

                <div className="mt-6 text-xs text-zinc-600">
                  <p>Tip: Add our email to your contacts to ensure delivery</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </h1>
                  <p className="mt-2 text-zinc-500">
                    {isSignUp 
                      ? 'Start creating amazing lyrics today' 
                      : 'Welcome back to Lyrica'
                    }
                  </p>
                  <div className="mt-3 inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm">
                    3-day free trial · No credit card required
                  </div>
                </div>

                {errors.general && (
                  <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-400">{errors.general}</p>
                        {(errors.general.includes('already registered') || errors.general.includes('not be confirmed')) && (
                          <button
                            onClick={resendConfirmation}
                            disabled={isLoading || !email}
                            className="mt-2 text-sm text-violet-400 hover:text-violet-300 font-medium disabled:text-zinc-600 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Resend Confirmation Email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={`block w-full px-4 py-3 text-white border rounded-lg bg-white/[0.03] focus:outline-none text-base placeholder-zinc-600 transition-colors ${
                        errors.email 
                          ? 'border-red-500/40 focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40' 
                          : 'border-white/10 focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors(prev => ({ ...prev, password: undefined }));
                          }
                        }}
                        className={`block w-full px-4 py-3 pr-12 text-white border rounded-lg bg-white/[0.03] focus:outline-none text-base placeholder-zinc-600 transition-colors ${
                          errors.password 
                            ? 'border-red-500/40 focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40' 
                            : 'border-white/10 focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40'
                        }`}
                        placeholder="Enter your password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-zinc-600 hover:text-zinc-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
                    )}
                    {isSignUp && !errors.password && (
                      <p className="mt-1.5 text-sm text-zinc-600">
                        Password must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  {isSignUp && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`block w-full px-4 py-3 text-white border rounded-lg bg-white/[0.03] focus:outline-none text-base placeholder-zinc-600 transition-colors ${
                          errors.password 
                            ? 'border-red-500/40 focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40' 
                            : 'border-white/10 focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40'
                        }`}
                        placeholder="Re-enter your password"
                        minLength={6}
                      />
                    </div>
                  )}

                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-500 focus:outline-none font-medium cursor-pointer transition-colors shadow-lg shadow-violet-600/20"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </LoadingButton>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-[#0d0d0f] text-zinc-600">Or continue with</span>
                    </div>
                  </div>

                  <LoadingButton
                    onClick={handleGoogleSignIn}
                    isLoading={isGoogleLoading}
                    className="mt-3 w-full bg-white/5 border border-white/10 text-zinc-300 py-3 px-4 rounded-lg hover:bg-white/10 hover:text-white focus:outline-none font-medium flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </LoadingButton>
                </div>

                {!isSignUp && (
                  <div className="mt-4 text-center space-y-2">
                    <div>
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <div>
                      <button
                        onClick={resendConfirmation}
                        disabled={isLoading || !email}
                        className="text-sm text-zinc-600 hover:text-zinc-400 disabled:text-zinc-700 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        Resend confirmation email
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <button
                    onClick={toggleMode}
                    className="text-violet-400 hover:text-violet-300 font-medium cursor-pointer transition-colors"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen noise-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
              <p className="mt-2 text-zinc-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
