/** 生产环境经 Supabase Edge Function 拉取抖音收藏（Cookie 保存在服务端）。 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MAX } from './douyin-collection.js';

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

export async function fetchDouyinCollectionCloud(maxVideos = DEFAULT_MAX) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke('fetch-douyin-collection', {
    body: { maxVideos: Number(maxVideos) || DEFAULT_MAX },
  });

  if (error) throw error;
  if (!data?.videos) throw new Error(data?.error || '云端未返回收藏数据');

  return {
    account: data.account || null,
    videos: data.videos,
    source: 'cloud',
  };
}
