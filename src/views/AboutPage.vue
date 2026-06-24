<script setup>
import { SITE } from '../config/consts';
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <h1 class="font-display text-3xl font-bold text-heading">关于 MoonHome</h1>
    <div class="prose-moon mt-8">
      <p>
        <strong>MoonHome</strong> 是我的个人网站，用来记录生活趣事、技术笔记和游戏杂谈。
      </p>
      <h2>技术栈</h2>
      <ul>
        <li><strong>Vite</strong> — 构建工具</li>
        <li><strong>Vue + Vue Router + Pinia</strong> — 单页应用</li>
        <li><strong>Tailwind CSS</strong> — 样式</li>
        <li><strong>Markdown</strong> — 文章内容（后续迁移至云端编辑）</li>
        <li><strong>Supabase</strong> — 对线笔记等云端数据</li>
        <li><strong>Giscus</strong> — GitHub Discussions 评论</li>
      </ul>
      <h2>主题</h2>
      <p>右上角可切换三种主题：绿色自然风、白色简约风、黑色夜间柔和。</p>
      <h2>部署</h2>
      <p>代码托管在 GitHub，通过 GitHub Actions 自动构建并发布到 GitHub Pages。</p>
      <h2>联系</h2>
      <p>
        GitHub：
        <a :href="SITE.github" target="_blank" rel="noopener noreferrer">{{ SITE.github }}</a>
      </p>
    </div>
  </div>
</template>
