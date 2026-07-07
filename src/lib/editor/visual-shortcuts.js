function isModKey(event) {
  return event.ctrlKey || event.metaKey;
}

function isBracketLeft(event) {
  return event.code === 'BracketLeft' || event.key === '[' || event.key === '{';
}

function isBracketRight(event) {
  return event.code === 'BracketRight' || event.key === ']' || event.key === '}';
}

function insertHtml(html) {
  document.execCommand('insertHTML', false, html);
}

function insertListManually(type) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  const tag = type === 'ordered' ? 'ol' : 'ul';
  const list = document.createElement(tag);
  const item = document.createElement('li');
  item.textContent = range.toString() || '列表项';
  list.appendChild(item);

  range.deleteContents();
  range.insertNode(list);

  const newRange = document.createRange();
  newRange.selectNodeContents(item);
  newRange.collapse(false);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

function applyListCommand(type) {
  const command = type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList';
  if (document.execCommand(command)) return true;
  return insertListManually(type);
}

function promptColor(defaultColor = '#e74c3c') {
  const value = window.prompt('字体颜色（如 #e74c3c）', defaultColor);
  if (!value?.trim()) return null;
  return value.trim();
}

export const VISUAL_SHORTCUTS = [
  { keys: 'Ctrl+B', label: '粗体', icon: 'bold' },
  { keys: 'Ctrl+I', label: '斜体', icon: 'italic' },
  { keys: 'Ctrl+K', label: '链接', icon: 'link' },
  { keys: 'Ctrl+Shift+K', label: '代码块', icon: 'code' },
  { keys: 'Ctrl+1~6', label: '标题级别', icon: 'heading' },
  { keys: 'Ctrl+T', label: '表格', icon: 'table' },
  { keys: 'Ctrl+Shift+[', label: '有序列表', icon: 'ol' },
  { keys: 'Ctrl+Shift+]', label: '无序列表', icon: 'ul' },
  { keys: 'Ctrl+Shift+C', label: '字体颜色', icon: 'color' },
  { keys: 'Ctrl+Shift+I', label: '插入图片', icon: 'image' },
  { keys: 'Ctrl+/', label: '切换 Markdown', icon: 'markdown' },
];

const TABLE_HTML = `<table>
<thead><tr><th>列 1</th><th>列 2</th><th>列 3</th></tr></thead>
<tbody>
<tr><td></td><td></td><td></td></tr>
<tr><td></td><td></td><td></td></tr>
</tbody>
</table><p></p>`;

/**
 * Typora 风格可视化编辑快捷键（contenteditable）。
 * @returns {boolean}
 */
export function applyVisualShortcut(event, options = {}) {
  const {
    onToggleMarkdownMode,
    onInsertImage,
    isFirstHeadingSelection = () => false,
  } = options;

  if (!isModKey(event)) return false;

  const key = event.key.toLowerCase();
  const shift = event.shiftKey;

  if (key === '/') {
    event.preventDefault();
    onToggleMarkdownMode?.();
    return true;
  }

  if (key === 'b') {
    event.preventDefault();
    document.execCommand('bold');
    return true;
  }

  if (key === 'i') {
    event.preventDefault();
    document.execCommand('italic');
    return true;
  }

  if (key === 'k' && shift) {
    event.preventDefault();
    insertHtml('<pre><code></code></pre><p></p>');
    return true;
  }

  if (key === 'k') {
    event.preventDefault();
    const url = window.prompt('链接地址', 'https://');
    if (url) document.execCommand('createLink', false, url);
    return true;
  }

  if (key === 't') {
    event.preventDefault();
    insertHtml(TABLE_HTML);
    return true;
  }

  if (shift && key === 'c') {
    event.preventDefault();
    const color = promptColor();
    if (color) document.execCommand('foreColor', false, color);
    return true;
  }

  if (shift && key === 'i') {
    event.preventDefault();
    onInsertImage?.();
    return true;
  }

  if (shift && isBracketLeft(event)) {
    if (isFirstHeadingSelection()) return true;
    event.preventDefault();
    applyListCommand('ordered');
    return true;
  }

  if (shift && isBracketRight(event)) {
    if (isFirstHeadingSelection()) return true;
    event.preventDefault();
    applyListCommand('unordered');
    return true;
  }

  if (/^[1-6]$/.test(key) && !shift && !event.altKey) {
    event.preventDefault();
    document.execCommand('formatBlock', false, `h${key}`);
    return true;
  }

  return false;
}

export function pastePlainText(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  if (!text) return;
  document.execCommand('insertText', false, text);
}

export async function pasteClipboardImages(event, { onUploadImage } = {}) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith('image/'));
  if (!imageItem || !onUploadImage) return false;

  event.preventDefault();
  const file = imageItem.getAsFile();
  if (!file) return false;

  await onUploadImage(file);
  return true;
}
