const DEFAULT_REPO = 'XiaYue9009/picgo_moonhome';
const DEFAULT_BRANCH = 'main';
const DEFAULT_PATH = 'img/';

export function getGitHubImageDefaults() {
  return {
    repo: process.env.GITHUB_REPO?.trim() || DEFAULT_REPO,
    branch: process.env.GITHUB_BRANCH?.trim() || DEFAULT_BRANCH,
    basePath: process.env.GITHUB_PATH?.trim() || DEFAULT_PATH,
    customUrl: process.env.GITHUB_CUSTOM_URL?.trim() || '',
  };
}

export function buildPublicUrl({ repo, branch, path, customUrl }) {
  const normalizedPath = path.replace(/^\/+/, '');
  if (customUrl?.trim()) {
    return `${customUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  }
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${normalizedPath}`;
}

export function buildFilePath(basePath, fileName) {
  return `${basePath.replace(/\/?$/, '/')}${fileName}`;
}

export function buildUniqueFileName(originalName = 'image.png') {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'png';
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${id}.${safeExt}`;
}

function formatGitHubWriteError(status, message, repo) {
  if (status === 401) {
    return 'GitHub Token 无效或已过期，请重新生成并更新 .env';
  }
  if (status === 403) {
    return `GitHub 拒绝写入 ${repo}：Token 权限不足`;
  }
  if (status === 404) {
    return `GitHub 无法写入 ${repo}：请确认 Token 对该仓库有 Contents 写入权限（经典 Token 勾选 repo；细粒度 Token 选择仓库并开启 Contents: Read and write）`;
  }
  return message || `GitHub API 错误 (${status})`;
}

async function githubRequest(token, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'User-Agent': 'moonhome-github-image-bed',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { res, data };
}

export async function uploadToGitHub({
  token,
  repo,
  branch,
  basePath,
  fileName,
  contentBase64,
  customUrl = '',
}) {
  if (!token?.trim()) {
    throw new Error('未配置 GITHUB_TOKEN');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('仓库名格式应为 username/reponame');
  }

  const filePath = buildFilePath(basePath, fileName);
  const message = `upload ${fileName} via moonhome`;

  // Contents API 支持空仓库首次提交，Git Data API 在空仓库会返回 409。
  const { res, data } = await githubRequest(
    token,
    `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(formatGitHubWriteError(res.status, data?.message, `${owner}/${repoName}`));
  }

  return buildPublicUrl({ repo, branch, path: filePath, customUrl });
}

export function isGitHubUploadConfigured(env = process.env) {
  return Boolean(env.GITHUB_TOKEN?.trim());
}
