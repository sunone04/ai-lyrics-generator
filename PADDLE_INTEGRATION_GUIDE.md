# Paddle支付系统集成指南

## 概述

本文档详细说明了如何为AI歌词生成器网站集成Paddle支付系统，实现完整的用户订阅、状态管理和续费/取消工作流。

## 系统架构

```
用户界面 → API路由 → Paddle SDK → Paddle服务器
    ↓           ↓         ↓
数据库 ← Webhook ← 事件通知
```

## 已完成的组件

### 1. 前端组件
- ✅ `SubscribeButton.tsx` - 支付按钮组件
- ✅ `SubscriptionManager.tsx` - 订阅管理组件
- ✅ 更新的定价页面 (`/app/pricing/page.tsx`)

### 2. 后端API
- ✅ `/api/create-checkout` - 创建支付链接
- ✅ `/api/paddle-webhook` - 处理Webhook事件
- ✅ `/api/cancel-subscription` - 取消订阅

### 3. 配置文件
- ✅ `lib/paddle-config.ts` - Paddle配置管理
- ✅ 环境变量配置

## 部署步骤

### 第1步：Paddle账户设置

1. **创建Paddle账户**
   - 访问 [Paddle官网](https://www.paddle.com/)
   - 注册开发者账户
   - 完成身份验证

2. **创建产品**
   - 在Paddle控制台创建新产品
   - 设置产品名称：AI Lyrics Generator Premium
   - 选择订阅模式

3. **创建价格计划**
   - 月度套餐：$19.9/月
   - 年度套餐：$199/年
   - 记录每个价格计划的ID

4. **配置Webhook**
   - 添加Webhook URL：`https://yourdomain.com/api/paddle-webhook`
   - 选择事件类型：
     - `transaction.completed`
     - `subscription.canceled`
     - `subscription.updated`
     - `subscription.paused`

### 第2步：环境变量配置

更新 `.env.local` 文件：

```bash
# Paddle Configuration
NEXT_PUBLIC_PADDLE_CLIENT_ID=your_actual_client_id
PADDLE_API_KEY=your_actual_api_key
PADDLE_WEBHOOK_SECRET=your_actual_webhook_secret
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=your_monthly_price_id
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=your_yearly_price_id

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 第3步：数据库验证

确保数据库中存在必要的表和字段：

```sql
-- 检查profiles表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 验证订阅状态枚举
SELECT unnest(enum_range(NULL::subscription_status));
```

### 第4步：测试部署

1. **本地测试**
   ```bash
   npm run dev
   ```

2. **验证配置**
   - 访问 `/pricing` 页面
   - 检查支付按钮是否正常显示
   - 验证环境变量是否正确加载

3. **测试支付流程**
   - 使用Paddle沙盒模式测试
   - 验证Webhook接收
   - 检查数据库更新

### 第5步：生产部署

1. **构建应用**
   ```bash
   npm run build
   ```

2. **部署到生产环境**
   - 确保所有环境变量已设置
   - 更新Webhook URL为生产域名
   - 切换到Paddle生产模式

3. **监控和日志**
   - 检查Webhook接收日志
   - 监控支付成功率
   - 设置错误告警

## 功能特性

### 订阅管理
- ✅ 用户订阅（月度和年度套餐）
- ✅ 订阅状态跟踪
- ✅ 订阅取消
- ✅ 使用量统计

### 支付安全
- ✅ Webhook签名验证
- ✅ 用户身份验证
- ✅ 防重复订阅
- ✅ 错误处理和回滚

### 用户体验
- ✅ 响应式支付按钮
- ✅ 加载状态指示
- ✅ 友好的错误提示
- ✅ 订阅状态实时更新

## 故障排除

### 常见问题

1. **Webhook未接收**
   - 检查Webhook URL是否正确
   - 验证Webhook密钥
   - 检查服务器防火墙设置

2. **支付链接创建失败**
   - 验证Paddle API密钥
   - 检查价格ID是否正确
   - 确认账户余额充足

3. **订阅状态不同步**
   - 检查Webhook处理逻辑
   - 验证数据库更新
   - 查看服务器日志

### 调试工具

1. **Paddle沙盒模式**
   - 使用测试卡号进行支付测试
   - 模拟各种支付场景

2. **日志记录**
   - 所有API调用都有详细日志
   - Webhook事件记录完整

3. **状态检查**
   - 用户订阅状态实时查询
   - 支付历史记录追踪

## 维护和更新

### 定期检查
- 监控Webhook接收状态
- 检查支付成功率
- 验证订阅状态一致性

### 版本更新
- 关注Paddle SDK更新
- 及时应用安全补丁
- 测试新功能兼容性

## 支持资源

- [Paddle官方文档](https://developer.paddle.com/)
- [Paddle Node.js SDK](https://github.com/PaddleHQ/paddle-node-sdk)
- [Webhook事件参考](https://developer.paddle.com/webhook-reference)
- [测试卡号列表](https://developer.paddle.com/testing)

## 联系信息

如有技术问题，请联系开发团队或查看项目GitHub仓库的Issues部分。
