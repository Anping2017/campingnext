# 价格字段迁移：从数字改为分类

## 概述

将营地的价格字段从数字（NZD）改为分类（免费、便宜、中等、较贵），使价格信息更易理解和使用。

## 修改内容

### 1. 数据库修改

**文件**: `supabase-schema.sql`
- 将 `price NUMERIC` 改为 `price TEXT`，并添加 CHECK 约束
- 默认值从 `0` 改为 `'medium'`

**迁移脚本**: `migrate-price-to-category.sql`
- 执行此脚本将现有数据库中的数字价格转换为分类
- 转换规则：
  - `price = 0` → `'free'`
  - `0 < price <= 15` → `'cheap'`
  - `15 < price <= 30` → `'medium'`
  - `price > 30` → `'expensive'`

### 2. TypeScript 类型定义

**文件**: `apps/web/src/types/camp.ts`
- `price: number` → `price: 'free' | 'cheap' | 'medium' | 'expensive'`

**文件**: `apps/web/src/types/preferences.ts`
- `priceRange: { min: number; max: number } | null` → `priceCategories: ('free' | 'cheap' | 'medium' | 'expensive')[]`

### 3. 前端组件修改

**文件**: `apps/web/src/utils/format.ts`
- `formatPrice()` 函数改为返回分类的中文标签

**文件**: `apps/web/src/components/admin/CampFormModal.tsx`
- 价格输入从数字输入框改为下拉选择框
- 默认值从 `0` 改为 `'medium'`
- 验证逻辑改为检查是否为有效分类

**文件**: `apps/web/src/app/explore/page.tsx`
- 价格筛选从数字范围改为分类多选
- UI 改为按钮组形式

**文件**: `apps/web/src/components/PreferencesModal.tsx`
- 价格偏好设置从数字范围改为分类多选

**文件**: `apps/web/src/app/camp/[id]/page.tsx`
- 移除了价格显示中的 "/ 晚" 后缀

### 4. API 路由修改

**文件**: `apps/web/src/app/api/camps/[id]/route.ts`
- 移除 `parseFloat(camp.price)`，直接返回分类字符串

**文件**: `apps/web/src/app/api/camps/route.ts`
- 价格筛选逻辑改为分类筛选

**文件**: `apps/web/src/app/api/trip/generate/route.ts`
- 移除 `parseFloat(camp.price)`，直接使用分类

**文件**: `apps/web/src/app/api/camps/fetch-info/route.ts`
- AI 生成的价格改为返回分类字符串
- 类型定义更新

**文件**: `apps/web/src/app/api/camps/fetch-from-google/route.ts`
- 价格估算逻辑改为返回分类
- 根据 `price_level` 和 `campType` 推断分类

**文件**: `apps/web/src/app/api/admin/camps/route.ts`
- 价格字段直接保存，无需转换

**文件**: `apps/web/src/app/api/recommend/smart/route.ts`
- 价格评分逻辑改为基于分类

## 执行步骤

1. **执行数据库迁移**：
   ```sql
   -- 在 Supabase Dashboard 的 SQL Editor 中执行
   -- 文件: migrate-price-to-category.sql
   ```

2. **更新代码**：
   - 所有代码修改已完成
   - 确保 `.env.local` 中的环境变量已配置

3. **测试**：
   - 测试营地详情页价格显示
   - 测试管理员添加/编辑营地时的价格选择
   - 测试探索页面的价格筛选
   - 测试偏好设置中的价格分类选择
   - 测试自动填充功能的价格生成

## 价格分类说明

- **免费 (free)**: 通常 0 NZD，如 DOC 营地和 Freedom Camping
- **便宜 (cheap)**: 通常 1-15 NZD
- **中等 (medium)**: 通常 16-30 NZD，如大多数 Holiday Park
- **较贵 (expensive)**: 通常 31+ NZD

## 注意事项

1. 数据库迁移脚本会保留现有数据，根据数字价格自动转换为分类
2. 如果数据库中已有数据，建议先备份再执行迁移
3. 新添加的营地默认价格为 `'medium'`
4. 所有价格相关的筛选和显示都已更新为使用分类




