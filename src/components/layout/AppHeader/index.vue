<script setup>
import { storeToRefs } from 'pinia';
import { SITE } from '../../../config/consts';
import { buildPrimaryNavLinks, isNavLinkActive } from '../../../config/nav.js';
import ThemeSwitcher from '../../ThemeSwitcher/index.vue';
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

      <nav class="header-nav hidden md:flex">
        <MotionEnter
          v-for="(link, index) in primaryNavLinks"
          :key="link.key"
          :animation="MOTION_LAYOUT.navItem.animation"
          :speed="MOTION_LAYOUT.navItem.speed"
          :delay="index * MOTION_STAGGER.nav"
        >
          <RouterLink
            :to="link.to"
            class="header-nav__link"
            :class="isActive(link.to) ? 'nav-link-active' : 'nav-link'"
          >
            {{ link.label }}
          </RouterLink>
        </MotionEnter>
      </nav>

      <div class="header-actions group flex items-center gap-2 sm:gap-3">
        <div class="header-auth">
          <template v-if="canEdit">
            <el-tag type="success" size="small" effect="plain">已解锁</el-tag>
            <el-button size="small" @click="editStore.lock()">锁定</el-button>
          </template>
          <template v-else>
            <el-input
              v-model="passwordInput"
              class="header-auth__input header-auth__input--secret"
              type="text"
              name="site-edit-unlock"
              inputmode="numeric"
              autocomplete="one-time-code"
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
        <a
          :href="SITE.github"
          class="header-github"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-nav {
  align-items: center;
  gap: 0.65rem;

  :deep(.motion-animate) {
    display: flex;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 5.5rem;
    min-width: 5.5rem;
    height: 2.25rem;
    padding: 0 0.5rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      color 0.2s ease,
      background-color 0.2s ease;
  }
}

.header-actions {
  --header-control-h: 2rem;
}

.header-github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--header-control-h);
  height: var(--header-control-h);
  color: var(--color-text-subtle);
  transition: color 0.2s ease;

  svg {
    width: 1.35rem;
    height: 1.35rem;
  }

  &:hover {
    color: var(--color-heading);
  }
}

.header-auth {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;

  &__input {
    width: 6.75rem;
    height: var(--header-control-h);

    :deep(.el-input__wrapper) {
      height: var(--header-control-h);
      min-height: var(--header-control-h);
      padding-top: 0;
      padding-bottom: 0;
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
    }

    :deep(.el-input__inner) {
      height: 100%;
      line-height: var(--header-control-h);
    }

    /* 视觉遮罩，避免 type=password 触发浏览器「记住密码 / 密码泄漏」 */
    &--secret :deep(.el-input__inner),
    &--secret :deep(input) {
      -webkit-text-security: disc;
    }
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
    justify-content: center;
    box-sizing: border-box;
    height: var(--header-control-h);
    min-height: var(--header-control-h);
    padding: 0 0.75rem;
    border-radius: var(--el-border-radius-base);
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-blank);
    white-space: nowrap;
  }

  :deep(.el-tag.el-tag--success) {
    --el-tag-border-color: var(--el-border-color);
    border-color: var(--el-border-color);
  }

  :deep(.el-button) {
    height: var(--header-control-h);
    min-height: var(--header-control-h);
    padding: 0 0.75rem;
    border-radius: var(--el-border-radius-base);
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
