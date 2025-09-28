# Personal Style Library（个人风格库）改进说明（2025-09）

- 移除分组卡片上的“X lyric samples”统计展示，避免出现“0 lyric samples”等造成困惑的文案，分组卡片仅保留分组名与创建时间。
- 新建分组时支持一次性添加多条歌词样本（最多 5 条、每条 ≤ 500 字符）。前端在创建成功后，会为每条有效样本依次调用接口 `/api/personal-styles/lyrics` 进行创建。
- 统一编辑入口：去除“Edit Style Group”单独入口，分组卡片上仅保留“Edit”按钮。点击后进入统一的编辑视图：
  - 顶部可修改分组名称（保存后立即更新）。
  - 下方为组内歌词样本的查看与增删改。
  - 提供“Use in Generator →”链接，引导用户理解“为什么要用/如何使用”，可直接跳转到生成页。
- 页面文案与引导优化：
  - 登录后的页面在标题下方新增简短“三步法”说明（创建分组 → 添加 3–5 条短样本 → 在生成页选择该分组）。
  - 空状态保持“Create New Style”引导，语气更直接友好。

技术与约束：
- 数据库结构不变（`personal_style_groups` 与 `personal_style_lyrics`）。新增能力由前端并发/串行调用现有接口实现。
- 仍遵守现有字段限制：分组名 ≤ 100 字符；样本标题 ≤ 100 字符；样本正文 ≤ 500 字符。
- 后端接口：
  - `POST /api/personal-styles` 创建分组。
  - `PUT /api/personal-styles/{id}` 更新分组名。
  - `POST /api/personal-styles/lyrics` 新增样本；`PUT/DELETE /api/personal-styles/lyrics/{id}` 编辑/删除样本。

落地文件：
- 页面：`app/personal-style/page.tsx`
- 接口：`app/api/personal-styles/*`
