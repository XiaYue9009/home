# MoonHome 🌙

站点地址：[`https://XiaYue9009.github.io/home/`](https://XiaYue9009.github.io/home/)

个人网站 —— 记录生活趣事、技术笔记与游戏杂谈。

基于 **Vite + Vue + Vue Router + Pinia + Tailwind CSS** 构建的单页应用，支持 Markdown 文章、LOL 对线笔记（Supabase 云端）、Giscus 评论，并通过 GitHub Actions 部署到 GitHub Pages。

## 功能

- 单页应用：路由切换无整页刷新
- 三大分类：生活 / 技术 / LOL
- Markdown 文章（构建时打包，后续可迁云端）
- LOL 英雄展示与对线笔记（Supabase 可选同步）
- Giscus 评论（GitHub Discussions）
- 三种主题 + 响应式布局
- GitHub Actions 自动部署

## 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:5173/home/
pnpm build
pnpm preview  # 预览 dist
```

## 发布新文章

在 `src/content/posts/` 下新建 `.md` 文件：

```markdown
---
title: '文章标题'
description: '摘要'
pubDate: 2026-06-23
category: tech
tags: [Vue, Vite]
---

正文内容...
```

`category` 可选：`life` | `tech` | `lol`

文章由 Pinia `usePostsStore` 在构建时通过 frontmatter 解析打包进前端。

## 配置评论（Giscus）

1. 在 GitHub 仓库 **Settings → General → Features** 中开启 **Discussions**
2. 打开 [giscus.app](https://giscus.app/zh-CN)，按向导生成配置
3. 复制 `.env.example` 为 `.env`，填入 `PUBLIC_GISCUS_*` 变量

## LOL 对线笔记云端同步（Supabase）

对线表格默认保存在浏览器 `localStorage`。配置 Supabase 后，数据会同步到云端。

1. 在 Supabase SQL Editor 执行 `supabase/lol_matchup_entries.sql`
2. 复制 Project URL 与 anon key 到 `.env` 的 `PUBLIC_SUPABASE_*`
3. GitHub Actions Secrets 中同样配置这两个变量

构建前会自动运行 `pnpm sync:lol-mid` 同步中单英雄列表。

## 部署到 GitHub Pages

GitHub Pages 项目页路径配置在 `vite.config.js`：

```js
export default defineConfig({
  base: '/home/',
});
```

推送 `main` 后，`.github/workflows/deploy.yml` 自动构建并发布。构建产物含 `404.html`（SPA fallback）。

站点地址：[`https://XiaYue9009.github.io/home/`](https://XiaYue9009.github.io/home/)

若使用自定义域名，将 `base` 改为 `'/'`。

## 项目结构

```
MoonHome/
├── index.html
├── vite.config.js
├── src/
│   ├── main.js           # 入口
│   ├── App.vue           # 根布局
│   ├── router/           # Vue Router
│   ├── stores/           # Pinia（posts 等）
│   ├── views/            # 页面
│   ├── components/       # Vue 组件
│   ├── content/posts/    # Markdown 文章
│   ├── lib/              # 工具与 API
│   └── styles/           # 全局样式
├── public/
└── scripts/
```

## License

MIT
