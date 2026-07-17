/** 技术栈外链与站内用法说明 */

export const STACK_LINKS = [
  {
    key: 'supabase',
    emoji: '⚡',
    label: 'Supabase',
    description: '开源 Firebase 替代：Postgres、Auth、Storage、Edge Functions 一体',
    accent: '#3ecf8e',
    href: 'https://supabase.com',
    group: 'backend',
    role: '本站后端主框架',
    summary:
      'MoonHome 的云端能力都走 Supabase：数据库、RPC、Storage 与 Edge Functions。本地通过 .env 连接远程项目。',
    usages: [
      '后续优化卡片的云端读写（RPC / Postgres）',
      'LOL 常玩英雄列表的云端同步',
      'Markdown 图片兜底上传到 Storage（upcoming-images）',
      'Edge Function：GitHub 图床上传',
    ],
    setup: [
      '在项目根目录 .env 配置 PUBLIC_SUPABASE_URL 与 PUBLIC_SUPABASE_ANON_KEY',
      '前端通过 src/lib/supabase/client.js 的 getSupabaseClient() 创建客户端',
      '数据库变更写在 supabase/migrations/，用 pnpm db:link 关联项目后 pnpm db:push 推送',
      '需要 DB 密码时在 .env 设置 SUPABASE_DB_PASSWORD，或 push 时用 -p 传入',
      'Edge Function 密钥用 supabase secrets set 配置（如 GITHUB_TOKEN），再 supabase functions deploy',
    ],
    relatedPaths: [
      'src/lib/supabase/client.js',
      'src/lib/upcoming/cards-cloud.js',
      'src/lib/lol/featured-heroes-cloud.js',
      'supabase/migrations/',
      'supabase/functions/',
    ],
  },
  {
    key: 'animate-css',
    emoji: '✨',
    label: 'Animate.css',
    description: '即用型 CSS 动画库，站内入场与交互动效的基础',
    accent: '#f59e0b',
    href: 'https://animate.style',
    group: 'animation',
    role: '站内 CSS 动效基础库',
    summary:
      '全局引入 animate.css，配合 MotionEnter / ScrollReveal / triggerAnimate，统一页面入场、滚动显现与 hover 反馈。',
    usages: [
      '首页分类卡片、导航项的入场动画',
      '分类页列表（旅行视频、英雄卡、工具卡）的滚动显现',
      '按钮 hover 时的 rubberBand / pulse 等一次性反馈',
      '通过 presets.js 集中管理动画名、延迟与交错节奏',
    ],
    setup: [
      '依赖已在 package.json：animate.css',
      '在 src/main.js 中 import \'animate.css\'',
      '业务侧优先用 src/lib/motion/presets.js 的预设，避免散落硬编码动画名',
      '一次性播放用 triggerAnimate(node, animationName, { speed })',
    ],
    relatedPaths: [
      'src/main.js',
      'src/lib/motion/presets.js',
      'src/lib/motion/trigger.js',
      'src/components/motion/MotionEnter/',
      'src/components/motion/ScrollReveal/',
    ],
  },
  {
    key: 'lottiefiles',
    emoji: '🎬',
    label: 'LottieFiles',
    description: 'Lottie / DotLottie 动画资源与播放器，适合轻量矢量动效',
    accent: '#00d1c1',
    href: 'https://lottiefiles.com',
    group: 'animation',
    role: '矢量动画资源与播放器',
    summary:
      '通过 @lottiefiles/dotlottie-vue 播放 .lottie / Lottie 资源；首页 LottieDemo 用于展示轻量矢量动效。',
    usages: [
      'LottiePlayer 封装 DotLottieVue，统一尺寸与无障碍标签',
      '首页 LottieDemo 演示站内可嵌入的矢量动画',
      '可从 LottieFiles 下载或托管动画文件后替换本地资源',
    ],
    setup: [
      '依赖：@lottiefiles/dotlottie-vue',
      '使用组件 src/components/motion/LottiePlayer/index.vue',
      '传入 src（.lottie / json 地址）、loop、autoplay 等 props',
      '资源可放在 public/ 或使用 LottieFiles CDN 链接',
    ],
    relatedPaths: [
      'src/components/motion/LottiePlayer/index.vue',
      'src/components/home/LottieDemo/index.vue',
    ],
  },
  {
    key: 'motion-one',
    emoji: '🌊',
    label: 'Motion',
    description: '现代 Web 动画库（原 Framer Motion 生态），声明式编排动效',
    accent: '#ff0055',
    href: 'https://motion.dev',
    group: 'animation',
    role: '声明式动画参考（候选）',
    summary:
      '当前站内动效以 Animate.css + 自研 Motion* 组件为主，尚未接入 motion 包。收录于此作为更复杂编排（手势、布局动画）的备选方案。',
    usages: [
      '参考其声明式 API 设计站内 MotionEnter / ScrollReveal 的用法',
      '若后续需要手势拖拽、共享布局动画，可评估引入 motion',
      '与 Animate.css 可并存：CSS 入场 + JS 编排各司其职',
    ],
    setup: [
      '目前无需安装；需要时 pnpm add motion',
      '优先评估是否能用现有 presets + triggerAnimate 覆盖需求',
      '引入后建议封装一层，避免业务组件直接依赖第三方 API',
    ],
    relatedPaths: [
      'src/lib/motion/',
      'src/components/motion/',
    ],
  },
];

export const STACK_GROUPS = [
  { key: 'backend', label: '后端 / BaaS' },
  { key: 'animation', label: '动画' },
];

export function stackLinksByGroup() {
  return STACK_GROUPS.map((group) => ({
    ...group,
    links: STACK_LINKS.filter((link) => link.group === group.key),
  })).filter((group) => group.links.length > 0);
}

export function getStackLink(key) {
  return STACK_LINKS.find((link) => link.key === key) || null;
}

export function getStackGroupLabel(groupKey) {
  return STACK_GROUPS.find((group) => group.key === groupKey)?.label || '';
}
