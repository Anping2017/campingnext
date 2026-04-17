# Google Maps API 配置指南

## 📋 功能说明

此功能允许管理员通过 Google Maps 链接或地点名称自动填充营地信息，包括：
- 基本信息（名称、地址、坐标、评分）
- AI 总结的评价摘要
- 自动推断的设施和标签
- 营地类型和难度

## 🔑 获取 Google Maps API Key

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用计费（Google Maps API 有免费额度）

### 2. 启用必要的 API

在 [API 库](https://console.cloud.google.com/apis/library) 中启用以下 API：

- **Places API**（必需）
- **Places API (New)**（推荐，新版本）

### 3. 创建 API Key

1. 进入 [凭据页面](https://console.cloud.google.com/apis/credentials)
2. 点击"创建凭据" → "API 密钥"
3. 复制生成的 API Key

### 4. 限制 API Key（推荐）

为了安全，建议限制 API Key：

1. 点击创建的 API Key 进行编辑
2. **应用程序限制**：选择"HTTP 引荐来源网址"
   - 添加你的域名（如：`https://yourdomain.com/*`）
   - 开发环境：`http://localhost:3000/*`
3. **API 限制**：选择"限制密钥"
   - 只选择 "Places API" 和 "Places API (New)"

## ⚙️ 配置环境变量

在 `apps/web/.env.local` 文件中添加：

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**注意**：使用 `GOOGLE_MAPS_API_KEY`（不带 `NEXT_PUBLIC_` 前缀），因为 API Key 只在服务器端使用，更安全。

## 💰 费用说明

Google Maps Platform 提供每月 $200 的免费额度，通常足够：
- Places API：每 1000 次请求约 $17
- 免费额度约可支持 11,000+ 次请求/月

对于个人项目或小规模使用，通常不会超出免费额度。

## 🚀 使用方法

### 在营地管理页面

1. 点击"添加营地"按钮
2. 在表单顶部的"从 Google Maps 自动填充"区域：
   - **方式 1**：粘贴 Google Maps 链接
     ```
     https://www.google.com/maps/place/Cathedral+Cove+Campsite/@-36.5,175.8,15z
     ```
   - **方式 2**：输入地点名称
     ```
     Cathedral Cove Campsite
     ```
3. 点击"自动填充"按钮
4. 系统会自动：
   - 获取地点基本信息
   - 获取并总结 Google Maps 评价
   - 推断设施、标签、难度等
   - 自动填充表单
5. 检查并完善表单后保存

## 🔍 功能特性

### 自动提取的信息

- ✅ 营地名称
- ✅ 地址和地区
- ✅ 经纬度坐标
- ✅ 评分和评价数量
- ✅ AI 总结的评价摘要
- ✅ 营地类型（DOC/Holiday Park/Freedom Camping）
- ✅ 自动推断的设施
- ✅ 自动推断的标签
- ✅ 自动推断的难度
- ✅ 估算的价格

### AI 评价总结

系统会使用 OpenAI API 分析 Google Maps 上的评价，生成：
- 整体评价趋势
- 主要优点
- 需要注意的问题
- 适合的人群

## ⚠️ 注意事项

1. **API Key 安全**：虽然 API Key 在客户端可见，但已通过 HTTP 引荐来源限制保护
2. **数据准确性**：自动填充的数据需要人工检查和完善
3. **评价总结**：AI 总结基于可用评价，可能不完整
4. **费用控制**：建议设置 Google Cloud 预算警报

## 🐛 故障排除

### 错误："GOOGLE_MAPS_API_KEY 环境变量未设置"
- 检查 `.env.local` 文件是否存在
- 确认变量名正确：`GOOGLE_MAPS_API_KEY`（不带 `NEXT_PUBLIC_` 前缀）
- 重启开发服务器

### 错误："Google Places API 错误"
- 检查 API Key 是否正确
- 确认已启用 Places API
- 检查 API Key 限制设置

### 无法获取评价
- 某些地点可能没有评价
- 检查地点是否在 Google Maps 上存在

## 📚 相关文档

- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)
- [Places API 文档](https://developers.google.com/maps/documentation/places/web-service)
- [API 定价](https://developers.google.com/maps/billing-and-pricing/pricing)









