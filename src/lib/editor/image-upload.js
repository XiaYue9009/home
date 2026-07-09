import {
  checkGitHubImageBedAvailable,
  isGitHubImageBedConfigured,
  uploadFileToGitHubRepo,
} from '@/lib/github/image-bed.js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client.js';

export function isImageUploadEnabled() {
  return isGitHubImageBedConfigured() || isSupabaseConfigured();
}

function buildObjectPath(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'png';
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
  if (!file) throw new Error('文件无效');

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
