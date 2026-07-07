# Supabase

## 目录说明

| 路径 | 说明 |
|------|------|
| `migrations/` | **正式 schema 来源**，通过 `pnpm db:push` 应用到远程 |
| `*.sql`（根目录） | 历史参考副本，与 migrations 内容一致 |
| `functions/` | Edge Functions |

## 常用命令

```bash
supabase login
pnpm db:link          # 关联 MoonHome 项目（caiwzskepfycnoyplftf）
pnpm db:push          # 推送未执行的 migrations
supabase migration new <name>   # 新建 migration
```

`db push` 需要数据库密码，可在 `.env` 中设置 `SUPABASE_DB_PASSWORD`，或执行 link/push 时用 `-p` 传入。
