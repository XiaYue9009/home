/**
 * 关联 Supabase 远程项目并推送 migrations。
 * 需在 .env 中设置 SUPABASE_DB_PASSWORD（Dashboard → Database → Database password）
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT_REF = 'caiwzskepfycnoyplftf';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectRefFile = join(root, 'supabase', '.temp', 'project-ref');

function loadEnvValue(key) {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return process.env[key] || '';

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    if (trimmed.slice(0, idx).trim() === key) {
      return trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return process.env[key] || '';
}

function runSupabase(args) {
  const result = spawnSync('pnpm', ['exec', 'supabase', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function loadDbPassword() {
  const password = loadEnvValue('SUPABASE_DB_PASSWORD');
  if (password) return password;

  const mistaken = loadEnvValue('SUPABASE_SERVICE_ROLE_KEY');
  if (mistaken && !mistaken.startsWith('eyJ') && !mistaken.startsWith('sb_secret_')) {
    console.warn(
      '提示：检测到 SUPABASE_SERVICE_ROLE_KEY 疑似为数据库密码，请改用 SUPABASE_DB_PASSWORD。',
    );
    return mistaken;
  }

  return '';
}

const password = loadDbPassword();
if (!password) {
  console.error(
    '缺少 SUPABASE_DB_PASSWORD。\n' +
      '请在 .env 中添加数据库密码（Supabase Dashboard → Project Settings → Database → Database password）',
  );
  process.exit(1);
}

if (!existsSync(projectRefFile)) {
  console.log(`关联远程项目 ${PROJECT_REF}…`);
  runSupabase([
    'link',
    '--project-ref',
    PROJECT_REF,
    '--password',
    password,
    '--yes',
  ]);
}

console.log('推送 migrations 到远程…');
runSupabase(['db', 'push', '--yes']);

console.log('完成。');
