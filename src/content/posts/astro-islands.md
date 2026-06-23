---
title: 'Astro 群岛架构：静态站也能做复杂交互'
description: '用 Astro Islands 在博客中嵌入 Vue 交互组件，兼顾性能与体验。'
pubDate: 2026-06-20
category: tech
tags: [Astro, Vue, 前端]
---

## 什么是群岛架构？

Astro 默认输出静态 HTML，只有标记了 `client:*` 的组件才会在浏览器中加载 JavaScript。这样文章页依然轻量，交互部分按需「激活」。

## 适用场景

- 代码 Live Demo
- 滚动动画、粒子背景
- 评论区、标签筛选

## 示例

在 `.astro` 页面中：

```astro
import DemoCard from '../components/DemoCard.vue';

<DemoCard client:visible />
```

`client:visible` 表示元素进入视口后再加载，非常适合长文中的演示组件。
