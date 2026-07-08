const API_BASE = (import.meta.env.PUBLIC_PICGO_API_BASE || '/api/picgo').replace(/\/+$/, '');

let picGoReady = null;

export function isPicGoConfigured() {
  return import.meta.env.DEV || Boolean(import.meta.env.PUBLIC_PICGO_API_BASE?.trim());
}

export function resetPicGoAvailabilityCache() {
  picGoReady = null;
}

function buildHeaders(extra = {}) {
  const headers = { ...extra };
  const secret = import.meta.env.PUBLIC_PICGO_SECRET?.trim();
  if (secret) headers['X-PicGo-Secret'] = secret;
  return headers;
}

export async function checkPicGoAvailable() {
  if (!isPicGoConfigured()) return false;

  if (picGoReady != null) return picGoReady;

  try {
    const res = await fetch(`${API_BASE}/heartbeat`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    picGoReady = res.ok;
    return picGoReady;
  } catch {
    picGoReady = false;
    return false;
  }
}

export async function uploadFileToPicGo(file) {
  if (!file) throw new Error('文件无效');

  const form = new FormData();
  form.append('files', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: buildHeaders(),
    body: form,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error('PicGo 返回格式异常，请确认 PicGo Server 已开启');
  }

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'PicGo 上传失败，请确认已安装 moonhome 图床插件并设为当前图床');
  }

  const url = data.result?.[0];
  if (!url) throw new Error('PicGo 未返回图片 URL');
  return url;
}

export function toMarkdownImage(url, alt = '图片') {
  return `![${alt}](${url})`;
}
