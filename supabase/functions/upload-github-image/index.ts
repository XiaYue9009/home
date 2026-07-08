/**
 * Supabase Edge Function：将图片上传至 GitHub 仓库，返回 jsDelivr CDN 外链。
 * 部署：supabase secrets set GITHUB_TOKEN=... && supabase functions deploy upload-github-image
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DEFAULT_REPO = 'XiaYue9009/picgo_moonhome';
const DEFAULT_BRANCH = 'main';
const DEFAULT_PATH = 'img/';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-upload-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function buildPublicUrl({
  repo,
  branch,
  path,
  customUrl,
}: {
  repo: string;
  branch: string;
  path: string;
  customUrl: string;
}) {
  const normalizedPath = path.replace(/^\/+/, '');
  if (customUrl?.trim()) {
    return `${customUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  }
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${normalizedPath}`;
}

function buildFilePath(basePath: string, fileName: string) {
  return `${basePath.replace(/\/?$/, '/')}${fileName}`;
}

function buildUniqueFileName(originalName = 'image.png') {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'png';
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${id}.${safeExt}`;
}

function assertUploadSecret(req: Request) {
  const expected = Deno.env.get('GITHUB_UPLOAD_SECRET')?.trim();
  if (!expected) return;
  const provided = req.headers.get('x-upload-secret')?.trim();
  if (provided !== expected) {
    throw new Error('上传密钥无效');
  }
}

function formatGitHubWriteError(status: number, message: string | undefined, repo: string) {
  if (status === 401) return 'GitHub Token 无效或已过期，请重新生成并更新配置';
  if (status === 403) return `GitHub 拒绝写入 ${repo}：Token 权限不足`;
  if (status === 404) {
    return `GitHub 无法写入 ${repo}：请确认 Token 对该仓库有 Contents 写入权限（经典 Token 勾选 repo；细粒度 Token 选择仓库并开启 Contents: Read and write）`;
  }
  return message || `GitHub API 错误 (${status})`;
}

async function githubRequest(
  token: string,
  url: string,
  options: RequestInit = {},
) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'moonhome-github-image-bed',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function uploadToGitHub({
  token,
  repo,
  branch,
  basePath,
  fileName,
  contentBase64,
  customUrl,
}: {
  token: string;
  repo: string;
  branch: string;
  basePath: string;
  fileName: string;
  contentBase64: string;
  customUrl: string;
}) {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('仓库名格式应为 username/reponame');
  }

  const filePath = buildFilePath(basePath, fileName);
  const message = `upload ${fileName} via moonhome`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const token = Deno.env.get('GITHUB_TOKEN')?.trim();
    const repo = Deno.env.get('GITHUB_REPO')?.trim() || DEFAULT_REPO;
    const branch = Deno.env.get('GITHUB_BRANCH')?.trim() || DEFAULT_BRANCH;
    const basePath = Deno.env.get('GITHUB_PATH')?.trim() || DEFAULT_PATH;
    const customUrl = Deno.env.get('GITHUB_CUSTOM_URL')?.trim() || '';

    if (req.method === 'GET') {
      return jsonResponse({ ok: Boolean(token) });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ success: false, message: 'Method not allowed' }, 405);
    }

    assertUploadSecret(req);

    if (!token) {
      return jsonResponse({ success: false, message: '未配置 GITHUB_TOKEN' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body?.content || '').trim();
    const originalName = String(body?.fileName || 'image.png').trim();

    if (!content) {
      return jsonResponse({ success: false, message: '缺少图片内容' }, 400);
    }

    const fileName = buildUniqueFileName(originalName);
    const url = await uploadToGitHub({
      token,
      repo,
      branch,
      basePath,
      fileName,
      contentBase64: content,
      customUrl,
    });

    return jsonResponse({ success: true, url, fileName });
  } catch (err) {
    return jsonResponse({ success: false, message: err?.message || '上传失败' }, 500);
  }
});
