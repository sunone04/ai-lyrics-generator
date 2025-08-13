# Paddle支付系统集成指南

## 概述

本指南将帮助您完成Paddle支付系统的集成，使您的AI歌词生成器网站能够接受真实的用户订阅。

## 第一步：Paddle账户设置

### 1. 创建Paddle账户
1. 访问 [Paddle Dashboard](https://vendors.paddle.com)
2. 注册并验证您的账户
3. 完成商家验证流程

### 2. 创建产品
1. 在Paddle Dashboard中创建新产品
2. 产品名称：AI歌词生成器订阅
3. 产品类型：订阅产品

### 3. 创建价格
1. 创建月度订阅价格
   - 价格ID格式：`pri_xxxxxxxxxxxx`
   - 价格：根据您的定价策略设置
   - 计费周期：每月

2. 创建年度订阅价格
   - 价格ID格式：`pri_xxxxxxxxxxxx`
   - 价格：根据您的定价策略设置
   - 计费周期：每年

## 第二步：获取API凭据

### 1. API密钥
1. 在Paddle Dashboard中进入"开发者工具"
2. 复制您的API密钥（以`pdl_`开头）

### 2. 客户端ID
1. 在"开发者工具"中找到客户端ID
2. 复制客户端ID（用于前端Paddle.js）

### 3. Webhook密钥
1. 在"开发者工具"中创建Webhook
2. 设置Webhook URL：`https://yourdomain.com/api/paddle-webhook`
3. 复制Webhook密钥

## 第三步：环境变量配置

### 本地开发环境 (.env.local)
```bash
# Paddle Configuration
NEXT_PUBLIC_PADDLE_CLIENT_ID=your_actual_client_id_here
PADDLE_API_KEY=your_actual_api_key_here
PADDLE_WEBHOOK_SECRET=your_actual_webhook_secret_here
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=pri_your_monthly_price_id
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=pri_your_yearly_price_id

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Vercel生产环境
1. 在Vercel Dashboard中进入项目设置
2. 在"Environment Variables"中添加上述所有变量
3. 确保`NEXT_PUBLIC_SITE_URL`设置为您的实际域名

## 第四步：验证配置

### 1. 使用配置检查页面
访问：`https://yourdomain.com/admin/paddle-config`

这个页面将：
- 验证所有环境变量是否正确设置
- 测试与Paddle API的连接
- 显示详细的错误信息

### 2. 检查清单
- [ ] 所有环境变量都已设置
- [ ] 没有使用占位符值（如`your_xxx_here`）
- [ ] 价格ID格式正确（以`pri_`开头）
- [ ] 网站URL格式正确（以`https://`开头）
- [ ] Paddle API连接测试通过

## 第五步：测试支付流程

### 1. 沙盒测试
1. 确保在开发环境中使用Paddle沙盒模式
2. 使用Paddle提供的测试信用卡
3. 测试完整的订阅流程

### 2. 生产环境测试
1. 部署到生产环境
2. 使用真实信用卡进行小额测试
3. 验证Webhook是否正确接收事件

## 第六步：Webhook配置

### 1. 必需的事件类型
确保Paddle Webhook配置了以下事件：
- `transaction.completed`
- `subscription.canceled`
- `subscription.updated`
- `subscription.paused`

### 2. Webhook URL
```
https://yourdomain.com/api/paddle-webhook
```

### 3. 验证Webhook
1. 在Paddle Dashboard中测试Webhook
2. 检查服务器日志确认事件接收
3. 验证数据库更新是否正确

## 故障排除

### 常见问题

#### 1. 配置验证失败
**症状**：配置检查页面显示错误
**解决方案**：
- 检查所有环境变量是否已设置
- 确保没有使用占位符值
- 验证价格ID格式

#### 2. Paddle API连接失败
**症状**：连接测试失败
**解决方案**：
- 检查API密钥是否正确
- 确认账户状态是否正常
- 验证网络连接

#### 3. Webhook事件未接收
**症状**：支付成功但用户状态未更新
**解决方案**：
- 检查Webhook URL是否正确
- 验证Webhook密钥
- 检查服务器日志

#### 4. 支付链接创建失败
**症状**：点击订阅按钮后出现错误
**解决方案**：
- 检查价格ID是否存在
- 验证用户认证状态
- 确认Paddle账户配置

## 安全注意事项

### 1. API密钥安全
- 永远不要在客户端代码中暴露API密钥
- 定期轮换API密钥
- 使用环境变量存储敏感信息

### 2. Webhook安全
- 始终验证Webhook签名
- 使用HTTPS URL
- 监控Webhook事件日志

### 3. 数据验证
- 验证所有用户输入
- 检查价格ID的有效性
- 确保用户权限正确

## 监控和维护

### 1. 日志监控
- 监控支付API调用日志
- 跟踪Webhook事件处理
- 记录错误和异常

### 2. 性能监控
- 监控支付流程响应时间
- 跟踪成功率
- 监控数据库性能

### 3. 定期检查
- 定期验证Paddle配置
- 检查Webhook状态
- 更新依赖包

## 联系支持

如果在集成过程中遇到问题：

1. 查看Paddle官方文档
2. 检查项目日志
3. 使用配置检查页面诊断问题
4. 联系技术支持

---

**重要提醒**：在生产环境中部署之前，请确保完成所有测试并验证支付流程正常工作。
