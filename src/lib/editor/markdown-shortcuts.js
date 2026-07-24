import { nextTick } from 'vue';
import { applyMarkdownListKeydown } from '@/lib/editor/list-editing.js';

function isBracketLeft(event) {
  return event.code === 'BracketLeft' || event.key === '[' || event.key === '{';
}

function isBracketRight(event) {
  return event.code === 'BracketRight' || event.key === ']' || event.key === '}';
}

function promptColor(defaultColor = '#e74c3c') {
  const value = window.prompt('字体颜色（如 #e74c3c）', defaultColor);
  if (!value?.trim()) return null;
  return value.trim();
}

export const MARKDOWN_SHORTCUTS = [
  { keys: 'Ctrl+B', label: '粗体', icon: 'bold' },
  { keys: 'Ctrl+I', label: '斜体', icon: 'italic' },
  { keys: 'Ctrl+K', label: '链接', icon: 'link' },
  { keys: 'Ctrl+Shift+K', label: '代码块', icon: 'code' },
  { keys: 'Ctrl+1~6', label: '标题级别', icon: 'heading' },
  { keys: 'Ctrl+T', label: '表格', icon: 'table' },
  { keys: 'Ctrl+Shift+[', label: '有序列表', icon: 'ol' },
  { keys: 'Ctrl+Shift+]', label: '无序列表', icon: 'ul' },
  { keys: 'Tab', label: '列表下级缩进', icon: 'ol' },
  { keys: 'Shift+Tab', label: '列表上级反缩进', icon: 'ul' },
  { keys: 'Ctrl+Shift+Enter', label: '有序列表完成切换', icon: 'ol' },
  { keys: 'Ctrl+Shift+C', label: '字体颜色', icon: 'color' },
  { keys: 'Ctrl+Shift+I', label: '插入图片', icon: 'image' },
  { keys: 'Ctrl+/', label: '切换富文本/Markdown', icon: 'markdown' },
  { keys: 'Ctrl+Shift+M', label: '公式块', icon: 'math' },
];

const TABLE_TEMPLATE = `| 列 1 | 列 2 | 列 3 |
| --- | --- | --- |
|  |  |  |
|  |  |  |
`;

function isModKey(event) {
  return event.ctrlKey || event.metaKey;
}

function replaceRange(value, start, end, insert) {
  return `${value.slice(0, start)}${insert}${value.slice(end)}`;
}

function setSelection(textarea, start, end) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
}

function wrapInline(textarea, value, before, after, placeholder) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  const insert = `${before}${selected}${after}`;
  const next = replaceRange(value, start, end, insert);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { next, cursorStart, cursorEnd };
}

function insertBlock(textarea, value, block) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = value.slice(0, start);
  const after = value.slice(end);
  const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
  const insert = `${needsLeadingNewline ? '\n' : ''}${block}\n`;
  const next = `${before}${insert}${after}`;
  const cursor = before.length + insert.length;
  return { next, cursorStart: cursor, cursorEnd: cursor };
}

function setHeading(textarea, value, level) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const lineEndPos = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, lineEndPos).replace(/^#{1,6}\s+/, '');
  const safeLevel = lineStart === 0 ? 1 : level;
  const prefix = `${'#'.repeat(safeLevel)} `;
  const next = replaceRange(value, lineStart, lineEndPos, `${prefix}${line}`);
  const cursorStart = lineStart + prefix.length;
  const cursorEnd = cursorStart + line.length;
  return { next, cursorStart, cursorEnd };
}

function insertLink(textarea, value) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || '链接文字';
  const insert = `[${selected}](https://)`;
  const next = replaceRange(value, start, end, insert);
  const urlStart = start + selected.length + 3;
  const urlEnd = urlStart + 8;
  return { next, cursorStart: urlStart, cursorEnd: urlEnd };
}

function insertCodeBlock(textarea, value) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const insert = selected
    ? `\`\`\`\n${selected}\n\`\`\``
    : '```\n\n```';
  const next = replaceRange(value, start, end, insert);
  if (selected) {
    return { next, cursorStart: start + insert.length, cursorEnd: start + insert.length };
  }
  return { next, cursorStart: start + 4, cursorEnd: start + 4 };
}

