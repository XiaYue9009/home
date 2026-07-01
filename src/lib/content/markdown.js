/**
 * 文章 Markdown 渲染（GFM）。
 * 与 content/posts 下的 .md 文件配合使用。
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(source = '') {
  return marked.parse(source);
}
