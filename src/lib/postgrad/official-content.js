const officialModules = import.meta.glob('../../content/postgrad/*.html', {
  query: '?raw',
  eager: true,
});

const OFFICIAL_SOURCE = {
  requirements: {
    url: 'https://yzs.qust.edu.cn/info/1090/1680.htm',
    label: '青岛科技大学 2026 年硕士研究生招生章程',
    publishedAt: '2025-09-29',
  },
  'charter-2026': {
    url: 'https://yzs.qust.edu.cn/info/1090/1680.htm',
    label: '青岛科技大学 2026 年硕士研究生招生章程',
    publishedAt: '2025-09-29',
  },
  'subject-change': {
    url: 'https://yzs.qust.edu.cn/info/1090/1668.htm',
    label: '关于调整 2026 年硕士研究生招生考试初试科目的通知',
    publishedAt: '2025-07-08',
  },
  'major-catalog': {
    url: 'https://yzs.qust.edu.cn/info/1090/1679.htm',
    label: '青岛科技大学 2026 年硕士研究生招生专业目录及参考书目',
    publishedAt: '2025-09-29',
  },
};

/** 阅读区内链接统一新标签打开 */
function enhanceOfficialLinks(html) {
  if (!html) return '';
  return html.replace(/<a\b([^>]*)>/gi, (_, attrs) => {
    let next = attrs
      .replace(/\s*target\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s*rel\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<a${next} target="_blank" rel="noopener noreferrer">`;
  });
}

export function getOfficialPanelHtml(key) {
  const match = Object.entries(officialModules).find(([path]) => path.endsWith(`/${key}.html`));
  return enhanceOfficialLinks(match?.[1]?.default || '');
}

export function getOfficialPanelMeta(key) {
  return OFFICIAL_SOURCE[key] || null;
}
