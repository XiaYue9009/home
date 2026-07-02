/** 旅行页本地缓存（实时拉取失败时的兜底数据） */
import account from './account.js';
import videos from './videos.js';

export function getTravelAccountFallback() {
  return account;
}

export function getTravelVideosFallback() {
  return videos;
}
