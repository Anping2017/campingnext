# 营地设施详细信息数据来源

## 📋 推荐的数据来源（按优先级）

### 1. **Google Maps 用户评价** ⭐⭐⭐⭐⭐（最推荐）
**优点**：
- 真实用户反馈，信息准确
- 包含实际使用体验
- 免费获取（通过 Google Places API）

**获取方式**：
- 使用 Google Places API 的 `reviews` 字段
- 让 AI 分析评价文本，提取设施信息
- 当前系统已实现此功能

**示例**：
```
评价："这里有干净的厕所、热水淋浴和厨房设施"
→ 提取：toilet, shower, kitchen
```

### 2. **营地官方网站** ⭐⭐⭐⭐
**优点**：
- 官方信息，最准确
- 包含完整设施列表

**获取方式**：
- 从 Google Maps 获取 `website` 字段
- 使用 AI 访问网站并提取设施信息
- 或手动访问网站填写

**推荐网站**：
- DOC 营地：https://www.doc.govt.nz/parks-and-recreation/places-to-go/camping/
- Holiday Parks：各营地独立网站
- Freedom Camping：https://www.freedomcamping.org/

### 3. **Google Places API 详细信息** ⭐⭐⭐
**优点**：
- 结构化数据
- 部分设施信息可能包含在 `types` 字段中

**限制**：
- Google Places API 不直接提供设施列表
- 需要通过评价或网站获取

### 4. **AI 智能推断** ⭐⭐
**优点**：
- 可以根据营地类型和名称推断
- 快速生成

**限制**：
- 可能不够准确
- 需要结合其他数据源验证

**当前实现**：
- 系统已使用 AI 分析评价来推断设施
- 结合营地类型（DOC/Holiday Park/Freedom Camping）进行智能推断

## 🔧 当前系统实现

### 自动获取流程
1. **从 Google Maps 获取**：
   - 评分
   - 地址
   - 电话
   - 网址
   - 地理位置
   - **用户评价**（用于提取设施）

2. **AI 分析评价提取设施**：
   - 分析评价文本
   - 识别提到的设施
   - 转换为标准 ID 格式

3. **智能推断补充**：
   - 根据营地类型推断常见设施
   - 例如：Holiday Park 通常有 shower, kitchen, power, wifi

### 手动补充
如果自动获取不完整，可以：
1. 访问营地官方网站（从 Google Maps 获取的 website）
2. 查看 Google Maps 评价
3. 在表单中手动添加设施

## 📝 设施标准 ID

系统使用标准化的设施 ID，确保一致性：

- `toilet` - 厕所
- `water` - 饮用水
- `parking` - 停车场
- `shower` - 淋浴
- `kitchen` - 厨房
- `power` - 电源
- `wifi` - WiFi
- `shop` - 商店
- `laundry` - 洗衣房
- `bbq` - 烧烤架
- `fire-pit` - 篝火区
- `trash` - 垃圾处理
- `playground` - 游乐场
- `security` - 安保
- `first-aid` - 急救站
- `locker` - 储物柜
- `reception` - 接待处

## 🎯 最佳实践

1. **优先使用 Google Maps 评价**：
   - 评价中包含最真实的设施信息
   - 系统会自动分析并提取

2. **验证官方网站**：
   - 如果 Google Maps 提供了 website
   - 访问网站确认设施列表

3. **结合营地类型**：
   - DOC 营地：通常有 toilet, water, parking
   - Holiday Park：通常有完整设施（shower, kitchen, power, wifi）
   - Freedom Camping：通常只有基本设施（toilet, parking）

4. **用户反馈**：
   - 允许用户补充或修正设施信息
   - 通过社区评价持续更新

## 🔄 持续改进

系统会：
- 自动从新评价中提取设施信息
- 根据用户反馈更新设施列表
- 结合多个数据源提高准确性
