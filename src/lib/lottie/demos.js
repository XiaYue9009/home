import { withBase } from '@/lib/lottie/paths.js';

/** 首页 Lottie 演示配置 — 资源来自 LottieFiles 免费动画，已缓存至 public/lottie/ */
export const LOTTIE_DEMOS = [
  {
    id: 'loop-loading',
    title: '循环加载',
    description: 'autoplay + loop，适合按钮等待、列表刷新',
    src: withBase('lottie/loading.json'),
    autoplay: true,
    loop: true,
    playOnHover: false,
    controls: null,
  },
  {
    id: 'hover-leaf',
    title: '悬停播放',
    description: 'playOnHover，鼠标移入才动',
    src: withBase('lottie/leaf.json'),
    autoplay: false,
    loop: true,
    playOnHover: true,
    controls: null,
  },
  {
    id: 'click-success',
    title: '点击反馈',
    description: '点击按钮播放一次成功动画',
    src: withBase('lottie/success.json'),
    autoplay: false,
    loop: false,
    playOnHover: false,
    controls: 'play-once',
  },
  {
    id: 'speed-rocket',
    title: '速度调节',
    description: '拖动滑块改变 playback speed',
    src: withBase('lottie/rocket.json'),
    autoplay: true,
    loop: true,
    playOnHover: false,
    controls: 'speed',
    defaultSpeed: 1,
  },
];
