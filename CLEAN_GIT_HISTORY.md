# 清理 Git 历史中的敏感信息

## 问题

GitHub 检测到提交 `803d687` 中包含 OpenAI API Key，阻止了推送。

## 解决方案（3 选 1）

### 方案 1：使用 GitHub 提供的 URL（最简单，如果 API Key 已撤销）

如果 API Key 已经被撤销，可以直接使用 GitHub 提供的 URL 来允许推送：

1. 访问：https://github.com/Anping2017/campingnext/security/secret-scanning/unblock-secret/35mLguzfgCJBayh9NJef8RzUCE6
2. 确认 API Key 已被撤销
3. 点击允许推送
4. 然后重新执行 `git push -u origin main`

### 方案 2：重写 Git 历史（完全清理）

如果希望完全移除敏感信息，需要重写 Git 历史：

```powershell
# 1. 备份当前分支（可选但推荐）
git branch backup-main

# 2. 使用 filter-branch 移除敏感文件
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch 'apps/web/ENV_SETUP.md' 'apps/web/修复API密钥问题.md' 'apps/web/配置API密钥.md' '快速配置API密钥.txt'" `
  --prune-empty --tag-name-filter cat -- --all

# 3. 清理备份引用
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. 强制推送（⚠️ 会重写远程历史）
git push origin --force --all
```

### 方案 3：创建新分支（推荐，最简单）

如果不想重写历史，可以创建一个新的干净分支：

```powershell
# 1. 创建新分支（从当前状态）
git checkout -b main-clean

# 2. 确保所有敏感文件已删除
git add -A
git commit -m "security: remove all sensitive information"

# 3. 推送新分支
git push -u origin main-clean

# 4. 在 GitHub 上将 main-clean 设置为默认分支
# 5. 删除旧的 main 分支（可选）
```

## 推荐操作

**如果 API Key 已被撤销**：使用方案 1（最简单）

**如果需要完全清理历史**：使用方案 2

**如果不想重写历史**：使用方案 3

