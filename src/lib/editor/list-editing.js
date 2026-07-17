import { nextTick } from 'vue';

const MARKDOWN_LIST_LINE_RE =
  /^(\s*)((?:\d+\.\s+(?:\[[ xX]\]\s+)?)|(?:[-*+]\s+))/;
const MARKDOWN_INDENT = '    ';
const PLACEHOLDER_TEXT = '列表项';
const CIRCLED_NUMBERS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeListLine(line = '') {
  return line.replace(/\r$/, '');
}

function isMarkdownListLine(line = '') {
  return MARKDOWN_LIST_LINE_RE.test(normalizeListLine(line));
}

const MARKDOWN_ORDERED_TASK_RE = /^(\s*)(\d+)\.\s+\[([ xX])\]\s+(.*)$/;
const MARKDOWN_ORDERED_PLAIN_RE = /^(\s*)(\d+)\.\s+(.*)$/;

function replaceRange(value, start, end, insert) {
  return `${value.slice(0, start)}${insert}${value.slice(end)}`;
}

function setTextareaSelection(textarea, start, end) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
}

function getSelectedBlockRange(value, start, end) {
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  let blockEnd = end;

  if (end > start && value.slice(start, end).includes('\n')) {
    const after = value.indexOf('\n', end);
    blockEnd = after === -1 ? value.length : after;
  } else {
    const lineEnd = value.indexOf('\n', Math.max(end - 1, blockStart));
    blockEnd = lineEnd === -1 ? value.length : lineEnd;
  }

  return { blockStart, blockEnd };
}

export function formatOrderedIndex(index, depth = 0) {
  const level = depth % 3;
  if (level === 0) return `${index}.`;
  if (level === 1) return `(${index})`;
  return CIRCLED_NUMBERS[index - 1] || `(${index})`;
}

export function getOrderedListDepth(listItem) {
  let depth = 0;
  let list = listItem?.parentElement;
  if (list?.tagName !== 'OL') return 0;

  let node = list.parentElement;
  while (node) {
    if (node.tagName === 'OL' && node.classList.contains('ol-task-list')) {
      depth += 1;
    }
    node = node.parentElement;
  }
  return depth;
}

function getOrderedListItemIndex(listItem) {
  const siblings = [...listItem.parentElement.children].filter((node) => node.tagName === 'LI');
  return siblings.indexOf(listItem) + 1;
}

export function updateOrderedListIndices(root) {
  if (!root) return;

  root.querySelectorAll('ol.ol-task-list').forEach((list) => {
    [...list.children].forEach((child) => {
      if (child.tagName !== 'LI') return;
      const indexEl = child.querySelector(':scope > .ol-task-prefix > .ol-task-index');
      if (!indexEl) return;
      indexEl.textContent = formatOrderedIndex(
        getOrderedListItemIndex(child),
        getOrderedListDepth(child),
      );
    });
  });
}

function createTaskPrefix(done = false) {
  const prefix = document.createElement('span');
  prefix.className = 'ol-task-prefix';
  prefix.contentEditable = 'false';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'ol-task-check';
  checkbox.checked = done;

  const index = document.createElement('span');
  index.className = 'ol-task-index';

  prefix.appendChild(checkbox);
  prefix.appendChild(index);
  return prefix;
}

function isPlaceholderText(text = '') {
  return text.trim() === PLACEHOLDER_TEXT;
}

function getTaskTextElement(listItem) {
  return listItem?.querySelector(':scope > .ol-task-text') || null;
}

function isEmptyTaskText(element) {
  if (!element) return true;
  const text = element.textContent?.replace(/\u200B/g, '').trim() || '';
  return !text;
}

function isCaretAtStartOf(element) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !element) return false;

  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;

  const probe = document.createRange();
  probe.selectNodeContents(element);
  probe.setEnd(range.startContainer, range.startOffset);
  return probe.toString().length === 0;
}

