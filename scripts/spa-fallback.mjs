import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const index = resolve('dist/index.html');

if (!existsSync(index)) {
  console.error('dist/index.html 不存在，跳过 404 fallback');
  process.exit(1);
}

copyFileSync(index, resolve('dist/404.html'));
console.log('已生成 dist/404.html（GitHub Pages SPA fallback）');
