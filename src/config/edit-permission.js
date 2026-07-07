/** 全局编辑密码（仅前端校验，防止误改） */
export const EDIT_PASSWORD = '9009';

export const EDIT_SESSION_KEY = 'moonhome-edit-unlocked';

const LEGACY_EDIT_SESSION_KEY = 'moonhome-lol-matchup-edit-unlocked';

export function isEditUnlocked() {
  if (typeof sessionStorage === 'undefined') return false;
  if (sessionStorage.getItem(EDIT_SESSION_KEY) === '1') return true;

  if (sessionStorage.getItem(LEGACY_EDIT_SESSION_KEY) === '1') {
    setEditUnlocked(true);
    sessionStorage.removeItem(LEGACY_EDIT_SESSION_KEY);
    return true;
  }

  return false;
}

export function setEditUnlocked(unlocked) {
  if (typeof sessionStorage === 'undefined') return;
  if (unlocked) sessionStorage.setItem(EDIT_SESSION_KEY, '1');
  else sessionStorage.removeItem(EDIT_SESSION_KEY);
}
