'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { LoadingButton } from '@/components/ui/loading';
import { validateEmail } from '@/lib/utils';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// 独立的组件来处理 useSearchParams
function SignInContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');
  
  return <SignInForm returnTo={returnTo} initialError={{ error, reason }} />;
}

// 主要的登录表单组件
function SignInForm({ returnTo, initialError }: { returnTo: string | null; initialError: { error: string | null; reason: string | null } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  
  // 创建 Supabase 客户端实例
  const supabase = createClient();

  // 根据回调错误参数给出用户提示，并打印开发者可用信息
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
        // 开发者可在控制台查看详细原因
        console.warn('[Auth Callback] reason=', decodeURIComponent(initialError.reason));
      }
    }
  }, [initialError]);

  // 清除错误信息
  const clearErrors = () => {
    setErrors({});
  };

  // 验证表单
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

    // 超时兜底：避免按钮一直转圈
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
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            setErrors({ 
              general: 'This email is already registered. Try signing in or resend confirmation.' 
            });
          } else if (error.message.includes('weak password')) {
            setErrors({ password: 'Password is too weak. Please use a stronger password.' });
          } else if (error.message.includes('invalid email')) {
            setErrors({ email: 'Please enter a valid email address.' });
          } else {
            setErrors({ general: error.message });
          }
          return;
        }

        if (data.user && !data.user.email_confirmed_at) {
          setRegistrationSuccess(true);
          setPassword('');
          toast.success('Registration request processed! Please check your email for the confirmation link.');
        } else {
          setRegistrationSuccess(true);
          setPassword('');
          toast.success('Registration successful! Please check your email for the confirmation link.');
        }
      } else {
        // 统一使用Supabase认证
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' });
          } else if (error.message.includes('Email not confirmed')) {
            setErrors({ general: 'Please check your email and click the confirmation link before signing in.' });
          } else if (error.message.includes('Too many requests')) {
            setErrors({ general: 'Too many login attempts. Please wait a few minutes and try again.' });
          } else {
            setErrors({ general: error.message });
          }
          return;
        }

        // 登录成功，跳转
        if (returnTo) {
          router.push(decodeURIComponent(returnTo));
        } else {
          router.push('/');
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
    
    try {
      const callbackUrl = returnTo 
        ? `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(returnTo)}`
        : `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl }
      });

      if (error) {
        if (error.message.includes('popup')) {
          setErrors({ general: 'Please allow popups for Google sign-in to work.' });
        } else {
          setErrors({ general: error.message || 'Failed to sign in with Google' });
        }
      }
    } catch (error: any) {
      setErrors({ general: 'Failed to sign in with Google. Please try again.' });
      console.error('[GoogleSignIn] unexpected error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 重新发送确认邮件
  const resendConfirmation = async () => {
    if (!email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    clearErrors();

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        if (error.message.includes('already confirmed')) {
          setErrors({ general: 'This email is already confirmed. Try signing in instead.' });
        } else if (error.message.includes('not found')) {
          setErrors({ general: 'Email not found. Please register first.' });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        toast.success('Confirmation email sent! Please check your inbox.');
        setRegistrationSuccess(true);
      }
    } catch (error: any) {
      setErrors({ general: 'Failed to resend confirmation email. Please try again.' });
      console.error('[ResendConfirmation] unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换注册/登录模式时重置状态
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearErrors();
    setRegistrationSuccess(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            {/* 注册成功状态 */}
            {registrationSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  📧 Check Your Email
                </h1>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 mb-3">
                    We've sent a confirmation link to:
                  </p>
                  <p className="font-semibold text-blue-800 text-lg mb-3">{email}</p>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>📍 <strong>Next steps:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the confirmation link in the email</li>
                      <li>Return here to sign in</li>
                    </ol>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⏰ <strong>Important:</strong> The confirmation link expires in <strong>24 hours</strong>. 
                    If you don't see the email within 5 minutes, check your spam folder or click "Resend Email" below.
                  </p>
                </div>

                <div className="space-y-3">
                  <LoadingButton
                    onClick={resendConfirmation}
                    isLoading={isLoading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium cursor-pointer"
                  >
                    📧 Resend Confirmation Email
                  </LoadingButton>
                  
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setIsSignUp(false);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium cursor-pointer"
                  >
                    Continue to Sign In
                  </button>
                  
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setEmail('');
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium cursor-pointer"
                  >
                    Use Different Email
                  </button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                  <p>💡 Tip: Add our email to your contacts to ensure delivery</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    {isSignUp 
                      ? 'Start creating amazing lyrics today' 
                      : 'Welcome back to AI Lyrics Generator'
                    }
                  </p>
                </div>

                {/* 通用错误信息 */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700">{errors.general}</p>
                        {(errors.general.includes('already registered') || errors.general.includes('not be confirmed')) && (
                          <button
                            onClick={resendConfirmation}
                            disabled={isLoading || !email}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Resend Confirmation Email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                      className={`mt-1 block w-full px-4 py-3 text-gray-900 border rounded-md shadow-sm focus:outline-none text-base placeholder-gray-500 ${
                        errors.email 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1 relative">
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
                        className={`block w-full px-4 py-3 pr-12 text-gray-900 border rounded-md shadow-sm focus:outline-none text-base placeholder-gray-500 ${
                          errors.password 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="Enter your password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                    {isSignUp && !errors.password && (
                      <p className="mt-1 text-sm text-gray-500">
                        Password must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium cursor-pointer"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </LoadingButton>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <LoadingButton
                    onClick={handleGoogleSignIn}
                    isLoading={isGoogleLoading}
                    className="mt-3 w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium flex items-center justify-center cursor-pointer"
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

                <div className="mt-6 text-center">
                  <button
                    onClick={toggleMode}
                    className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>

                {!isSignUp && (
                  <div className="mt-4 text-center space-y-2">
                    <div>
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <div>
                      <button
                        onClick={resendConfirmation}
                        disabled={isLoading || !email}
                        className="text-sm text-gray-600 hover:text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Resend confirmation email
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主导出组件，用 Suspense 包裹 useSearchParams
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}