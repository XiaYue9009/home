const DEFAULT_REPO = 'XiaYue9009/picgo_moonhome';
const DEFAULT_BRANCH = 'main';
const DEFAULT_PATH = 'img/';

let availabilityCache = null;

export function getGitHubImageRepo() {
  return import.meta.env.PUBLIC_GITHUB_REPO?.trim() || DEFAULT_REPO;
}

export function getGitHubImageDefaults() {
  return {
    repo: getGitHubImageRepo(),
    branch: import.meta.env.PUBLIC_GITHUB_BRANCH?.trim() || DEFAULT_BRANCH,
    basePath: import.meta.env.PUBLIC_GITHUB_PATH?.trim() || DEFAULT_PATH,
  };
}

export function buildPublicUrl(path, { repo, branch } = getGitHubImageDefaults()) {
  const normalizedPath = path.replace(/^\/+/, '');
  const customUrl = import.meta.env.PUBLIC_GITHUB_CUSTOM_URL?.trim();
  if (customUrl) {
    return `${customUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  }
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${normalizedPath}`;
}

export function getGitHubImageApiBase() {
  if (import.meta.env.DEV) return '/api/github-image';

  const custom = import.meta.env.PUBLIC_GITHUB_IMAGE_API_BASE?.trim();
  if (custom) return custom.replace(/\/+$/, '');

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/upload-github-image`;
  }

  return '';
}

export function isGitHubImageBedConfigured() {
  if (import.meta.env.DEV) return true;
  return Boolean(getGitHubImageApiBase());
}

export function resetGitHubImageAvailabilityCache() {
  availabilityCache = null;
}

function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const secret = import.meta.env.PUBLIC_GITHUB_UPLOAD_SECRET?.trim();
  if (secret) headers['X-Upload-Secret'] = secret;

  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (supabaseKey && !import.meta.env.DEV) {
    headers.Authorization = `Bearer ${supabaseKey}`;
    headers.apikey = supabaseKey;
  }

  return headers;
}

async function readFileAsBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function checkGitHubImageBedAvailable() {
  if (!isGitHubImageBedConfigured()) return false;
  if (availabilityCache != null) return availabilityCache;

  try {
    const res = await fetch(`${getGitHubImageApiBase()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    if (!res.ok) {
      availabilityCache = false;
      return false;
    }
    const data = await res.json();
    availabilityCache = Boolean(data?.ok);
    return availabilityCache;
  } catch {
    availabilityCache = false;
    return false;
  }
}

export async function uploadFileToGitHubRepo(file) {
  if (!file) throw new Error('文件无效');

  const apiBase = getGitHubImageApiBase();
  if (!apiBase) {
    throw new Error('GitHub 图床未配置：请设置 Supabase 或 PUBLIC_GITHUB_IMAGE_API_BASE');
  }

  const content = await readFileAsBase64(file);
  const res = await fetch(apiBase, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      fileName: file.name,
      content,
      contentType: file.type || 'image/png',
    }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error('图床接口返回格式异常');
  }

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'GitHub 图床上传失败');
  }

  const url = data.url;
  if (!url) throw new Error('图床未返回图片 URL');
  return url;
}

export function toMarkdownImage(url, alt = '图片') {
  return `![${alt}](${url})`;
}
