# MoonHome 动画实现地图

## 文件结构

```
src/
├── lib/motion/
│   ├── presets.js       # 各模块预设 + pickCycleAnimation + ENTRANCE_POOL
│   ├── trigger.js       # triggerAnimate、prefersReducedMotion
│   └── useScrollReveal.js
├── components/motion/
│   ├── MotionEnter/     # mount 时入场
│   ├── ScrollReveal/    # 滚动进入视口
│   └── PageEnter/       # 路由级淡入（App.vue）
└── styles/motion.scss

.agent-memory/animate-style/
```

## 组件 API

### PageEnter（路由）

包裹 `App.vue` 中 `<RouterView>`，`:key="route.fullPath"` 切换页面时快速 fadeIn。

### MotionEnter

```vue
<MotionEnter animation="zoomIn" :delay="200" tag="h1" speed="fast">...</MotionEnter>
```

### ScrollReveal

```vue
<ScrollReveal animation="fadeInUp" :delay="index * 85">...</ScrollReveal>
```

### triggerAnimate（hover 一次性）

```js
import { triggerAnimate } from '@/lib/motion/trigger.js';
triggerAnimate(event.currentTarget, 'tada', { speed: 'faster' });
```

## 已接入页面 / 模块

| 模块 | 文件 | 动画要点 |
|------|------|----------|
| 全局路由 | `App.vue` | PageEnter |
| 顶栏 | `AppHeader` | logo fadeInLeft、导航 fadeInDown stagger |
| 页脚 | `AppFooter` | ScrollReveal fadeInUp |
| 首页 | `HomePage` | Hero 多样入场、分类池轮播、flipInX 示例 |
| 分类 | `CategoryPage` | 5 个子栏目统一头图动画 + 各列表池 |
| 文章 | `PostPage` | 元信息递进、正文/评论滚动显现 |
| LOL 详情 | `LolHeroPage` | backIn 左右分栏、fadeInUp 面板 |
| 404 | `NotFoundPage` | bounceIn + swing hover |
| 文章卡 | `PostCard` | motion-hover-lift |
| 视频卡 | `TravelVideoCard` | motion-hover-zoom |
| 英雄卡 | `LolHeroCard` | motion-hover-zoom |

## 主题说明

用户要求暂不考虑 minimal / night 单独调参；`motion.scss` 仅在 `:root` / `[data-theme='nature']` 设置节奏。

## 依赖

- `animate.css@4.1.1`
- 无额外动画 JS 库
