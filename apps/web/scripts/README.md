# Camp Database Ingestion Scripts

营地数据批量采集与维护脚本。所有脚本通过 `tsx` 执行,使用 Supabase service role key 直接写入数据库(绕过 RLS)。

## 目录结构

```
scripts/
├── lib/
│   ├── ai/                       # OpenAI 调用统一封装
│   │   ├── client.ts             # TrackedOpenAI 客户端(retry + 成本追踪)
│   │   ├── schemas/              # Zod schema 定义所有 AI 输出
│   │   ├── prompts/              # 每个任务一个独立模块
│   │   ├── examples/             # Few-shot 示例
│   │   └── index.ts              # 统一入口
│   ├── sources/
│   │   ├── doc.ts                # DOC ArcGIS API 客户端 + 字段映射
│   │   └── google.ts             # Google Places API 客户端(限流)
│   ├── supabase-admin.ts         # Service role Supabase 客户端
│   ├── dedupe.ts                 # 去重逻辑(source+source_id 唯一 + 模糊匹配)
│   ├── quality.ts                # data_quality_score 计算
│   ├── nz-regions.ts             # 26 个新西兰区域常量
│   ├── job-tracker.ts            # 写 import_jobs 记录
│   └── cli.ts                    # 通用命令行参数解析
│
├── import-doc-camps.ts           # Phase 2: DOC 官方导入(自动发布)
├── enrich-google.ts              # Phase 3: 用 Google 丰富 DOC 营地
├── import-google-camps.ts        # Phase 4: Google-only 采集(待人工审核)
└── refresh-google.ts             # 月度刷新 Google 字段(TOS 合规)
```

## 用法

### 准备(执行一次)

1. 在 Supabase Dashboard SQL Editor 执行 `apps/web/migrate-camps-schema-v2.sql`
2. 在 `apps/web/.env.local` 添加 `SUPABASE_SERVICE_ROLE_KEY`(从 Supabase Dashboard → Settings → API 复制 service_role key)
3. `pnpm install`(在 `apps/web/`)

### 常用命令

```bash
cd apps/web

# 试运行(不写库,估算成本)
pnpm import:doc -- --dry-run
pnpm enrich:google -- --dry-run --limit 10
pnpm import:google -- --dry-run --region Auckland

# 真实运行
pnpm import:doc                                       # 一次性全量 DOC ~250 个
pnpm enrich:google -- --limit 50                      # 先丰富 50 个看效果
pnpm enrich:google                                    # 全量丰富
pnpm import:google -- --region Auckland --keyword "Holiday Park"
pnpm import:google -- --region Otago --keyword "Campground"

# 月度刷新(TOS 要求 30 天内刷新 Google 字段)
pnpm refresh:google
```

### 通用 CLI 参数

所有脚本支持:

- `--dry-run`           不写库,只打印预览
- `--limit <N>`         限制处理条数(用于测试)
- `--verbose`           详细日志(单条解析过程)
- `--no-ai`             跳过 OpenAI 调用(只用规则推断)

## 依赖

- `@supabase/supabase-js` — DB 客户端
- `openai` (≥4.73) — AI 调用,需要 `zodResponseFormat` helper
- `zod` — Schema 校验
- `p-limit` — 并发控制
- `p-retry` — 重试
- `bottleneck` — Google API 限流
- `dotenv` — 加载 `.env.local`

## 注意事项

1. **Service Role Key 极敏感** — 仅 server/scripts 使用,绝不可加 `NEXT_PUBLIC_` 前缀
2. **Google Places TOS** — 非 `place_id` 字段(rating/reviews/photos)必须 30 天内刷新或显示在 Google Map 内。`refresh-google.ts` 用于满足这一要求
3. **OpenAI 成本** — 完整跑一次(1000 营地)预估 < $1。Dry-run 会先估算成本,真实运行前请确认
