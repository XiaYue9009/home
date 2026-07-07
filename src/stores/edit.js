import { defineStore } from 'pinia';
import {
  EDIT_PASSWORD,
  isEditUnlocked,
  setEditUnlocked,
} from '@/config/edit-permission.js';

export const useEditStore = defineStore('edit', {
  state: () => ({
    unlocked: isEditUnlocked(),
    authError: '',
    passwordInput: '',
  }),
  getters: {
    canEdit: (state) => state.unlocked,
  },
  actions: {
    unlock() {
      this.authError = '';
      if (this.passwordInput === EDIT_PASSWORD) {
        this.unlocked = true;
        setEditUnlocked(true);
        this.passwordInput = '';
        return true;
      }
      this.authError = '密码错误';
      return false;
    },
    lock() {
      this.unlocked = false;
      setEditUnlocked(false);
      this.passwordInput = '';
      this.authError = '';
    },
  },
});
