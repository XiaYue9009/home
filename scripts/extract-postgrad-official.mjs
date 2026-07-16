import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/content/postgrad');

const sources = {
  'charter-2026': path.join(root, 'tmp-charter.html'),
  'subject-change': path.join(root, 'tmp-subject.html'),
  'major-catalog': path.join(root, 'tmp-catalog.html'),
};

function extractNewsContent(html) {
  const marker = '<div class="v_news_content">';
  const start = html.indexOf(marker);
  if (start === -1) return '';
  const innerStart = start + marker.length;
  const rest = html.slice(innerStart);
  const end = rest.indexOf('</div></div>');
  return end === -1 ? rest.trim() : rest.slice(0, end).trim();
}

function fixOfficialUrls(html) {
  return html
    .replace(/src="\/__local\//g, 'src="https://yzs.qust.edu.cn/__local/')
    .replace(/orisrc="\/__local\//g, 'orisrc="https://yzs.qust.edu.cn/__local/')
    .replace(/href="\.\.\/\.\.\/([^"]+)"/g, 'href="https://yzs.qust.edu.cn/$1"')
    .replace(/href="\/([^"]+)"/g, (_, p) => {
      if (p.startsWith('http')) return `href="/${p}"`;
      return `href="https://yzs.qust.edu.cn/${p}"`;
    });
}

function extractRequirements(charterHtml) {
  const content = extractNewsContent(charterHtml);
  const start = content.indexOf('<p style="text-align: justify;"><strong>四、报考条件</strong></p>');
  const end = content.indexOf('<p style="text-align: justify;"><strong>六、初试</strong></p>');
  if (start === -1 || end === -1) return '';
  return content.slice(start, end).trim();
}

fs.mkdirSync(outDir, { recursive: true });

const charterHtml = fs.readFileSync(sources['charter-2026'], 'utf8');
const requirementsHtml = extractRequirements(charterHtml);

const outputs = {
  requirements: requirementsHtml,
  'charter-2026': extractNewsContent(charterHtml),
  'subject-change': extractNewsContent(fs.readFileSync(sources['subject-change'], 'utf8')),
  'major-catalog': extractNewsContent(fs.readFileSync(sources['major-catalog'], 'utf8')),
};

for (const [key, raw] of Object.entries(outputs)) {
  const html = fixOfficialUrls(raw);
  fs.writeFileSync(path.join(outDir, `${key}.html`), `${html}\n`, 'utf8');
  console.log(`wrote ${key}.html (${html.length} chars)`);
}
