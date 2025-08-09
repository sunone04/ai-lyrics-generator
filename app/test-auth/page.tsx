'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function TestAuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUser, setServerUser] = useState<any>(null);
  const [serverLoading, setServerLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    // 获取客户端用户信息
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const testServerAuth = async () => {
    setServerLoading(true);
    try {
      const response = await fetch('/api/test-server-auth');
      const data = await response.json();
      setServerUser(data);
    } catch (error) {
      console.error('Server auth test failed:', error);
      setServerUser({ error: 'Failed to test server auth' });
    } finally {
      setServerLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">身份验证测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 客户端身份验证状态 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">客户端身份验证</h2>
          {user ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ 用户已登录</p>
              <p><strong>用户ID:</strong> {user.id}</p>
              <p><strong>邮箱:</strong> {user.email}</p>
              <p><strong>登录时间:</strong> {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ 用户未登录</p>
              <a href="/auth/signin" className="text-blue-600 hover:underline">
                前往登录页面
              </a>
            </div>
          )}
        </div>

        {/* 服务器端身份验证状态 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">服务器端身份验证</h2>
          <button
            onClick={testServerAuth}
            disabled={serverLoading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {serverLoading ? '测试中...' : '测试服务器认证'}
          </button>
          
          {serverUser && (
            <div className="space-y-2">
              {serverUser.error ? (
                <p className="text-red-600">❌ {serverUser.error}</p>
              ) : serverUser.user ? (
                <div>
                  <p className="text-green-600">✅ 服务器端用户已认证</p>
                  <p><strong>用户ID:</strong> {serverUser.user.id}</p>
                  <p><strong>邮箱:</strong> {serverUser.user.email}</p>
                </div>
              ) : (
                <p className="text-red-600">❌ 服务器端用户未认证</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 一致性检查 */}
      {user && serverUser && !serverUser.error && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">一致性检查</h2>
          {user.id === serverUser.user?.id ? (
            <p className="text-green-600">✅ 前后端用户身份一致！</p>
          ) : (
            <p className="text-red-600">❌ 前后端用户身份不一致</p>
          )}
        </div>
      )}
    </div>
  );
}