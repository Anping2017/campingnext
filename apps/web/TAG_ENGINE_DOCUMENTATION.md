# 高级标签选择引擎文档

## 概述

标签选择引擎是一个智能系统，用于在新建营地时自动选择最合适的标签。它结合了规则推断、AI 生成和关系约束，确保标签选择的准确性和合理性。

## 核心功能

### 1. 标签关系定义

标签之间存在三种关系：

- **依赖关系**：某些标签需要其他标签作为前提
  - 例如：`kayaking`（皮划艇）需要 `beach`、`lake` 或 `river`（水域）
  - 例如：`stargazing`（观星）需要 `quiet`（安静环境）

- **互斥关系**：某些标签不能同时存在
  - 例如：`sunny`（阳光充足）和 `shady`（有树荫）互斥
  - 例如：`beginner`（适合新手）和 `challenging`（挑战性）互斥

- **关联关系**：某些标签通常一起出现
  - 例如：`beach`（海边）通常关联 `photography`（适合摄影）和 `scenic`（景色好）
  - 例如：`family`（适合家庭）通常关联 `beginner`（适合新手）

### 2. 标签优先级

不同标签有不同的优先级，影响最终选择：

- **高优先级**（8-10）：`heritage`（世界遗产）、`scenic`（景色好）
- **中优先级**（4-7）：`challenging`（挑战性）、`beginner`（适合新手）、`family`（适合家庭）
- **低优先级**（1-3）：`windy`（多风）、`sunny`（阳光充足）、`shady`（有树荫）

### 3. 智能推断流程

1. **规则推断**：基于关键词匹配和上下文信息推断标签候选
   - 地理位置标签：从名称、描述、地址中提取
   - 活动标签：从描述和评价中提取
   - 适合人群标签：从设施和描述中提取
   - 特色标签：从描述和评价中提取

2. **AI 生成**：AI 根据营地信息生成初始标签列表

3. **关系应用**：
   - 检查互斥关系，移除冲突标签
   - 检查依赖关系，补充必要标签
   - 应用关联关系，添加相关标签

4. **最终选择**：
   - 按置信度和优先级排序
   - 选择置信度 ≥ 0.4 的标签
   - 限制最多 8 个标签

## 使用示例

```typescript
import { selectTagsIntelligently } from '@/lib/tag-engine';

const context = {
  name: 'Cathedral Cove Campsite',
  description: '位于科罗曼德半岛的美丽海滩露营地，适合家庭和摄影爱好者',
  address: 'Coromandel Peninsula',
  campType: 'DOC',
  facilities: ['toilet', 'parking', 'water'],
  difficulty: 'easy',
  reviews: ['Beautiful beach', 'Great for families', 'Perfect for photography'],
  placeTypes: ['beach', 'campground'],
};

const aiTags = ['beach', 'scenic', 'photography']; // AI 生成的初始标签
const finalTags = selectTagsIntelligently(aiTags, context);
// 结果可能包含：['beach', 'scenic', 'photography', 'family', 'beginner', 'quiet']
```

## 标签分类

### 地理位置标签（location）
- `beach`：海边
- `mountain`：山区
- `lake`：湖边
- `forest`：森林
- `river`：河边

### 活动类型标签（activity）
- `hiking`：适合徒步
- `fishing`：适合钓鱼
- `kayaking`：适合皮划艇
- `stargazing`：适合观星
- `photography`：适合摄影

### 适合人群标签（suitability）
- `beginner`：适合新手
- `family`：适合家庭
- `solo`：适合独行
- `group`：适合团体

### 特色标签（feature）
- `scenic`：景色好
- `quiet`：安静
- `challenging`：挑战
- `heritage`：世界遗产
- `sunny`：阳光充足
- `shady`：有树荫
- `windy`：多风
- `sheltered`：有遮挡

## 配置说明

标签关系配置在 `apps/web/src/lib/tag-engine.ts` 中的 `TAG_RELATIONSHIPS` 对象中定义。可以根据实际需求调整：

- 添加新的依赖关系
- 添加新的互斥关系
- 添加新的关联关系
- 调整标签优先级

## 验证功能

系统还提供了标签组合验证功能：

```typescript
import { validateTagCombination } from '@/lib/tag-engine';

const validation = validateTagCombination(['sunny', 'shady', 'beach']);
if (!validation.valid) {
  console.log('问题：', validation.issues);
  // 输出：问题：['标签 "阳光充足" 和 "有树荫" 不能同时存在']
}
```

## 最佳实践

1. **优先使用 AI 生成**：AI 生成的标签通常更准确，作为基础
2. **规则补充**：使用规则推断补充 AI 可能遗漏的标签
3. **关系约束**：确保最终标签组合符合关系约束
4. **数量控制**：限制标签数量，避免信息过载
5. **置信度阈值**：只选择置信度 ≥ 0.4 的标签，确保准确性

## 未来改进

- 支持用户反馈，学习标签选择的准确性
- 添加标签的语义相似度计算
- 支持多语言标签推断
- 添加标签的时效性（季节性标签）




