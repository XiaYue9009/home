# MoonHome 🌙

个人网站 —— 记录生活趣事、技术笔记与游戏杂谈。

基于 **Astro + Vue + Tailwind CSS** 构建，支持 Markdown 写文章、Vue 群岛交互、Giscus 评论，并通过 GitHub Actions 部署到 GitHub Pages。

## 功能

- 三大分类：生活 / 技术 / 游戏
- Markdown 内容管理（Content Collections）
- Vue 交互组件示例（首页月亮动画、涟漪按钮）
- Giscus 评论（GitHub Discussions）
- 深色主题 + 响应式布局
- GitHub Actions 自动部署

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（自动打开系统浏览器）
pnpm dev

# 构建
pnpm build

# 预览构建结果
pnpm preview
```

开发服务器默认运行在 http://localhost:4321

## 发布新文章

在 `src/content/posts/` 下新建 `.md` 文件：

```markdown
---
title: '文章标题'
description: '摘要'
pubDate: 2026-06-23
category: tech
tags: [Astro, Vue]
---

正文内容...
```

`category` 可选：`life` | `tech` | `lol`

## 配置评论（Giscus）

1. 在 GitHub 仓库 **Settings → General → Features** 中开启 **Discussions**
2. 打开 [giscus.app](https://giscus.app/zh-CN)，按向导生成配置
3. 复制 `.env.example` 为 `.env`，填入 `PUBLIC_GISCUS_*` 变量

## LOL 对线笔记云端同步（Supabase）

对线表格默认保存在浏览器 `localStorage`。配置 Supabase 后，数据会同步到云端，任意设备打开都是同一份笔记。

### 1. 创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com) 注册并新建项目
2. 进入 **SQL Editor**，执行仓库中的 `supabase/lol_matchups.sql`
3. 在 **Project Settings → API** 复制：
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** key → `PUBLIC_SUPABASE_ANON_KEY`

### 2. 本地配置

复制 `.env.example` 为 `.env`，填入上述两个变量，重启 `pnpm dev`。

未配置时功能不变，仍仅本地保存。

### 3. 线上部署

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

推送 `main` 后重新部署即可。线上与本地修改会自动合并（以较新的 `updated_at` 为准）。

> 说明：anon key 会打包进前端，此表仅存放对线笔记，请勿存放敏感信息。

## 部署到 GitHub Pages

### 1. 修改站点地址

编辑 `astro.config.mjs`：

```js
export default defineConfig({
  site: 'https://XiaYue9009.github.io',
  base: '/home/',  // GitHub Pages 项目页路径
});
```

编辑 `src/consts.ts` 中的 `github` 链接。

### 2. 推送代码

```bash
git init
git add .
git commit -m "init: MoonHome personal site"
git branch -M main
git remote add origin https://github.com/XiaYue9009/home.git
git push -u origin main
```

### 3. 开启 GitHub Pages

仓库 **Settings → Pages → Build and deployment**：

- Source: **GitHub Actions**

推送 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布。

站点地址：`https://XiaYue9009.github.io/home/`

## 改用 Vercel / Cloudflare Pages

1. 导入 GitHub 仓库
2. Build command: `pnpm build`
3. Output directory: `dist`
4. 若使用自定义域名，将 `astro.config.mjs` 中 `base` 改为 `'/'`

## 项目结构

```
MoonHome/
├── src/
│   ├── components/     # Astro / Vue 组件
│   ├── content/
│   │   └── posts/      # Markdown 文章
│   ├── layouts/        # 页面布局
│   ├── pages/          # 路由页面
│   └── styles/         # 全局样式
├── public/             # 静态资源
├── astro.config.mjs
└── package.json
```

## License

MIT
