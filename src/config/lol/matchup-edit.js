/** 对线笔记详情页编辑密码（仅前端校验，防止误改） */
export const LOL_MATCHUP_EDIT_PASSWORD = '9009';

export const LOL_MATCHUP_EDIT_SESSION_KEY = 'moonhome-lol-matchup-edit-unlocked';

export function isMatchupEditUnlocked() {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(LOL_MATCHUP_EDIT_SESSION_KEY) === '1';
}

export function setMatchupEditUnlocked(unlocked) {
  if (typeof sessionStorage === 'undefined') return;
  if (unlocked) sessionStorage.setItem(LOL_MATCHUP_EDIT_SESSION_KEY, '1');
  else sessionStorage.removeItem(LOL_MATCHUP_EDIT_SESSION_KEY);
}
