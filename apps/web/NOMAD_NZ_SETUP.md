# Nomad NZ 项目设置指南

## ✅ 已完成的工作

### 1. 项目结构
- ✅ 创建了完整的文件结构
- ✅ 设置了 TypeScript 类型定义
- ✅ 创建了工具函数

### 2. 核心功能
- ✅ 首页：智能推荐营地
- ✅ 探索页：浏览所有营地
- ✅ 行程页：生成行程路线
- ✅ 社区页：占位页面
- ✅ 个人页：露营档案

### 3. 组件
- ✅ CampCard：营地卡片组件
- ✅ NavBar：底部导航栏

### 4. API 路由
- ✅ `/api/recommend`：AI 推荐营地
- ✅ `/api/trip`：生成行程路线

### 5. 数据
- ✅ `camps.json`：包含 5 个新西兰营地数据

## 🚀 下一步操作

### 1. 安装依赖

```bash
cd apps/web
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase（可选，如果暂时不用可以先不配置）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI（必需，用于 AI 推荐）
OPENAI_API_KEY=your_openai_api_key
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 📝 待完成功能

### Day 2 任务
- [ ] 完善 UI 样式（使用 Shadcn 组件）
- [ ] 实现 PDF 下载功能
- [ ] 优化 AI 推荐逻辑

### Day 3 任务
- [ ] 集成 Supabase 认证
- [ ] 实现用户登录/注册
- [ ] 保存用户营地记录
- [ ] 实现社区分享功能

## 🔧 技术栈说明

### 已安装的依赖
- `@supabase/supabase-js`：Supabase 客户端
- `@supabase/ssr`：Supabase SSR 支持
- `openai`：OpenAI API 客户端
- `lucide-react`：图标库
- `class-variance-authority`：样式工具
- `clsx`：类名工具
- `tailwind-merge`：Tailwind 合并工具

### 需要安装的依赖（可选）
```bash
# Shadcn UI（如果需要更多组件）
npx shadcn@latest add button card input

# PDF 生成
pnpm add jspdf html2canvas

# 其他工具
pnpm add date-fns zod
```

## 🐛 常见问题

### 1. OpenAI API 错误
确保：
- API Key 正确
- 账户有足够的额度
- 网络可以访问 OpenAI

### 2. 样式问题
确保 Tailwind CSS 已正确配置：
```bash
# 检查 tailwind.config.ts
# 确保 content 路径包含 src 目录
```

### 3. 导入错误
所有导入使用 `@/` 别名，确保 `tsconfig.json` 中配置了路径别名。

## 📚 开发提示

### 使用 Cursor AI
可以直接使用以下提示词：

```
在首页添加一个筛选功能，可以按地区、难度、价格筛选营地
```

```
实现 PDF 下载功能，将生成的行程导出为 PDF
```

```
添加用户登录功能，使用 Supabase Auth
```

## 🎨 设计原则

- **减少选择**：界面简洁，减少用户决策负担
- **一步到位**：输入需求 → 直接获得推荐
- **轻松舒适**：绿色主题，像森林一样舒服
- **专注核心**：不做多余功能，围绕"露营体验"

## 📞 需要帮助？

查看项目 README.md 获取更多信息。