function insertMathBlock(textarea, value) {
  return insertBlock(textarea, value, '$$\n\n$$');
}

function insertTable(textarea, value) {
  return insertBlock(textarea, value, TABLE_TEMPLATE);
}

function insertImage(textarea, value, url, alt = '图片') {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const insert = `![${alt}](${url})`;
  const next = replaceRange(value, start, end, insert);
  return { next, cursorStart: start + insert.length, cursorEnd: start + insert.length };
}

function applyTextColor(textarea, value, color) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || '文字';
  const insert = `<span style="color: ${color}">${selected}</span>`;
  const next = replaceRange(value, start, end, insert);
  return { next, cursorStart: start + insert.length, cursorEnd: start + insert.length };
}

const ORDERED_LIST_RE = /^\d+\.\s+/;
const UNORDERED_LIST_RE = /^[-*+]\s+/;

function stripListPrefix(line) {
  return line.replace(ORDERED_LIST_RE, '').replace(UNORDERED_LIST_RE, '');
}

function toggleMarkdownList(textarea, value, listType) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  if (blockStart === 0) return null;

  let blockEnd = end;

  if (end > start && value.slice(start, end).includes('\n')) {
    const after = value.indexOf('\n', end);
    blockEnd = after === -1 ? value.length : after;
  } else {
    const lineEnd = value.indexOf('\n', Math.max(end - 1, blockStart));
    blockEnd = lineEnd === -1 ? value.length : lineEnd;
  }

  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  const isOrdered = listType === 'ordered';
  const activeRe = isOrdered ? ORDERED_LIST_RE : UNORDERED_LIST_RE;
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');
  const allActive = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => activeRe.test(line));

  const newLines = lines.map((line) => {
    if (line.trim() === '') return line;
    const stripped = stripListPrefix(line);
    if (allActive) return stripped;
    return isOrdered ? `${stripped}` : `- ${stripped}`;
  });

  if (!allActive && isOrdered) {
    let order = 0;
    for (let i = 0; i < newLines.length; i += 1) {
      if (newLines[i].trim() === '') continue;
      order += 1;
      newLines[i] = `${order}. ${newLines[i]}`;
    }
  }

  const insert = newLines.join('\n');
  const next = replaceRange(value, blockStart, blockEnd, insert);
  const cursorStart = blockStart;
  const cursorEnd = blockStart + insert.length;
  return { next, cursorStart, cursorEnd };
}

/**
 * 处理 Typora 风格 Markdown 快捷键。
 * @returns {boolean} 是否已处理该按键
 */
export function applyMarkdownShortcut(event, textarea, { value, setValue, onInsertImage } = {}) {
  if (!textarea) return false;

  if (applyMarkdownListKeydown(event, textarea, { value, setValue })) {
    return true;
  }

  if (!isModKey(event)) return false;

  const key = event.key.toLowerCase();
  const shift = event.shiftKey;
  let result = null;

  if (key === 'b') {
    result = wrapInline(textarea, value, '**', '**', '粗体');
  } else if (key === 'i') {
    result = wrapInline(textarea, value, '*', '*', '斜体');
  } else if (key === 'k' && shift) {
    result = insertCodeBlock(textarea, value);
  } else if (key === 'k') {
    result = insertLink(textarea, value);
  } else if (key === 't') {
    result = insertTable(textarea, value);
  } else if (key === 'm' && shift) {
    result = insertMathBlock(textarea, value);
  } else if (shift && key === 'c') {
    const color = promptColor();
    if (color) result = applyTextColor(textarea, value, color);
  } else if (shift && key === 'i') {
    event.preventDefault();
    onInsertImage?.();
    return true;
  } else if (shift && isBracketLeft(event)) {
    result = toggleMarkdownList(textarea, value, 'ordered');
  } else if (shift && isBracketRight(event)) {
    result = toggleMarkdownList(textarea, value, 'unordered');
  } else if (/^[1-6]$/.test(key) && !shift && !event.altKey) {
    result = setHeading(textarea, value, Number(key));
  }

  if (!result) return false;

  event.preventDefault();
  setValue(result.next);
  nextTick(() => setSelection(textarea, result.cursorStart, result.cursorEnd));
  return true;
}

export { insertImage };
