# 从 Git 历史中移除敏感信息

## ⚠️ 重要：API Key 已泄露

GitHub 检测到代码中包含了真实的 OpenAI API Key。虽然我们已经从当前代码中移除了，但这些信息仍然存在于 Git 历史记录中。

## 🔒 立即行动

### 1. 在 OpenAI 平台撤销旧 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 找到泄露的 API Key
3. 立即删除或撤销它
4. 生成新的 API Key

### 2. 从 Git 历史中移除敏感信息（可选但推荐）

如果需要完全清理 Git 历史，可以使用 `git filter-branch` 或 `BFG Repo-Cleaner`：

```bash
# 使用 git filter-branch（较慢但不需要额外工具）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/web/修复API密钥问题.md apps/web/配置API密钥.md 快速配置API密钥.txt" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（⚠️ 会重写历史，需要团队协作）
git push origin --force --all
```

**注意**：重写 Git 历史会影响所有协作者，请谨慎操作。

### 3. 更简单的方案：只清理当前提交

如果不想重写历史，可以：
1. 确保所有敏感文件已从 `.gitignore` 中排除
2. 确保当前提交不包含敏感信息（已完成 ✅）
3. 继续正常推送

## ✅ 已完成的操作

- ✅ 删除了包含真实 API Key 的文件
- ✅ 更新了文档，使用占位符替代真实 Key
- ✅ 更新了 `.gitignore`，防止未来误提交

## 🚀 现在可以安全推送了

```bash
git push -u origin main
```

## 📝 最佳实践

1. **永远不要**在代码中硬编码 API Key
2. **永远不要**将 `.env.local` 提交到 Git
3. **使用环境变量**存储敏感信息
4. **使用占位符**在文档中展示配置示例