export function getClosestListItem(node, root) {
  if (!node || !root) return null;
  let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (element && element !== root) {
    if (element.tagName === 'LI') return element;
    element = element.parentElement;
  }
  return null;
}

function findDirectChildList(listItem, tagName) {
  return [...listItem.children].find((child) => child.tagName === tagName) || null;
}

function createNestedList(tagName, ordered = false) {
  const list = document.createElement(tagName.toLowerCase());
  if (ordered) {
    list.className = 'ol-task-list';
  }
  return list;
}

function getListElement(listItem) {
  return listItem?.parentElement?.closest('ul, ol') || listItem?.parentElement || null;
}

function isOrderedList(list) {
  return list?.tagName === 'OL';
}

export function focusListItem(listItem) {
  const target = getTaskTextElement(listItem) || listItem.querySelector('p') || listItem;
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function normalizeOrderedListItem(listItem) {
  if (!listItem || listItem.tagName !== 'LI') return;
  if (listItem.parentElement?.tagName !== 'OL') return;

  listItem.classList.add('ol-task-item');

  const legacyCheckbox = listItem.querySelector(':scope > input.ol-task-check');
  let prefix = listItem.querySelector(':scope > .ol-task-prefix');
  let textWrap = getTaskTextElement(listItem);
  const done = listItem.dataset.done === 'true' || legacyCheckbox?.checked;

  if (textWrap && isPlaceholderText(textWrap.textContent || '')) {
    textWrap.textContent = '';
  }

  if (!prefix) {
    prefix = createTaskPrefix(done);
    if (legacyCheckbox) {
      legacyCheckbox.remove();
    }
    listItem.insertBefore(prefix, listItem.firstChild);
  }

  listItem.querySelectorAll(':scope > input.ol-task-check').forEach((node) => node.remove());

  if (!textWrap) {
    textWrap = document.createElement('span');
    textWrap.className = 'ol-task-text';

    const movable = [];
    for (const child of [...listItem.childNodes]) {
      if (child === prefix) continue;
      if (child.nodeName === 'OL' || child.nodeName === 'UL') continue;
      if (child.classList?.contains('ol-task-text')) continue;
      if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) continue;
      movable.push(child);
    }

    prefix.after(textWrap);
    movable.forEach((node) => textWrap.appendChild(node));
  }

  if (textWrap && isPlaceholderText(textWrap.textContent || '')) {
    textWrap.textContent = '';
  }

  const checkbox = prefix.querySelector('input.ol-task-check');
  if (checkbox) {
    setOrderedListItemDone(checkbox, done, { cascade: false });
  }
}

export function ensureOrderedListItemCheckbox(listItem) {
  normalizeOrderedListItem(listItem);
}

export function enhanceVisualOrderedLists(root) {
  if (!root) return;

  root.querySelectorAll('ol').forEach((list) => {
    list.classList.add('ol-task-list');
    [...list.children].forEach((child) => {
      if (child.tagName === 'LI') {
        normalizeOrderedListItem(child);
      }
    });
  });

  updateOrderedListIndices(root);
}

function collectDescendantTaskItems(listItem) {
  return [...listItem.querySelectorAll(':scope ol li.ol-task-item')];
}

export function setOrderedListItemDone(checkbox, done, { cascade = true } = {}) {
  const listItem = checkbox?.closest('li.ol-task-item');
  if (!listItem) return;

  checkbox.checked = done;
  listItem.dataset.done = done ? 'true' : 'false';
  listItem.classList.toggle('ol-task-item--done', done);

  if (!cascade) return;

  collectDescendantTaskItems(listItem).forEach((childItem) => {
    const childCheckbox = childItem.querySelector(':scope > .ol-task-prefix > input.ol-task-check');
    if (childCheckbox) {
      setOrderedListItemDone(childCheckbox, done, { cascade: true });
    }
  });
}

