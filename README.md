# AI Lyrics Generator

一个基于AI的专业歌词生成工具，支持多种语言和风格，集成了Paddle支付系统。

## 功能特性

- 🤖 **AI歌词生成**: 使用先进的AI技术生成专业级歌词
- 🌍 **多语言支持**: 支持100+语言的歌词生成
- 🎵 **多种风格**: 支持流行、说唱、民谣等多种音乐风格
- 💳 **订阅系统**: 集成Paddle支付，支持月付和年付订阅
- 🔒 **安全认证**: 完整的用户认证和授权系统
- 📱 **响应式设计**: 支持桌面和移动设备
- 🚀 **高性能**: 基于Next.js 14构建，支持SSR和静态生成

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **支付**: Paddle
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Supabase 账户
- Paddle 账户

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google AI API
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Paddle Payment Configuration
NEXT_PUBLIC_PADDLE_CLIENT_ID=your-paddle-client-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=your-monthly-price-id
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=your-yearly-price-id
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_API_BASE_URL=https://sandbox-api.paddle.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 数据库设置

1. 在Supabase中创建新项目
2. 运行数据库迁移脚本（参考 `数据库更新.md`）
3. 配置RLS策略和权限

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## Paddle支付集成

### 功能特性

- ✅ **Overlay Checkout**: 使用Paddle.js的overlay模式
- ✅ **环境切换**: 支持测试和正式环境
- ✅ **Webhook处理**: 完整的webhook事件处理
- ✅ **订阅管理**: 支持订阅的创建、暂停、恢复和取消
- ✅ **安全验证**: HMAC签名验证确保webhook安全

### 环境配置

通过修改环境变量 `NEXT_PUBLIC_PADDLE_ENVIRONMENT` 来切换环境：

- `sandbox`: 测试环境
- `live`: 正式环境

### Webhook配置

在Paddle Dashboard中配置webhook endpoint：

```
https://your-domain.com/api/webhook/paddle
```

支持的webhook事件：
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `transaction.completed`
- `transaction.billing_failed`

## 项目结构

```
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API路由
│   │   ├── webhook/       # Webhook处理
│   │   └── subscription/   # 订阅管理
│   ├── auth/              # 认证页面
│   ├── dashboard/         # 用户仪表板
│   ├── generate/          # 歌词生成页面
│   └── pricing/           # 定价页面
├── components/            # React组件
│   ├── layout/           # 布局组件
│   ├── pricing/          # 定价组件
│   └── ui/               # UI组件
├── lib/                  # 工具库
│   ├── hooks/            # 自定义Hooks
│   ├── paddle.ts         # Paddle配置
│   └── supabase.ts       # Supabase客户端
└── public/               # 静态资源
```

## 部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 部署

### 环境变量配置

确保在生产环境中配置所有必要的环境变量，特别是：

- Paddle正式环境的配置
- 正确的webhook URL
- 生产环境的Supabase配置

## 开发指南

### 添加新的支付计划

1. 在Paddle Dashboard中创建新的价格
2. 更新环境变量中的价格ID
3. 在定价页面中添加新的计划

### 自定义webhook处理

在 `app/api/webhook/paddle/route.ts` 中添加新的事件处理逻辑。

### 样式定制

使用Tailwind CSS进行样式定制，主要颜色变量在 `tailwind.config.ts` 中定义。

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 支持

如有问题，请通过以下方式联系：

- 提交GitHub Issue
- 发送邮件到 support@your-domain.com

## 更新日志

### v2.0.0
- 集成Paddle支付系统
- 添加订阅管理功能
- 重构定价页面
- 优化用户界面

### v1.0.0
- 初始版本发布
- 基础AI歌词生成功能
- 用户认证系统