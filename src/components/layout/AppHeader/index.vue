<script setup>
import { storeToRefs } from 'pinia';
import { SITE } from '../../../config/consts';
import { buildPrimaryNavLinks, isNavLinkActive } from '../../../config/nav.js';
import ThemeSwitcher from '../../ThemeSwitcher/index.vue';
import WeatherWidget from '../../WeatherWidget/index.vue';
import SiteLogo from '../SiteLogo/index.vue';
import MotionEnter from '@/components/motion/MotionEnter/index.vue';
import { useEditStore } from '@/stores/edit.js';
import { MOTION_LAYOUT, MOTION_STAGGER } from '@/lib/motion/presets.js';

const route = useRoute();
const editStore = useEditStore();
const { canEdit, passwordInput, authError } = storeToRefs(editStore);

const primaryNavLinks = buildPrimaryNavLinks();

function isActive(to) {
  return isNavLinkActive(route.path, to);
}

function unlockEdit() {
  editStore.unlock();
}
</script>

<template>
  <header class="header-bar">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <MotionEnter
        :animation="MOTION_LAYOUT.logo.animation"
        :speed="MOTION_LAYOUT.logo.speed"
      >
        <RouterLink to="/" class="group flex shrink-0 items-center gap-2">
          <SiteLogo />
          <span class="font-display text-lg font-bold tracking-tight text-heading">{{ SITE.title }}</span>
        </RouterLink>
      </MotionEnter>

      <nav class="hidden items-center gap-1 md:flex">
        <MotionEnter
          v-for="(link, index) in primaryNavLinks"
          :key="link.key"
          :animation="MOTION_LAYOUT.navItem.animation"
          :speed="MOTION_LAYOUT.navItem.speed"
          :delay="index * MOTION_STAGGER.nav"
        >
          <RouterLink
            :to="link.to"
            class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
            :class="isActive(link.to) ? 'nav-link-active' : 'nav-link'"
          >
            {{ link.label }}
          </RouterLink>
        </MotionEnter>
      </nav>

      <div class="group flex items-center gap-2 sm:gap-3">
        <div class="header-auth">
          <template v-if="canEdit">
            <el-tag type="success" size="small" effect="plain">已解锁</el-tag>
            <el-button size="small" @click="editStore.lock()">锁定</el-button>
          </template>
          <template v-else>
            <el-input
              v-model="passwordInput"
              class="header-auth__input"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              size="small"
              placeholder="编辑密码"
              aria-label="编辑密码"
              :aria-invalid="Boolean(authError)"
              @keyup.enter="unlockEdit"
            />
            <el-button
              type="primary"
              size="small"
              :disabled="!passwordInput"
              @click="unlockEdit"
            >
              解锁
            </el-button>
            <span v-if="authError" class="header-auth__error" role="alert">{{ authError }}</span>
          </template>
        </div>
        <WeatherWidget />
        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-auth {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;

  &__input {
    width: 6.75rem;
  }

  &__error {
    font-size: 0.6875rem;
    line-height: 1.2;
    color: #dc2626;
    white-space: nowrap;
  }

  :deep(.el-tag) {
    display: inline-flex;
    align-items: center;
    height: 2rem;
    border-radius: 9999px;
    white-space: nowrap;
  }
}

@media (max-width: 767px) {
  .header-auth {
    &__error {
      display: none;
    }
  }
}
</style>
