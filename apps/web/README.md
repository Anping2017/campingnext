# Nomad NZ – 新西兰露营 + 路线智能助手 App（MVP）

## 📌 项目简介

Nomad NZ 是一款面向新西兰露营爱好者的轻量级智能 App。

**目标**：帮助用户轻松规划露营行程、记录营地、获取推荐路线，并提供社交玩法（打卡、分享）。

### 核心价值

- 解决"找地方难、规划麻烦、内容分散"的痛点
- 提供"自动规划路线 + 个人露营档案 + 真实社区"
- 为未来商业化（推广、路线包、会员）留接口

## 🌲 核心功能（MVP）

### ⛰️ 营地智能推荐
- 输入「时间」「地点」「预算」「同行人数」
- 输出：推荐营地 + 路线 + 必备装备清单
- AI 自动生成路线与评分解释

### 🗺️ 一键生成行程
- 用户选择营地 → 自动生成行程（路线、时间、注意事项）
- 可下载 PDF / 分享

### 📒 我的露营档案（Camp Profile）
- 去过的营地
- 想去的营地
- 自动生成"露营画像"（AI）

### 🧭 社区轻互动（不做重社交）
- 仅支持分享照片 + 文案
- 点赞/收藏
- 基于兴趣推荐内容

## 🧱 技术架构

- **Next.js 14** (前端 + SSR)
- **UI**: TailwindCSS + Shadcn
- **Auth**: Supabase Auth
- **DB**: Supabase Postgres
- **AI**: LangChain + OpenAI
- **Deployment**: Vercel

## 📁 文件结构

```
/src
 ├── app
 │   ├── layout.tsx
 │   ├── page.tsx                  # 首页：营地推荐
 │   ├── explore/page.tsx          # 发现营地
 │   ├── trip/page.tsx             # 生成行程
 │   ├── community/page.tsx        # 社区页
 │   └── profile/page.tsx          # 个人档案
 │
 ├── components
 │   ├── CampCard.tsx
 │   ├── TripPlanner.tsx
 │   ├── CampProfileCard.tsx
 │   └── NavBar.tsx
 │
 ├── lib
 │   ├── ai.ts                     # 调用AI的统一方法
 │   ├── supabase.ts
 │   └── recommend.ts              # 营地推荐算法
 │
 ├── data
 │   └── camps.json                # 营地本地数据（初期）
 │
 └── utils
     └── format.ts
```

## 🔌 API 设计

### 推荐营地 API
```
POST /api/recommend
body: {
  location: "Auckland",
  days: 2,
  budget: "medium",
  people: 2
}
returns: {
  camps: [...],
  reasoning: "AI explanation"
}
```

### 行程生成 API
```
POST /api/trip
body: { campId: "xyz" }
```

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 环境变量
创建 `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

### 启动开发服务器
```bash
pnpm dev
```

## 🧪 开发任务分解

### Day 1（核心功能搭建）
- ✅ 初始化 Next.js + Tailwind + Shadcn
- ✅ 加入 Supabase
- ✅ 导入 camps.json
- ✅ 建立页面结构
- ✅ 打通 AI 推荐 API

### Day 2（UI + 行程生成）
- 完成首页推荐 UI
- 完成行程生成界面
- 输出 PDF 下载（html-to-pdf）

### Day 3（个人页 + 社区）
- 用户登录
- 我的营地记录
- 社区分享模块（图片 + 文案）

## 🧩 数据来源

初期使用本地文件：`/data/camps.json`

未来可对接：DOC API / Google Maps / 旅游局资料等。

## 🧲 用户体验哲学

- 减少选择
- 一步到位的路线规划（输入→输出）
- 不做多余功能，全部围绕"露营体验"
- 界面轻松、有呼吸感、像森林一样舒服





