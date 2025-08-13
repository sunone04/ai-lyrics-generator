'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Breadcrumbs from '@/components/ui/breadcrumbs';

interface PaddleConfigStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, any>;
}

export default function PaddleSetupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [configStatus, setConfigStatus] = useState<PaddleConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await checkPaddleConfig();
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  const checkPaddleConfig = async () => {
    try {
      const response = await fetch('/api/paddle-config-check');
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      }
    } catch (error) {
      console.error('Failed to check Paddle config:', error);
    }
  };

  const testPaddleConnection = async () => {
    try {
      setTestResult('正在测试连接...');
      const response = await fetch('/api/paddle-test-connection');
      const data = await response.json();
      
      if (response.ok) {
        setTestResult('✅ 连接成功！Paddle API 正常工作');
      } else {
        setTestResult(`❌ 连接失败：${data.error || '未知错误'}`);
      }
    } catch (error: any) {
      setTestResult(`❌ 测试失败：${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h1>
          <p className="text-gray-600 mb-4">请先登录以访问此页面</p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        
        <div className="mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Paddle 支付系统配置
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              此页面帮助您验证和配置 Paddle 支付系统。请确保所有必要的环境变量都已正确设置。
            </p>
          </div>

          {/* 配置状态 */}
          {configStatus && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">配置状态</h2>
              
              <div className="space-y-4">
                {configStatus.errors.length > 0 ? (
                  <div className="flex items-start space-x-3">
                    <XMarkIcon className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-700">配置错误</h3>
                      <ul className="mt-2 space-y-1">
                        {configStatus.errors.map((error, index) => (
                          <li key={index} className="text-red-600 text-sm">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-700">配置正确</h3>
                      <p className="text-green-600 text-sm">所有必要的环境变量都已正确配置</p>
                    </div>
                  </div>
                )}

                {configStatus.warnings.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-700">配置警告</h3>
                      <ul className="mt-2 space-y-1">
                        {configStatus.warnings.map((warning, index) => (
                          <li key={index} className="text-yellow-600 text-sm">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 连接测试 */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">连接测试</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                点击下面的按钮测试与 Paddle API 的连接。这将验证您的 API 密钥是否正确配置。
              </p>
              
              <button
                onClick={testPaddleConnection}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                测试 Paddle 连接
              </button>
              
              {testResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm">{testResult}</p>
                </div>
              )}
            </div>
          </div>

          {/* 配置指南 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">配置指南</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. 获取 Paddle 凭据</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>登录您的 <a href="https://vendors.paddle.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Paddle 仪表板</a></li>
                  <li>进入 "Developer Tools" → "Authentication"</li>
                  <li>复制您的 "Client ID" 和 "API Key"</li>
                  <li>进入 "Developer Tools" → "Webhooks" 创建新的 webhook</li>
                  <li>复制 webhook 的 "Secret Key"</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. 创建价格</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>在 Paddle 仪表板中进入 "Catalog" → "Products"</li>
                  <li>创建月度套餐产品，设置价格（如 $19.90/月）</li>
                  <li>创建年度套餐产品，设置价格（如 $199/年）</li>
                  <li>复制每个产品的 "Price ID"</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. 设置默认支付链接</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>在 Paddle 仪表板中进入 "Settings" → "Checkout"</li>
                  <li>将 "Default Payment Link" 设置为：<code className="bg-gray-100 px-2 py-1 rounded">https://ai-lyrics-generator.net/pricing</code></li>
                  <li>保存设置</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. 配置环境变量</h3>
                <p className="text-gray-600 text-sm mb-3">
                  在您的 <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> 文件中设置以下变量：
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`NEXT_PUBLIC_PADDLE_CLIENT_ID=your_client_id_here
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=your_monthly_price_id_here
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=your_yearly_price_id_here
NEXT_PUBLIC_SITE_URL=https://ai-lyrics-generator.net`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. 测试支付流程</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>确保所有环境变量都已正确设置</li>
                  <li>重新启动您的开发服务器</li>
                  <li>访问 <a href="/pricing" className="text-blue-600 hover:underline">定价页面</a></li>
                  <li>点击订阅按钮测试支付流程</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
