<script setup>
import { SITE } from '@/config/consts';
</script>

<template>
  <section id="about" class="page-shell page-shell--section">
    <h2 class="mb-6 font-display text-2xl font-bold text-heading">关于</h2>
    <div class="glass-card p-6 sm:p-8">
      <div class="prose-moon">
        <p>
          <strong>{{ SITE.title }}</strong> 是我的个人网站，用来记录生活趣事、技术笔记和游戏杂谈。
        </p>
        <h3>技术栈</h3>
        <ul>
          <li><strong>Vite</strong> — 构建工具</li>
          <li><strong>Vue + Vue Router + Pinia</strong> — 单页应用</li>
          <li><strong>Tailwind CSS</strong> — 样式</li>
          <li><strong>Markdown</strong> — 文章内容（后续迁移至云端编辑）</li>
          <li><strong>Supabase</strong> — 对线笔记等云端数据</li>
          <li><strong>Giscus</strong> — GitHub Discussions 评论</li>
        </ul>
        <h3>主题</h3>
        <p>右上角可切换三种主题：绿色自然风、白色简约风、黑色夜间柔和。</p>
        <h3>部署</h3>
        <p>代码托管在 GitHub，通过 GitHub Actions 自动构建并发布到 GitHub Pages。</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.prose-moon {
  h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-heading);
  }
}
</style>
