# AI服务设置指南

## 问题诊断

你遇到的错误是网络连接问题：
```
Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: fetch failed
```

这通常是由于：
1. **网络环境限制** - 无法访问Google AI API服务器
2. **防火墙阻止** - 企业或地区网络限制
3. **代理设置问题** - 需要配置代理访问

## 解决方案

### 方案1：启用开发模式（推荐用于测试）

我已经为你创建了模拟AI服务，可以在网络受限的环境下进行开发测试：

1. **已经启用** - 在`.env.local`中设置了：
   ```
   USE_MOCK_AI=true
   ```

2. **功能说明**：
   - ✅ 模拟歌词生成
   - ✅ 模拟歌词重写
   - ✅ 模拟歌词重新生成
   - ✅ 支持所有参数
   - ✅ 模拟API延迟
   - ✅ 返回格式化的歌词

3. **测试方法**：
   ```bash
   npm run dev
   # 访问 http://localhost:3000/generate
   # 填写参数并点击生成，将使用模拟服务
   ```

### 方案2：网络解决方案

#### 选项A：使用VPN
- 使用可靠的VPN服务连接到支持Google服务的地区
- 确保VPN稳定且速度良好

#### 选项B：配置代理
如果你有HTTP代理，可以配置：
```bash
# 设置代理环境变量
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

#### 选项C：使用Vertex AI（Google Cloud）
- 注册Google Cloud账号
- 启用Vertex AI API
- 使用Vertex AI的Gemini API（可能有更好的网络连通性）

### 方案3：切换到其他AI服务

如果Google AI持续无法访问，可以考虑：
- **OpenAI GPT-4** - 需要修改AI服务实现
- **Claude API** - Anthropic的API
- **本地模型** - 使用Ollama等本地部署方案

## 当前状态

✅ **RLS策略已修复** - profiles表INSERT权限问题已解决
✅ **AI服务已优化** - 使用正确的Gemini 2.5模型名称
✅ **Prompt已优化** - 符合产品文档要求，避免陈词滥调
✅ **模拟服务已就绪** - 可以在网络受限环境下测试
✅ **错误处理已改进** - 提供更友好的错误信息

## 下一步

1. **立即测试**：
   ```bash
   npm run dev
   ```
   访问生成页面测试模拟AI服务

2. **解决网络问题**：
   - 配置VPN或代理
   - 或者等待网络环境改善

3. **生产部署**：
   - 确保生产环境可以访问Google AI API
   - 将`USE_MOCK_AI`设置为`false`

## 模拟服务特性

模拟AI服务会生成包含以下内容的歌词：
- 根据用户参数定制的内容
- 标准的歌曲结构标签
- 避免陈词滥调的原创表达
- 符合指定的音乐风格和主题
- 显示使用的模型类型（basic/pro）

这样你可以继续开发和测试网站的其他功能，而不会被AI API的网络问题阻塞。