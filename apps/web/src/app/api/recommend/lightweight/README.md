# 轻量版推荐 API

## 概述

轻量版推荐模型使用**规则匹配 + AI 文本总结**的方式，快速推荐 Top 3 营地。

## 特点

- ✅ **快速**：基于规则匹配，无需复杂模型推理
- ✅ **精准**：综合考虑偏好、距离、天气、评分等多维度
- ✅ **智能**：AI 生成个性化推荐理由
- ✅ **轻量**：适合 MVP 阶段，成本低

## API 端点

```
POST /api/recommend/lightweight
```

## 请求参数

```typescript
{
  preferences: string[];        // 必填：用户偏好，如 ['海边', '厕所', '新手友好']
  userLocation?: {              // 可选：用户当前位置
    lat: number;
    lng: number;
  };
  maxDistance?: number;         // 可选：最大距离（公里），默认 500
  weather?: {                   // 可选：当前天气
    condition: string;          // 'sunny' | 'rainy' | 'cloudy'
    temperature: number;        // 温度（摄氏度）
  };
  viewedCamps?: string[];        // 可选：用户历史浏览的营地ID（用于避免重复推荐）
}
```

## 响应格式

```typescript
{
  camps: Array<{
    camp: Camp;                 // 完整营地信息
    score: number;              // 匹配分数（越高越匹配）
    reason: string;             // AI 生成的推荐理由（50-80字）
  }>;
}
```

## 使用示例

### 基础推荐（仅偏好）

```javascript
const response = await fetch('/api/recommend/lightweight', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    preferences: ['海边', '厕所', '新手友好']
  })
});

const data = await response.json();
// data.camps 包含 Top 3 推荐营地
```

### 完整推荐（包含位置和天气）

```javascript
const response = await fetch('/api/recommend/lightweight', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    preferences: ['海边', '厕所'],
    userLocation: {
      lat: -36.8485,  // Auckland
      lng: 174.7633
    },
    maxDistance: 200,  // 200 公里内
    weather: {
      condition: 'sunny',
      temperature: 22
    },
    viewedCamps: ['cathedral-cove']  // 已浏览过的营地
  })
});
```

## 推荐逻辑

### 评分规则（总分 100 分）

1. **偏好匹配**（30 分）
   - 每个匹配的偏好 +10 分
   - 支持：海边、厕所、新手友好、徒步、森林等

2. **距离评分**（25 分）
   - 距离越近分数越高
   - 超出 `maxDistance` 的营地不推荐

3. **天气适配**（15 分）
   - 雨天：有遮蔽设施的营地加分
   - 晴天：海边营地加分
   - 极端温度：有设施的营地加分

4. **评分**（20 分）
   - 营地评分 × 4

5. **价格**（10 分）
   - 免费营地：+10 分
   - < 20 纽币：+7 分
   - < 40 纽币：+5 分
   - 其他：+3 分

6. **避免重复**（-5 分）
   - 已浏览的营地轻微降分

### AI 文本总结

对 Top 3 营地，使用 AI 生成个性化推荐理由：
- 模型：`gpt-4o-mini`
- 长度：50-80 字
- 语气：轻松、自然、有旅行感

## 偏好关键词映射

| 输入 | 匹配条件 |
|------|---------|
| `海边` / `beach` | 标签包含"海边" |
| `厕所` / `toilet` | 设施包含"厕所" |
| `新手友好` / `beginner` / `family` | 难度为 easy 或标签包含"适合新手" |
| `徒步` / `hiking` | 标签包含"徒步" |
| `森林` / `forest` | 标签包含"森林"或"徒步" |

## 注意事项

1. 如果没有 OpenAI API Key，会使用默认推荐理由（基于营地描述）
2. 如果所有营地评分都为负，返回空数组
3. 距离计算使用 Haversine 公式（地球球面距离）


