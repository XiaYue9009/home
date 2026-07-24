import { renderMarkdown } from '@/lib/content/markdown.js';

function normalizeHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<\/?div>/gi, (match) => (match.startsWith('</') ? '</p>' : '<p>'))
    .trim();
}

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(node) {
  let result = '';

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || '';
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName.toLowerCase();

    if (tag === 'input' && child.classList.contains('ol-task-check')) {
      return;
    }

    if (tag === 'span' && (child.classList.contains('ol-task-text') || child.classList.contains('ol-task-prefix') || child.classList.contains('ol-task-index'))) {
      if (child.classList.contains('ol-task-text') || child.classList.contains('ol-task-prefix')) {
        result += inlineMarkdown(child);
      }
      return;
    }

    const inner = inlineMarkdown(child);

    if (tag === 'strong' || tag === 'b') {
      result += `**${inner || '粗体'}**`;
      return;
    }

    if (tag === 'em' || tag === 'i') {
      result += `*${inner || '斜体'}*`;
      return;
    }

    if (tag === 'code') {
      result += `\`${inner}\``;
      return;
    }

    if (tag === 'a') {
      const href = child.getAttribute('href') || '';
      result += `[${inner || href || '链接'}](${href || 'https://'})`;
      return;
    }

    if (tag === 'img') {
      const src = child.getAttribute('src') || '';
      const alt = child.getAttribute('alt') || '图片';
      result += `![${alt}](${src})`;
      return;
    }

    if (tag === 'span') {
      const style = child.getAttribute('style') || '';
      const colorMatch = style.match(/color:\s*([^;]+)/i);
      if (colorMatch) {
        result += `<span style="color: ${colorMatch[1].trim()}">${inner || '文字'}</span>`;
        return;
      }
    }

    if (tag === 'font') {
      const color = child.getAttribute('color') || '';
      if (color) {
        result += `<span style="color: ${color}">${inner || '文字'}</span>`;
        return;
      }
    }

    if (tag === 'br') {
      result += '\n';
      return;
    }

    result += inlineMarkdown(child);
  });

  return result;
}

function extractListItemText(item) {
  const clone = item.cloneNode(true);
  clone
    .querySelectorAll('ol, ul, .ol-task-prefix, input.ol-task-check, .ol-task-index')
    .forEach((node) => node.remove());
  return inlineMarkdown(clone).trim();
}

function listItemMarkdown(item, ordered, depth = 0) {
  const indent = '  '.repeat(depth);
  const checkbox =
    item.querySelector(':scope > .ol-task-prefix > input.ol-task-check') ||
    item.querySelector(':scope > input.ol-task-check');
  const text = extractListItemText(item);

  let line = '';
  if (ordered) {
    const siblings = [...item.parentElement.children].filter((node) => node.tagName === 'LI');
    const index = siblings.indexOf(item) + 1;
    if (checkbox) {
      line = `${indent}${index}. [${checkbox.checked ? 'x' : ' '}] ${text}`;
    } else {
      line = `${indent}${index}. ${text}`;
    }
  } else {
    line = `${indent}- ${text}`;
  }

  let result = `${line}\n`;

  item.querySelectorAll(':scope > ol, :scope > ul').forEach((nestedList) => {
    result += listMarkdown(nestedList, depth + 1);
  });

  return result;
}

function listMarkdown(listNode, depth = 0) {
  const ordered = listNode.tagName.toLowerCase() === 'ol';
  let result = '';

  listNode.querySelectorAll(':scope > li').forEach((item) => {
    result += listItemMarkdown(item, ordered, depth);
  });

  return result;
}

function blockMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? `${text}\n\n` : '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName.toLowerCase();

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    return `${'#'.repeat(level)} ${inlineMarkdown(node).trim()}\n\n`;
  }

  if (tag === 'p') {
    const text = inlineMarkdown(node).trim();
    return text ? `${text}\n\n` : '';
  }

  if (tag === 'blockquote') {
    const lines = inlineMarkdown(node)
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => `> ${line}`)
      .join('\n');
    return lines ? `${lines}\n\n` : '';
  }

  if (tag === 'pre') {
    const codeNode = node.querySelector('code');
    const code = (codeNode?.textContent || node.textContent || '').replace(/\n$/, '');
    return `\`\`\`\n${code}\n\`\`\`\n\n`;
  }

  if (tag === 'ul' || tag === 'ol') {
    const result = listMarkdown(node, 0);
    return result ? `${result}\n` : '';
  }

  if (tag === 'table') {
    const rows = [...node.querySelectorAll('tr')];
    if (!rows.length) return '';

    const tableLines = rows.map((row, rowIndex) => {
      const cells = [...row.querySelectorAll('th, td')].map((cell) =>
        inlineMarkdown(cell).trim().replace(/\|/g, '\\|'),
      );
      const line = `| ${cells.join(' | ')} |`;
      if (rowIndex === 0) {
        return `${line}\n| ${cells.map(() => '---').join(' | ')} |`;
      }
      return line;
    });

    return `${tableLines.join('\n')}\n\n`;
  }

  if (tag === 'hr') return '---\n\n';

  let result = '';
  node.childNodes.forEach((child) => {
    result += blockMarkdown(child);
  });
  return result;
}

const ORDERED_TASK_LINE_RE = /^(\s*)(\d+)\.\s+\[([ xX])\]\s+(.*)$/;

function buildOrderedTaskHtml(items, start = 1) {
  const lis = items
    .map(({ done, text }, offset) => {
      const checked = done ? ' checked' : '';
      const doneAttr = done ? ' data-done="true"' : ' data-done="false"';
      const doneClass = done ? ' ol-task-item--done' : '';
      const indexLabel = `${start + offset}.`;
      return (
        `<li class="ol-task-item${doneClass}"${doneAttr}>` +
        '<span class="ol-task-prefix" contenteditable="false">' +
        `<input type="checkbox" class="ol-task-check"${checked} />` +
        `<span class="ol-task-index">${indexLabel}</span>` +
        '</span>' +
        `<span class="ol-task-text">${escapeHtml(text)}</span>` +
        '</li>'
      );
    })
    .join('');

  return `<ol class="ol-task-list" start="${start}">${lis}</ol>`;
}

function convertOrderedTaskListsToHtml(markdown = '') {
  const lines = markdown.split('\n');
  const result = [];
  let index = 0;

  while (index < lines.length) {
    const match = lines[index].match(ORDERED_TASK_LINE_RE);
    if (!match) {
      result.push(lines[index]);
      index += 1;
      continue;
    }

    const baseIndent = match[1].length;
    const start = Number(match[2]);
    const items = [];

    while (index < lines.length) {
      const current = lines[index].match(ORDERED_TASK_LINE_RE);
      if (!current || current[1].length !== baseIndent) break;
      items.push({
        done: current[3].trim().toLowerCase() === 'x',
        text: current[4],
      });
      index += 1;
    }

    result.push(buildOrderedTaskHtml(items, start));
  }

  return result.join('\n');
}

export function markdownToHtml(markdown = '') {
  const prepared = convertOrderedTaskListsToHtml(markdown || '');
  return renderMarkdown(prepared);
}

export function htmlToMarkdown(html = '') {
  if (!html.trim()) return '';

  const doc = new DOMParser().parseFromString(normalizeHtml(html), 'text/html');
  const markdown = blockMarkdown(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  return markdown ? `${markdown}\n` : '';
}
