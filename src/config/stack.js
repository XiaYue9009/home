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
  {
    key: 'cloudflare-stream',
    emoji: '☁️',
    label: 'Cloudflare Stream',
    description: '全球 CDN 视频托管与转码，按分钟计费，适合站点内嵌播放',
    accent: '#f6821f',
    href: 'https://www.cloudflare.com/products/cloudflare-stream/',
    group: 'video',
    role: '视频托管候选（全球 CDN）',
    summary:
      '旅行页以外链视频收藏为主，未自建视频托管。Cloudflare Stream 适合以后把站内自制/转码视频放到全球 CDN 上播放。',
    usages: [
      '可作为旅行或其它栏目的自有视频托管方案',
      '提供转码、自适应码率与嵌入播放器',
      '与现有「外链视频」模式互补：外链灵感 vs 自有成片',
    ],
    setup: [
      '在 Cloudflare Dashboard 开通 Stream',
      '上传视频后获取播放 URL / iframe embed',
      '前端可用原生 video 或官方嵌入代码；密钥勿放进前端仓库',
      '若走服务端上传，可考虑再包一层 Edge Function',
    ],
    relatedPaths: [
      'src/views/CategoryPage/index.vue（旅行视频区）',
      'src/components/travel/TravelVideoCard/',
    ],
  },
  {
    key: 'mux',
    emoji: '🎥',
    label: 'Mux',
    description: '面向开发者的视频 API：上传、转码、播放与数据分析',
    accent: '#fa50b5',
    href: 'https://www.mux.com',
    group: 'video',
    role: '视频托管候选（开发者 API）',
    summary:
      'Mux 提供完整视频 API 与播放数据。本站尚未接入；若需要上传直传、播放分析或更细的编码控制，可优先评估 Mux。',
    usages: [
      '直传上传 + 自动转码的完整链路',
      '播放质量、完播率等数据分析',
      '适合做成「站内视频库」而不是单纯外链',
    ],
    setup: [
      '在 Mux Dashboard 创建环境并拿到 Token',
      '上传与签名逻辑放在服务端或 Supabase Edge Function',
      '前端只使用播放 ID / 签名 URL，不暴露写权限密钥',
    ],
    relatedPaths: [
      'src/components/travel/TravelVideoCard/',
      'supabase/functions/（可扩展上传代理）',
    ],
  },
  {
    key: 'bunny-stream',
    emoji: '🐰',
    label: 'Bunny Stream',
    description: '性价比高的视频 CDN / 流媒体托管，支持自适应码率',
    accent: '#ff671f',
    href: 'https://bunny.net/stream/',
    group: 'video',
    role: '视频托管候选（性价比）',
    summary:
      'Bunny Stream 以价格和易用性见长，适合个人站自建视频库。当前旅行内容仍走外链视频收藏，Bunny 作为低成本备选收录。',
    usages: [
      '低成本托管自制旅行/教程视频',
      '自适应码率流媒体，适合国内访问优化时对比选型',
      '可与 Cloudflare / Mux 一起做方案对比后再落地',
    ],
    setup: [
      '在 Bunny.net 开通 Stream Library',
      '上传视频后使用 Library 提供的 embed / HLS 地址',
      'API Key 仅放服务端；前端只读播放地址',
    ],
    relatedPaths: [
      'src/data/travel/',
      'src/components/travel/TravelVideoCard/',
    ],
  },
];

export const STACK_GROUPS = [
  { key: 'backend', label: '后端 / BaaS' },
  { key: 'animation', label: '动画' },
  { key: 'video', label: '视频托管' },
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
