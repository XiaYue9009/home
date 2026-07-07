import { renderMarkdown } from '@/lib/content/markdown.js';

function normalizeHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<\/?div>/gi, (match) => (match.startsWith('</') ? '</p>' : '<p>'))
    .trim();
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
    const ordered = tag === 'ol';
    let index = 1;
    let result = '';

    node.querySelectorAll(':scope > li').forEach((item) => {
      const prefix = ordered ? `${index}. ` : '- ';
      result += `${prefix}${inlineMarkdown(item).trim()}\n`;
      index += 1;
    });

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

export function markdownToHtml(markdown = '') {
  return renderMarkdown(markdown || '');
}

export function htmlToMarkdown(html = '') {
  if (!html.trim()) return '';

  const doc = new DOMParser().parseFromString(normalizeHtml(html), 'text/html');
  const markdown = blockMarkdown(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  return markdown ? `${markdown}\n` : '';
}