export function handleVisualOrderedListCheckbox(event) {
  const checkbox = event.target;
  if (!checkbox?.matches('input.ol-task-check')) return false;
  setOrderedListItemDone(checkbox, checkbox.checked, { cascade: true });
  return true;
}

function removeOrderedListItem(listItem, root) {
  const previous = listItem.previousElementSibling;
  const list = listItem.parentElement;
  listItem.remove();

  if (list?.tagName === 'OL' && list.children.length === 0) {
    list.remove();
  }

  if (previous?.classList?.contains('ol-task-item')) {
    focusListItem(previous);
  }

  updateOrderedListIndices(root);
}

function indentVisualListItem(listItem) {
  const list = listItem?.parentElement;
  if (!list || !['UL', 'OL'].includes(list.tagName)) return false;

  const previousItem = listItem.previousElementSibling;
  if (!previousItem || previousItem.tagName !== 'LI') return false;

  const nestedTag = list.tagName;
  const ordered = isOrderedList(list);
  let nestedList = findDirectChildList(previousItem, nestedTag);
  if (!nestedList) {
    nestedList = createNestedList(nestedTag, ordered);
    previousItem.appendChild(nestedList);
  }

  nestedList.appendChild(listItem);
  if (ordered) {
    normalizeOrderedListItem(listItem);
  }
  focusListItem(listItem);
  return true;
}

function outdentVisualListItem(listItem) {
  const list = listItem?.parentElement;
  if (!list || !['UL', 'OL'].includes(list.tagName)) return false;

  const parentItem = list.parentElement?.tagName === 'LI' ? list.parentElement : null;
  if (!parentItem) return false;

  const parentList = parentItem.parentElement;
  if (!parentList || !['UL', 'OL'].includes(parentList.tagName)) return false;

  parentItem.after(listItem);

  if (list.children.length === 0) {
    list.remove();
  }

  focusListItem(listItem);

  if (isOrderedList(parentList)) {
    normalizeOrderedListItem(listItem);
  }

  return true;
}

export function toggleVisualOrderedListItemDone(root) {
  const selection = window.getSelection();
  const listItem = getClosestListItem(selection?.anchorNode, root);
  const list = getListElement(listItem);
  if (!listItem || !isOrderedList(list)) return false;

  normalizeOrderedListItem(listItem);
  const checkbox = listItem.querySelector(':scope > .ol-task-prefix > input.ol-task-check');
  if (!checkbox) return false;

  setOrderedListItemDone(checkbox, !checkbox.checked, { cascade: true });
  focusListItem(listItem);
  return true;
}

function handleOrderedListBackspace(event, root) {
  const listItem = getClosestListItem(window.getSelection()?.anchorNode, root);
  if (!listItem?.classList.contains('ol-task-item')) return false;

  const textEl = getTaskTextElement(listItem);
  if (!textEl || !isCaretAtStartOf(textEl)) return false;

  if (!isEmptyTaskText(textEl)) return false;

  event.preventDefault();
  removeOrderedListItem(listItem, root);
  return true;
}

export function applyVisualListKeydown(event, root) {
  if (!root) return false;

  if (event.key === 'Backspace' && handleOrderedListBackspace(event, root)) {
    return true;
  }

  if (event.key === 'Tab') {
    const listItem = getClosestListItem(window.getSelection()?.anchorNode, root);
    if (!listItem) return false;

    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      outdentVisualListItem(listItem);
    } else {
      indentVisualListItem(listItem);
    }
    enhanceVisualOrderedLists(root);
    return true;
  }

  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    const listItem = getClosestListItem(window.getSelection()?.anchorNode, root);
    if (listItem && isOrderedList(getListElement(listItem))) {
      requestAnimationFrame(() => enhanceVisualOrderedLists(root));
    }
    return false;
  }

  if (
    event.key === 'Enter' &&
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey
  ) {
    if (!toggleVisualOrderedListItemDone(root)) return false;
    event.preventDefault();
    return true;
  }

  return false;
}

