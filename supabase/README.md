# Supabase

## 目录说明

| 路径 | 说明 |
|------|------|
| `migrations/` | **正式 schema 来源**，通过 `pnpm db:push` 应用到远程 |
| `*.sql`（根目录） | 历史参考副本，与 migrations 内容一致 |
| `functions/` | Edge Functions（如 `fetch-douyin-collection`、`upload-github-image`） |

## Edge Function：GitHub 图床

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxx
# 可选
supabase secrets set GITHUB_REPO=XiaYue9009/picgo_moonhome
supabase secrets set GITHUB_UPLOAD_SECRET=your-secret
supabase functions deploy upload-github-image
```

前端需配置 `PUBLIC_SUPABASE_URL`、`PUBLIC_SUPABASE_ANON_KEY`；若设置了 `GITHUB_UPLOAD_SECRET`，同步设置 `PUBLIC_GITHUB_UPLOAD_SECRET`。

## 常用命令

```bash
supabase login
pnpm db:link          # 关联 MoonHome 项目（caiwzskepfycnoyplftf）
pnpm db:push          # 推送未执行的 migrations
supabase migration new <name>   # 新建 migration
```

`db push` 需要数据库密码，可在 `.env` 中设置 `SUPABASE_DB_PASSWORD`，或执行 link/push 时用 `-p` 传入。
