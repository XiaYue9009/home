# LottieFiles 集成备忘

> 官网：[LottieFiles](https://lottiefiles.com/) · 编辑器：[app.lottiefiles.com](https://app.lottiefiles.com/) · Vue 文档：[dotLottie Vue](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-vue/)

## 是什么

Lottie 是基于 JSON 的**矢量动画**格式，文件小、任意缩放不失真，适合 loading、成功反馈、空状态、微交互等。详见 [What is Lottie](https://lottiefiles.com/what-is-lottie)。

## 本项目依赖

```bash
pnpm add @lottiefiles/dotlottie-vue
```

## 文件地图

| 路径 | 说明 |
|------|------|
| `src/components/motion/LottiePlayer/` | 封装 `DotLottieVue` |
| `src/components/home/LottieDemo/` | 首页 4 个交互 demo |
| `src/lib/lottie/demos.js` | demo 配置 |
| `src/lib/lottie/paths.js` | `withBase()` 处理 `/home/` base |
| `public/lottie/*.json` | 本地缓存的免费动画 |

## 组件用法

```vue
<LottiePlayer
  src="/home/lottie/loading.json"
  autoplay
  loop
  :speed="1"
  play-on-hover
/>
```

或通过 `withBase('lottie/loading.json')` 生成路径。

暴露方法：`play()` / `pause()` / `stop()`（template ref）。

## 首页 Demo 列表

| Demo | 能力 |
|------|------|
| 循环加载 | autoplay + loop |
| 悬停播放 | playOnHover |
| 点击反馈 | ref.play() 单次 |
| 速度调节 | speed prop + range |

## 获取新动画

1. 在 [LottieFiles 社区](https://lottiefiles.com/free-animations) 或 [app.lottiefiles.com](https://app.lottiefiles.com/) 挑选/创作
2. 下载 `.json` 或 `.lottie` 到 `public/lottie/`
3. 在 `demos.js` 增加一项，或页面中直接引用

## 与 Animate.css 的分工

- **Animate.css**：DOM 入场/滚动、CSS 悬停
- **Lottie**：复杂矢量角色动画、loading、插画级动效

## 许可

`public/lottie/` 内资源来自 LottieFiles 免费动画（Lottie Simple License），仅供本站演示；商用前请核对各动画页面授权说明。
