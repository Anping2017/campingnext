# 调试营地保存失败问题

## 已添加的调试功能

### 1. 客户端调试（浏览器控制台）

在保存营地时，浏览器控制台会显示：

- ✅ 原始数据 (campData)
- ✅ 处理后的数据 (payload)
- ✅ 评价字段的详细检查（类型、长度等）
- ✅ 发送的完整 JSON
- ✅ 响应状态和内容
- ✅ 详细的错误信息（包括错误代码、详情、提示）

### 2. 服务器端调试（终端/服务器日志）

在服务器端会显示：

- ✅ 接收到的请求体
- ✅ camp 对象的详细信息
- ✅ 评价字段转换前后的对比
- ✅ 数据库表访问检查
- ✅ 准备保存的完整数据
- ✅ Supabase 错误详情（包括错误代码、详情、提示）

## 如何查看调试信息

### 步骤 1: 打开浏览器开发者工具

1. 按 `F12` 或右键点击页面 → "检查"
2. 切换到 **Console** 标签页
3. 切换到 **Network** 标签页（可选，查看网络请求）

### 步骤 2: 尝试保存营地

1. 在管理员后台创建或编辑营地
2. 点击"保存"按钮
3. 查看控制台输出

### 步骤 3: 查看服务器日志

1. 查看运行 `pnpm dev` 的终端窗口
2. 查找以 `=== 保存营地` 开头的日志
3. 查找 `❌` 标记的错误信息

## 常见错误及解决方案

### 错误 1: 字段不存在 (code: 42703)

**错误信息**: `column "review_pros" does not exist`

**解决方案**: 在 Supabase Dashboard 执行：

```sql
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_pros TEXT[];
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_cons TEXT[];
```

### 错误 2: 权限问题 (code: 42501)

**错误信息**: `permission denied`

**解决方案**: 检查 Supabase RLS 策略，确保管理员可以插入/更新数据

### 错误 3: 数据类型不匹配

**错误信息**: `invalid input syntax for type text[]`

**解决方案**: 确保 `review_pros` 和 `review_cons` 是数组格式，不是 `null`

## 检查数据库字段

执行以下 SQL 检查字段是否存在：

```sql
-- 检查字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'camps' 
  AND column_name IN ('review_pros', 'review_cons');

-- 如果不存在，添加字段
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_pros TEXT[];
ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_cons TEXT[];
```

## 调试输出示例

### 成功的保存

```
=== 保存营地 - 客户端调试信息 ===
原始数据 (campData): {...}
处理后的数据 (payload): {...}
评价字段检查: { reviewPros: [...], reviewCons: [...] }
响应状态: 200 OK
✅ 保存成功
```

### 失败的保存

```
=== 保存营地 - 服务器端调试信息 ===
接收到的请求体: {...}
❌ 保存营地失败 - 详细错误信息: {
  message: "...",
  code: "42703",
  details: "...",
  hint: "..."
}
```

## 下一步

1. 查看浏览器控制台的完整错误信息
2. 查看服务器终端的完整错误信息
3. 根据错误代码和提示信息解决问题
4. 如果字段不存在，执行 SQL 添加字段
5. 如果仍有问题，提供完整的错误日志以便进一步排查




