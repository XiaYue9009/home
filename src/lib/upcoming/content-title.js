const DEFAULT_NOTE_PREFIX = '优化笔记';

export function extractTitleFromContent(content = '') {
  const match = String(content).match(/^#\s+(.+?)\s*$/m);
  return match?.[1]?.trim() || '未命名';
}

export function nextDefaultNoteTitle(cards = []) {
  const nums = cards
    .map((card) => {
      const title = String(card.title || extractTitleFromContent(card.content));
      const match = title.match(new RegExp(`^${DEFAULT_NOTE_PREFIX}\\s*\\((\\d+)\\)$`));
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => value > 0);

  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${DEFAULT_NOTE_PREFIX} (${next})`;
}

export function buildDefaultNoteContent(cards = []) {
  const title = nextDefaultNoteTitle(cards);
  return `# ${title}\n\n`;
}

export function ensureContentHasH1(content = '', fallbackTitle = '未命名') {
  const text = String(content || '');
  const trimmed = text.trim();

  if (!trimmed) {
    return `# ${fallbackTitle}\n\n`;
  }

  if (/^#\s+/m.test(trimmed)) {
    return text.endsWith('\n') ? text : `${text}\n`;
  }

  return `# ${fallbackTitle}\n\n${text.replace(/^\n+/, '')}`;
}

export function normalizeNoteContent(content = '', fallbackTitle = '未命名') {
  const ensured = ensureContentHasH1(content, fallbackTitle);
  const lines = ensured.split('\n');
  const firstLine = lines[0]?.replace(/^#{1,6}\s+/, '').trim() || fallbackTitle;
  lines[0] = `# ${firstLine}`;
  const body = lines.join('\n');
  return body.endsWith('\n') ? body : `${body}\n`;
}

export function isFirstMarkdownLine(start = 0) {
  return start <= 0;
}
