<script setup>
import {
  MATCHUP_DIFFICULTIES,
  getDifficultyLabel,
} from '../config/lol-matchup-difficulty.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  allowEmpty: { type: Boolean, default: true },
  placeholder: { type: String, default: '—' },
  size: { type: String, default: 'sm' },
  variant: { type: String, default: 'bordered' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const menuStyle = ref({});
const isMounted = ref(false);
let triggerEl = null;

const displayLabel = computed(() => {
  if (props.modelValue) return getDifficultyLabel(props.modelValue);
  return props.placeholder;
});

const tagVariant = computed(() => (props.modelValue ? `is-${props.modelValue}` : 'is-empty'));

const options = computed(() => {
  const list = [...MATCHUP_DIFFICULTIES];
  if (props.allowEmpty) {
    return [{ id: '', label: props.placeholder }, ...list];
  }
  return list;
});

function updateMenuPosition() {
  if (!triggerEl) return;

  const rect = triggerEl.getBoundingClientRect();
  menuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 7.5 * 16)}px`,
    zIndex: 10050,
  };
}

function closeMenu() {
  open.value = false;
}

function toggleMenu(event) {
  if (props.disabled) return;
  triggerEl = event.currentTarget;
  open.value = !open.value;
  if (open.value) nextTick(updateMenuPosition);
}

function selectOption(id) {
  emit('update:modelValue', id);
  closeMenu();
}

function onDocumentClick(event) {
  if (!open.value) return;
  const target = event.target;
  if (triggerEl?.contains(target)) return;
  if (target.closest?.('.difficulty-select__menu')) return;
  closeMenu();
}

function onDocumentKeydown(event) {
  if (open.value && event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
}

function onViewportChange() {
  if (open.value) closeMenu();
}

watch(open, (isOpen) => {
  if (typeof window === 'undefined') return;
  if (isOpen) {
    updateMenuPosition();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
  } else {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
  }
});

onMounted(() => {
  isMounted.value = true;
  if (typeof document === 'undefined') return;
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});

onUnmounted(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
  }
});
</script>

<template>
  <div
    class="difficulty-select"
    :class="[
      `difficulty-select--${size}`,
      `difficulty-select--${variant}`,
      { 'is-open': open, 'is-disabled': disabled, 'has-value': !!modelValue },
    ]"
  >
    <button
      type="button"
      class="difficulty-select__trigger"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="toggleMenu"
    >
      <span
        v-if="variant === 'select'"
        class="difficulty-select__value"
        :class="[tagVariant, { 'is-placeholder': !modelValue }]"
      >
        {{ displayLabel }}
      </span>
      <span
        v-else
        class="difficulty-select__tag"
        :class="[tagVariant, { 'is-placeholder': !modelValue }]"
      >
        {{ displayLabel }}
      </span>
      <span class="difficulty-select__arrow" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <Teleport v-if="isMounted" to="body">
      <Transition name="difficulty-select-menu">
        <ul
          v-if="open"
          class="difficulty-select__menu glass-card"
          role="listbox"
          :style="menuStyle"
        >
          <li
            v-for="item in options"
            :key="item.id || '__empty'"
            class="difficulty-select__option"
            :class="{
              'is-selected': modelValue === item.id,
              [`is-${item.id}`]: !!item.id,
            }"
            role="option"
            :aria-selected="modelValue === item.id"
            @click="selectOption(item.id)"
          >
            <span v-if="item.id" class="difficulty-select__option-tag" :class="`is-${item.id}`">
              {{ item.label }}
            </span>
            <span v-else class="difficulty-select__option-empty">{{ item.label }}</span>
            <svg
              v-if="modelValue === item.id"
              class="difficulty-select__check"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.difficulty-select {
  display: inline-flex;
  max-width: 100%;

  &--select {
    min-width: 7.75rem;

    .difficulty-select__trigger {
      width: 100%;
      min-width: 7.75rem;
      min-height: 2rem;
      padding: 0 0.55rem 0 0.75rem;
      gap: 0.35rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-glass-bg) 94%, transparent);
      justify-content: space-between;

      &:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
        background: color-mix(in srgb, var(--color-glass-bg) 90%, var(--color-accent) 10%);
      }
    }

    &.is-open .difficulty-select__trigger {
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 10%, transparent);
    }

    .difficulty-select__value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.2;
      white-space: nowrap;
      color: var(--color-heading);

      &.is-placeholder {
        color: var(--color-text-muted);
        font-weight: 400;
      }

      &.is-hard {
        color: #e06c75;
        font-weight: 600;
      }

      &.is-harder {
        color: #d08770;
        font-weight: 600;
      }

      &.is-normal {
        color: var(--color-heading);
        font-weight: 600;
      }

      &.is-easy {
        color: #7fbd8a;
        font-weight: 600;
      }

      &.is-unknown {
        color: var(--color-text-muted);
        font-weight: 500;
      }
    }

    .difficulty-select__arrow {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      color: var(--color-text-subtle);
    }
  }

  &--plain {
    .difficulty-select__trigger {
      border: none;
      background: transparent;
      padding: 0;
      gap: 0.2rem;
      min-height: auto;

      &:hover:not(:disabled) {
        border: none;
        background: transparent;
      }
    }

    &.is-open .difficulty-select__trigger {
      border: none;
      box-shadow: none;
    }

    .difficulty-select__tag.is-placeholder {
      padding: 0;
      background: transparent;
      color: var(--color-text-subtle);
      font-weight: 500;
    }
  }

  &--sm:not(.difficulty-select--plain):not(.difficulty-select--select) {
    .difficulty-select__trigger {
      min-height: 1.875rem;
      padding: 0.15rem 0.2rem 0.15rem 0.15rem;
    }
  }

  &--sm {
    .difficulty-select__tag:not(.is-placeholder) {
      padding: 0.2rem 0.55rem;
      font-size: 0.8125rem;
    }
  }

  &--md:not(.difficulty-select--plain):not(.difficulty-select--select) {
    .difficulty-select__trigger {
      min-height: 2.125rem;
      padding: 0.2rem 0.35rem 0.2rem 0.25rem;
    }
  }

  &--md {
    .difficulty-select__tag:not(.is-placeholder) {
      padding: 0.25rem 0.65rem;
      font-size: 0.8125rem;
    }
  }

  &--bordered.is-open .difficulty-select__trigger {
    border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 10%, transparent);
  }

  &.is-disabled {
    opacity: 0.55;
    pointer-events: none;
  }
}

.difficulty-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  max-width: 100%;
  padding: 0.15rem 0.2rem 0.15rem 0.15rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-glass-bg) 96%, transparent);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  .difficulty-select--bordered &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
    background: color-mix(in srgb, var(--color-glass-bg) 88%, var(--color-accent) 12%);
  }

  .difficulty-select--plain.has-value &:hover:not(:disabled) .difficulty-select__tag:not(.is-placeholder) {
    filter: brightness(1.05);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.difficulty-select__tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 9999px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  &.is-empty,
  &.is-placeholder {
    color: var(--color-text-subtle);
    background: transparent;
  }

  &.is-hard {
    color: #e06c75;
    background: color-mix(in srgb, #e06c75 14%, transparent);
  }

  &.is-harder {
    color: #d08770;
    background: color-mix(in srgb, #d08770 14%, transparent);
  }

  &.is-normal {
    color: var(--color-heading);
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  &.is-easy {
    color: #7fbd8a;
    background: color-mix(in srgb, #7fbd8a 14%, transparent);
  }

  &.is-unknown {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-text-subtle) 12%, transparent);
    border: 1px dashed color-mix(in srgb, var(--color-text-subtle) 35%, transparent);
  }
}

.difficulty-select__arrow {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease, color 0.2s ease;

  .is-open & {
    transform: rotate(180deg);
    color: var(--color-accent);
  }
}

.difficulty-select__menu {
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: 0.75rem;
  box-shadow:
    0 12px 32px color-mix(in srgb, var(--color-bg) 35%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-border) 80%, transparent);
}

.difficulty-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  }

  &.is-selected {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }
}

.difficulty-select__option-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;

  &.is-hard {
    color: #e06c75;
    background: color-mix(in srgb, #e06c75 14%, transparent);
  }

  &.is-harder {
    color: #d08770;
    background: color-mix(in srgb, #d08770 14%, transparent);
  }

  &.is-normal {
    color: var(--color-heading);
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  &.is-easy {
    color: #7fbd8a;
    background: color-mix(in srgb, #7fbd8a 14%, transparent);
  }

  &.is-unknown {
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-text-subtle) 12%, transparent);
    border: 1px dashed color-mix(in srgb, var(--color-text-subtle) 35%, transparent);
  }
}

.difficulty-select__option-empty {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.difficulty-select__check {
  flex-shrink: 0;
  color: var(--color-accent);
}

.difficulty-select-menu-enter-active,
.difficulty-select-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.difficulty-select-menu-enter-from,
.difficulty-select-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
