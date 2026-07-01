<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '请确认' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
});

const emit = defineEmits(['update:open', 'confirm', 'cancel']);
const isMounted = ref(false);

function close() {
  emit('update:open', false);
  emit('cancel');
}

function confirm() {
  emit('confirm');
  emit('update:open', false);
}

function onKeydown(event) {
  if (!props.open) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
  },
);

onMounted(() => {
  isMounted.value = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown);
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <Teleport v-if="isMounted" to="body">
    <Transition name="confirm-dialog">
      <div
        v-if="open"
        class="confirm-dialog__overlay"
        role="presentation"
        @click.self="close"
      >
        <div
          class="confirm-dialog glass-card"
          role="alertdialog"
          :aria-labelledby="title ? 'confirm-dialog-title' : undefined"
          :aria-describedby="message ? 'confirm-dialog-message' : undefined"
        >
          <header class="confirm-dialog__head">
            <h3 id="confirm-dialog-title" class="confirm-dialog__title">{{ title }}</h3>
          </header>

          <p v-if="message" id="confirm-dialog-message" class="confirm-dialog__message">
            {{ message }}
          </p>

          <footer class="confirm-dialog__actions">
            <button type="button" class="confirm-dialog__btn" @click="close">
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="confirm-dialog__btn"
              :class="
                danger
                  ? 'confirm-dialog__btn--danger'
                  : 'confirm-dialog__btn--confirm'
              "
              @click="confirm"
            >
              {{ confirmText }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm-dialog {
  width: min(100%, 22rem);
  padding: 1.25rem 1.25rem 1rem;
  box-shadow: 0 20px 40px rgba(8, 14, 22, 0.2);

  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(8, 14, 22, 0.48);
    backdrop-filter: blur(4px);
  }

  &__head {
    margin-bottom: 0.75rem;
  }

  &__title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--color-heading);
  }

  &__message {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
    margin-top: 1.25rem;
  }

  &__btn {
    min-height: 2.125rem;
    padding: 0.45rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-glass-bg) 96%, transparent);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
      color: var(--color-heading);
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    }

    &--confirm {
      color: var(--color-accent-text);
      border-color: transparent;
      background: var(--color-accent);

      &:hover {
        color: var(--color-accent-text);
        border-color: transparent;
        background: var(--color-accent-hover);
        box-shadow: 0 4px 14px -4px var(--color-btn-shadow);
      }
    }

    &--danger {
      background: color-mix(in srgb, #e06c75 92%, #fff);
      color: #fff;

      &:hover {
        background: #e06c75;
        box-shadow: 0 4px 14px -4px color-mix(in srgb, #e06c75 45%, transparent);
      }
    }
  }
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.18s ease;

  .confirm-dialog {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;

  .confirm-dialog {
    opacity: 0;
    transform: scale(0.96) translateY(0.35rem);
  }
}
</style>
