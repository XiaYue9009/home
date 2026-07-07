const STORAGE_KEY = 'moonhome-upcoming-markdown';

export const DEFAULT_UPCOMING_MARKDOWN = `# 后续优化

计划中的功能与体验改进，持续迭代中。

## 待办

- Markdown 文章迁移至云端编辑
- LOL 对线笔记批量管理与导入导出
- 旅行收藏分类与搜索
- 首页与分类页布局统一优化

## 笔记

在此记录想法与进度…
`;

export function loadUpcomingMarkdown() {
  if (typeof localStorage === 'undefined') return DEFAULT_UPCOMING_MARKDOWN;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ?? DEFAULT_UPCOMING_MARKDOWN;
  } catch {
    return DEFAULT_UPCOMING_MARKDOWN;
  }
}

export function saveUpcomingMarkdown(content) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, content);
}
