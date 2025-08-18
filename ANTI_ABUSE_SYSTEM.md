# 防白嫖系统设计文档

## 概述

本系统实现了多层防白嫖机制，防止用户通过多种方式滥用免费服务。

## 核心机制

### 1. IP地址监控
- **监控范围**：记录所有用户操作的IP地址
- **时间窗口**：1小时内
- **阈值设置**：
  - 注册：最多3次/小时
  - 登录：最多10次/小时
  - 歌词生成：最多50次/小时
  - 歌词优化：最多50次/小时

### 2. 浏览器指纹检测
- **指纹生成**：基于浏览器类型、操作系统、设备类型
- **监控范围**：24小时内
- **检测项目**：
  - 同一指纹被多个用户使用（超过5个用户）
  - 操作频率异常
- **阈值设置**：
  - 注册：最多10次/24小时
  - 登录：最多50次/24小时
  - 歌词生成：最多200次/24小时
  - 歌词优化：最多200次/24小时

### 3. 用户行为分析
- **监控范围**：1小时内单个用户的操作
- **阈值设置**：
  - 歌词生成：最多100次/小时
  - 歌词优化：最多100次/小时

## 数据库设计

### security_logs 表结构
```sql
CREATE TABLE security_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  user_agent TEXT,
  browser_fingerprint TEXT,
  action_type TEXT NOT NULL, -- 'login', 'generate', 'rewrite', 'register'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE
);
```

### 索引优化
- `idx_security_logs_user_id_created_at`：用户操作历史查询
- `idx_security_logs_ip_address_created_at`：IP地址监控查询
- `idx_security_logs_browser_fingerprint`：浏览器指纹查询

## 实现细节

### 1. 安全检查流程
```typescript
// 1. 获取客户端信息
const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';
const browserFingerprint = securityService.generateBrowserFingerprint(userAgent);

// 2. 执行安全检查
const securityCheck = await securityService.performSecurityCheck({
  ipAddress: clientIp,
  userAgent,
  browserFingerprint,
  userId: user.id,
  actionType: 'generate'
});

// 3. 处理异常情况
if (securityCheck.isAnomaly) {
  // 记录失败的安全事件
  await securityService.logSecurityEvent({...}, false);
  return errorResponse;
}

// 4. 记录成功的操作
await securityService.logSecurityEvent({...}, true);
```

### 2. 浏览器指纹生成
```typescript
generateBrowserFingerprint(userAgent: string): string {
  const canvas = userAgent.includes('Chrome') ? 'chrome' : 
                 userAgent.includes('Firefox') ? 'firefox' : 
                 userAgent.includes('Safari') ? 'safari' : 'other';
  
  const platform = userAgent.includes('Windows') ? 'windows' : 
                   userAgent.includes('Mac') ? 'mac' : 
                   userAgent.includes('Linux') ? 'linux' : 'other';
  
  const mobile = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
  
  return `${canvas}-${platform}-${mobile}`;
}
```

## 防护效果

### 1. 防止多次注册
- 同一IP 1小时内最多3次注册
- 同一浏览器指纹24小时内最多10次注册
- 检测同一指纹被多个用户使用

### 2. 防止频繁操作
- 限制单个用户的操作频率
- 监控IP地址的操作密度
- 检测异常的操作模式

### 3. 防止IP切换
- 记录浏览器指纹，即使IP变化也能检测
- 分析用户行为模式
- 多维度风险评估

## 数据清理

### 自动清理策略
- **安全日志**：30天后自动删除
- **生成记录**：24小时后删除未收藏的记录
- **优化记录**：24小时后删除未收藏的记录

### 清理函数
```sql
-- 每天凌晨3点清理30天前的安全日志
SELECT cron.schedule('cleanup-security-logs', '0 3 * * *', 'SELECT cleanup_old_security_logs();');
```

## 监控和告警

### 1. 异常检测
- 实时监控所有API调用
- 自动记录异常行为
- 提供详细的异常原因

### 2. 日志记录
- 所有操作都有详细日志
- 包含IP、用户代理、浏览器指纹
- 支持后续分析和审计

### 3. 响应机制
- 检测到异常立即阻止操作
- 返回友好的错误信息
- 记录失败的安全事件

## 配置建议

### 1. 阈值调整
根据实际使用情况，可以调整以下阈值：
- IP操作频率限制
- 浏览器指纹检测阈值
- 用户行为监控参数

### 2. 监控告警
建议设置以下监控：
- 异常操作频率告警
- 安全日志存储空间监控
- 系统性能影响监控

## 安全考虑

### 1. 隐私保护
- 不记录敏感用户信息
- 定期清理历史数据
- 符合GDPR等隐私法规

### 2. 性能优化
- 使用数据库索引优化查询
- 异步处理安全检查
- 缓存常用检查结果

### 3. 误判处理
- 提供申诉机制
- 支持手动解除限制
- 记录误判情况以便优化

## 总结

本防白嫖系统通过多层检测机制，有效防止了常见的滥用行为：
- ✅ 防止多次注册
- ✅ 防止IP切换
- ✅ 防止频繁操作
- ✅ 防止自动化攻击
- ✅ 保护正常用户权益

系统设计考虑了性能、隐私和用户体验，在保护服务的同时不影响正常用户的使用。
