import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(source = '') {
  return marked.parse(source);
}
