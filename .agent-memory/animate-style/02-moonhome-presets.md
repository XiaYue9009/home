# MoonHome 动画预设

当前仅针对 **nature（竹子自然风）** 调参，minimal / night 使用同一套节奏。

## 全局节奏

| 变量 | 值 |
|------|-----|
| `--motion-duration` | 0.85s |
| `--motion-stagger` | 85ms |

定义：`src/styles/motion.scss`

## 动画池（列表轮播）

`pickCycleAnimation(index, pool)` — `src/lib/motion/presets.js`

| 池名 | 动画序列 |
|------|----------|
| `categoryCard` | fadeInUp → zoomIn → backInUp → fadeInLeft → fadeInRight |
| `post` | fadeInUp → fadeInLeft → fadeInRight → zoomIn |
| `hero` | backInUp → zoomIn → fadeInUp → backInLeft → backInRight |
| `video` | zoomIn → fadeInUp → fadeInLeft → fadeInRight → backInUp |

## 各模块预设

### 首页 `MOTION_HERO` + `MOTION_HOME`

| 元素 | 动画 |
|------|------|
| Hero 标签 | fadeInDown |
| 标题 | zoomIn |
| 描述 | fadeInLeft |
| CTA | backInUp · hover pulse |
| 分类卡 | 动画池轮播 · hover tada |
| 交互示例 | flipInX |
| 文章标题 | fadeInRight |
| 关于 / GitHub | slideInLeft / slideInRight |

### 分类页 `MOTION_CATEGORY`

| 元素 | 动画 |
|------|------|
| 图标 | zoomIn |
| 标题 / 描述 | fadeInUp / fadeIn |
| Upcoming 区块 | 新建 `zoomIn`；各卡片 `fadeInUp`/`zoomIn`/`fadeIn` stagger |
| 视频 / 英雄列表 | 各自动画池 + stagger |
| 加载中 | pulse slow |
| 刷新按钮 hover | rubberBand |

### 文章页 `MOTION_POST`

| 元素 | 动画 |
|------|------|
| 面包屑 | fadeInDown |
| 标题 | fadeInUp |
| 描述 | fadeInLeft |
| 日期 | fadeIn |
| 标签 | fadeInUp stagger |
| 正文 | fadeIn（滚动触发） |
| 评论 | slideInUp + fadeInUp |

### LOL 详情 `MOTION_LOL_DETAIL`

| 元素 | 动画 |
|------|------|
| 返回 | fadeInLeft |
| 立绘 | backInLeft |
| 主栏 | backInRight |
| 对线表 | fadeInUp |
| 加载 | pulse |

### 404 `MOTION_NOT_FOUND`

bounceIn → fadeInUp → fadeIn → backInUp · 按钮 hover swing

### 布局 `MOTION_LAYOUT`

| 元素 | 动画 |
|------|------|
| 路由切换 | PageEnter fadeIn faster |
| Logo | fadeInLeft |
| 导航项 | fadeInDown stagger |
| 页脚 | fadeInUp（滚动触发） |

## 悬停类

- `motion-hover-lift` — 文章卡、分类卡
- `motion-hover-zoom` — 视频卡、英雄卡

## 扩展指南

1. 新列表 → 加入 `ENTRANCE_POOL` 或复用现有池
2. 新页面标题 → `MotionEnter` + `MOTION_*` 常量
3. 滚动区块 → `ScrollReveal`
4. 路由淡入 → 已在 `App.vue` 的 `PageEnter` 统一处理
