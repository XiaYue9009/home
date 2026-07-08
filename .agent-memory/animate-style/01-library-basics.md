# Animate.css 基础备忘

> 来源：https://animate.style/ · 项目版本：`animate.css@4.1.1`

## 安装与引入

```js
// src/main.js
import 'animate.css';
```

## 基本用法

```html
<h1 class="animate__animated animate__fadeInUp">元素</h1>
```

- v4 起所有类名带 `animate__` 前缀
- 必须同时加 `animate__animated` + 动画名

## 常用工具类

| 类名 | 作用 |
|------|------|
| `animate__delay-2s` ~ `animate__delay-5s` | 延迟（也可用 CSS 变量 `--animate-delay`） |
| `animate__slow` / `animate__slower` | 2s / 3s |
| `animate__fast` / `animate__faster` | 800ms / 500ms |
| `animate__repeat-1` ~ `3` / `infinite` | 重复次数 |

## CSS 变量（v4+）

```css
:root {
  --animate-duration: 0.8s;
  --animate-delay: 0.2s;
  --animate-repeat: 2;
}
```

```js
element.style.setProperty('--animate-duration', '0.5s');
```

## 与 JS 配合

```js
element.classList.add('animate__animated', 'animate__bounceOutLeft');
element.addEventListener('animationend', handler, { once: true });
```

官方 `animateCSS(element, animation)` Promise 封装见 `src/lib/motion/trigger.js`。

## 最佳实践（文档强调）

1. **有意义** — 入场/出场表达状态变化，attention seekers 仅用于引导注意
2. **不要动画大容器** — 避免整页/大块区域大幅位移
3. **不要动画 html/body** — 包一层再动画
4. **避免 infinite** — 除 loading 等极少数场景
5. **inline 元素** — 需 `display: inline-block` 才能动画
6. **overflow** — 位移动画可能在父级加 `overflow: hidden`
7. **prefers-reduced-motion** — 库内置支持，**不要禁用**

## 动画分类速查

| 场景 | 推荐 |
|------|------|
| 首屏标题 | `fadeInDown` / `fadeInUp` |
| 卡片列表 | `fadeInUp` + stagger delay |
| 侧栏/章节标题 | `fadeIn` / `fadeInLeft` |
| 强调按钮 | `pulse`（单次，hover 触发） |
| 弹窗关闭 | `fadeOut` / `zoomOut` |
| 不宜使用 | `bounceIn*`（太跳）、`lightSpeed*`（太夸张）、大元素 `slideIn*` |