function indentMarkdownListBlock(value, start, end) {
  const { blockStart, blockEnd } = getSelectedBlockRange(value, start, end);
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  let changed = false;

  const nextLines = lines.map((line) => {
    const normalized = normalizeListLine(line);
    if (!normalized.trim() || !isMarkdownListLine(normalized)) return line;
    changed = true;
    return `${MARKDOWN_INDENT}${line}`;
  });

  if (!changed) return null;

  const insert = nextLines.join('\n');
  const next = replaceRange(value, blockStart, blockEnd, insert);
  return { next, cursorStart: blockStart, cursorEnd: blockStart + insert.length };
}

function outdentMarkdownListBlock(value, start, end) {
  const { blockStart, blockEnd } = getSelectedBlockRange(value, start, end);
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  let changed = false;

  const nextLines = lines.map((line) => {
    const normalized = normalizeListLine(line);
    if (!normalized.trim() || !isMarkdownListLine(normalized)) return line;

    if (line.startsWith(MARKDOWN_INDENT)) {
      changed = true;
      return line.slice(MARKDOWN_INDENT.length);
    }
    if (line.startsWith('\t')) {
      changed = true;
      return line.slice(1);
    }
    if (line.startsWith('  ')) {
      changed = true;
      return line.slice(2);
    }
    return line;
  });

  if (!changed) return null;

  const insert = nextLines.join('\n');
  const next = replaceRange(value, blockStart, blockEnd, insert);
  return { next, cursorStart: blockStart, cursorEnd: blockStart + insert.length };
}

function toggleMarkdownOrderedListItemDone(value, start) {
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', start);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const line = value.slice(blockStart, lineEnd);

  const taskMatch = line.match(MARKDOWN_ORDERED_TASK_RE);
  if (taskMatch) {
    const nextCheck = taskMatch[3].trim().toLowerCase() === 'x' ? ' ' : 'x';
    const nextLine = `${taskMatch[1]}${taskMatch[2]}. [${nextCheck}] ${taskMatch[4]}`;
    const next = replaceRange(value, blockStart, lineEnd, nextLine);
    const cursor = blockStart + nextLine.length;
    return { next, cursorStart: cursor, cursorEnd: cursor };
  }

  const plainMatch = line.match(MARKDOWN_ORDERED_PLAIN_RE);
  if (plainMatch) {
    const nextLine = `${plainMatch[1]}${plainMatch[2]}. [x] ${plainMatch[3]}`;
    const next = replaceRange(value, blockStart, lineEnd, nextLine);
    const cursor = blockStart + nextLine.length;
    return { next, cursorStart: cursor, cursorEnd: cursor };
  }

  return null;
}

export function applyMarkdownListKeydown(event, textarea, { value, setValue } = {}) {
  if (!textarea) return false;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (event.key === 'Tab') {
    const result = event.shiftKey
      ? outdentMarkdownListBlock(value, start, end)
      : indentMarkdownListBlock(value, start, end);
    if (!result) return false;

    event.preventDefault();
    setValue(result.next);
    nextTick(() => setTextareaSelection(textarea, result.cursorStart, result.cursorEnd));
    return true;
  }

  if (
    event.key === 'Enter' &&
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey
  ) {
    const result = toggleMarkdownOrderedListItemDone(value, start);
    if (!result) return false;

    event.preventDefault();
    setValue(result.next);
    nextTick(() => setTextareaSelection(textarea, result.cursorStart, result.cursorEnd));
    return true;
  }

  return false;
}

export function createOrderedListItemHtml(text = '') {
  const content = text ? escapeHtml(text) : '';
  return (
    '<li class="ol-task-item" data-done="false">' +
    '<span class="ol-task-prefix" contenteditable="false">' +
    '<input type="checkbox" class="ol-task-check" />' +
    '<span class="ol-task-index">1.</span>' +
    '</span>' +
    `<span class="ol-task-text">${content}</span>` +
    '</li>'
  );
}
