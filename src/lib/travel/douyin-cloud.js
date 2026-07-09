/** 生产环境经 Supabase Edge Function 按关键词拉取抖音收藏夹（Cookie 保存在服务端）。 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MAX, getTargetCollectsKeywords } from './douyin-collection.js';

let client = null;

export function isDouyinCloudEnabled() {
  return !!(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
}

function getClient() {
  if (!isDouyinCloudEnabled()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}

export async function fetchDouyinCollectionCloud(
  maxVideos = DEFAULT_MAX,
  keywords = getTargetCollectsKeywords(),
) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke('fetch-douyin-collection', {
    body: {
      maxVideos: Number(maxVideos) || DEFAULT_MAX,
      keywords: Array.isArray(keywords) ? keywords : [keywords],
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.groups && !data?.videos) throw new Error('云端未返回收藏数据');

  return {
    account: data.account || null,
    groups: data.groups || [],
    videos: data.videos || [],
    source: 'cloud',
  };
}
