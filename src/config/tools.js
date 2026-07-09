/** Markdown 编辑器工具配置 */
export const MARKDOWN_EDITOR_TOOL = {
  key: 'markdown-editor',
  emoji: '✏️',
  label: 'Markdown 编辑器',
  description: '可视化与 Markdown 双模式，Typora 风格快捷键，支持图片上传与自动保存',
  accent: '#6366f1',
  demoKey: 'markdown-editor',
  demo: {
    hint: '可直接在下方编辑体验，Ctrl + / 切换 Markdown 模式',
    content: `# Markdown 编辑器 Demo

试试 **粗体**、*斜体* 和 \`行内代码\`

- 无序列表
- 支持快捷键插入

> 引用块示例

按 **Ctrl + /** 切换到 Markdown 源码模式`,
  },
  features: [
    '可视化 / Markdown 双模式，Ctrl + / 一键切换',
    'Typora 风格快捷键：加粗、标题、列表、引用等',
    '图片粘贴或上传：支持常见图片格式，单张 100MB 以内；优先 GitHub 图床，Supabase 兜底',
    '内容双向同步：HTML ↔ Markdown 实时转换',
    '首行标题锁定（业务场景下防止误删标题）',
  ],
  implementation: [
    '可视化层用 contenteditable + document.execCommand 处理基础格式',
    'Markdown 层用 textarea，快捷键逻辑独立于 visual-shortcuts / markdown-shortcuts',
    'htmlToMarkdown / markdownToHtml 做模式切换时的内容桥接',
    '图片上传走 lib/editor/image-upload，优先 GitHub 图床 API，其次 Supabase Storage',
    '作为通用组件 MarkdownEditor，由业务页传入 modelValue 与 lockFirstHeading',
  ],
};

/** GitHub 图床工具配置 */
export const GITHUB_IMAGE_TOOL = {
  key: 'github-image',
  emoji: '🖼️',
  label: 'GitHub 图床',
  description: 'Element Plus 拖拽上传，图片写入 GitHub 仓库并通过 jsDelivr 分发，支持一键复制外链',
  accent: '#22c55e',
  demoKey: 'github-image',
  features: [
    'el-upload 拖拽/点击上传，支持常见图片格式，单张不超过 100MB',
    '一键复制图片地址或 Markdown 链接，便于插入文章',
    '通过 GitHub Contents API 写入 picgo_moonhome 资源仓库',
    '默认 jsDelivr CDN 外链，适合 Markdown / README 引用',
    '本地与线上统一走 Supabase Edge Function，配置一次两端可用',
    '与 Markdown 编辑器联动，粘贴图片自动上传并插入链接',
  ],
  implementation: [
    'lib/github/image-bed.js 统一请求 Supabase Edge Function upload-github-image',
    'GITHUB_TOKEN 仅存 Supabase Secret，前端只配置 PUBLIC_SUPABASE_URL / ANON_KEY',
    'PUBLIC_GITHUB_UPLOAD_SECRET 与 Supabase GITHUB_UPLOAD_SECRET 保持一致，防止接口滥用',
    'Edge Function 调用 GitHub Contents API 写入仓库，返回 jsDelivr CDN 地址',
    'lib/editor/image-upload.js 优先 GitHub 图床，Supabase Storage 作为兜底',
  ],
  links: {
    repo: 'https://github.com/XiaYue9009/picgo_moonhome',
  },
};

export const SYSTEM_TOOLS = [MARKDOWN_EDITOR_TOOL, GITHUB_IMAGE_TOOL];
