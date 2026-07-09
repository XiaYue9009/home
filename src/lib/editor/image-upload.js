import {
  checkGitHubImageBedAvailable,
  isGitHubImageBedConfigured,
  uploadFileToGitHubRepo,
} from '@/lib/github/image-bed.js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client.js';

/** 单张图片最大体积（字节） */
export const MAX_IMAGE_UPLOAD_BYTES = 100 * 1024 * 1024;

/** 允许的扩展名（小写，不含点） */
export const ALLOWED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'ico',
  'avif',
  'heic',
  'heif',
  'tif',
  'tiff',
  'apng',
];

/** 允许的 MIME（部分浏览器可能为空，需结合扩展名判断） */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-ms-bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/tif',
  'image/apng',
];

export const IMAGE_ACCEPT_ATTR = [
  'image/*',
  ...ALLOWED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`),
].join(',');

export const IMAGE_FORMAT_HINT = ALLOWED_IMAGE_EXTENSIONS.join(' / ');

export function isImageUploadEnabled() {
  return isGitHubImageBedConfigured() || isSupabaseConfigured();
}

function getFileExtension(file) {
  const name = file?.name || '';
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx + 1).toLowerCase();
}

export function isAllowedImageFile(file) {
  if (!file) return false;

  const mime = (file.type || '').toLowerCase();
  if (mime && ALLOWED_IMAGE_MIME_TYPES.includes(mime)) return true;
  if (mime.startsWith('image/')) return true;

  const ext = getFileExtension(file);
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

export function assertValidImageFile(file) {
  if (!file) throw new Error('文件无效');

  if (!isAllowedImageFile(file)) {
    throw new Error(`仅支持图片格式：${IMAGE_FORMAT_HINT}`);
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error('图片大小不能超过 100MB');
  }

  return true;
}

function buildObjectPath(file) {
  const ext = getFileExtension(file);
  const safeExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : 'png';
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `upcoming/${id}.${safeExt}`;
}

async function uploadViaSupabase(file) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase 图床未配置');

  const path = buildObjectPath(file);
  const { error } = await supabase.storage.from('upcoming-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/png',
  });

  if (error) throw error;

  const { data } = supabase.storage.from('upcoming-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadEditorImage(file) {
  assertValidImageFile(file);

  if (isGitHubImageBedConfigured()) {
    try {
      if (await checkGitHubImageBedAvailable()) {
        return await uploadFileToGitHubRepo(file);
      }
    } catch (error) {
      if (!isSupabaseConfigured()) throw error;
    }
  }

  if (isSupabaseConfigured()) {
    return uploadViaSupabase(file);
  }

  throw new Error('图床未配置：请配置 Supabase，并部署 upload-github-image Edge Function');
}

export function insertImageHtml(url, alt = '图片') {
  document.execCommand(
    'insertHTML',
    false,
    `<p><img src="${url}" alt="${alt}" /></p><p></p>`,
  );
}

export function insertImageMarkdown(textarea, value, url, alt = '图片') {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const insert = `![${alt}](${url})`;
  const next = `${value.slice(0, start)}${insert}${value.slice(end)}`;
  return {
    next,
    cursorStart: start + insert.length,
    cursorEnd: start + insert.length,
  };
}
