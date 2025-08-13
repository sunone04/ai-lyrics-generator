'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, AlertTriangleIcon, Loader2 } from 'lucide-react';

interface ConfigStatus {
  isValid: boolean;
  errors: string[];
}

export default function PaddleConfigPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const checkConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paddle-config-check');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      setConfigStatus({
        isValid: false,
        errors: ['无法连接到配置检查API']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPaddleConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paddle-test-connection');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: '连接测试失败'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Paddle配置检查</h1>
          <p className="text-gray-600">
            验证Paddle支付系统的配置是否正确
          </p>
        </div>

        {/* 配置状态卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              配置状态
            </CardTitle>
            <CardDescription>
              检查环境变量和Paddle配置
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={configStatus.isValid ? "default" : "destructive"}>
                    {configStatus.isValid ? (
                      <>
                        <CheckIcon className="h-3 w-3 mr-1" />
                        配置正确
                      </>
                    ) : (
                      <>
                        <XIcon className="h-3 w-3 mr-1" />
                        配置错误
                      </>
                    )}
                  </Badge>
                </div>

                {!configStatus.isValid && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">配置错误：</h4>
                    <ul className="space-y-1">
                      {configStatus.errors.map((error, index) => (
                        <li key={index} className="text-red-700 text-sm">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={checkConfig} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      检查中...
                    </>
                  ) : (
                    '重新检查'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 连接测试卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>Paddle API连接测试</CardTitle>
            <CardDescription>
              测试与Paddle API的连接是否正常
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={testPaddleConnection} 
                disabled={isLoading || !configStatus?.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </Button>

              {testResult && (
                <div className={`border rounded-lg p-4 ${
                  testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? '连接成功' : '连接失败'}
                  </h4>
                  {testResult.message && (
                    <p className={`text-sm ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                  )}
                  {testResult.error && (
                    <p className="text-red-700 text-sm">
                      错误: {testResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 配置说明 */}
        <Card>
          <CardHeader>
            <CardTitle>配置说明</CardTitle>
            <CardDescription>
              需要配置的环境变量
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">必需的环境变量：</h4>
                  <ul className="space-y-2 text-sm">
                    <li><code className="bg-gray-100 px-2 py-1 rounded">PADDLE_API_KEY</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_PADDLE_CLIENT_ID</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">PADDLE_WEBHOOK_SECRET</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_SITE_URL</code></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">获取方式：</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>1. 登录 <a href="https://vendors.paddle.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Paddle Dashboard</a></li>
                    <li>2. 创建产品和价格</li>
                    <li>3. 获取API密钥和客户端ID</li>
                    <li>4. 配置Webhook URL</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
