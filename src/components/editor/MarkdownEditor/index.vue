<script setup>
import EditorShortcutIcon from '@/components/editor/EditorShortcutIcon/index.vue';
import { renderMarkdown } from '@/lib/content/markdown.js';
import { htmlToMarkdown, markdownToHtml } from '@/lib/editor/content-format.js';
import {
  enforceFirstHeadingHtml,
  isSelectionInFirstHeading,
  shouldBlockFirstHeadingRemoval,
  shouldBlockHeadingLevelChange,
} from '@/lib/editor/heading-lock.js';
import {
  insertImageHtml,
  insertImageMarkdown,
  isImageUploadEnabled,
  uploadEditorImage,
} from '@/lib/editor/image-upload.js';
import {
  applyMarkdownShortcut,
  MARKDOWN_SHORTCUTS,
} from '@/lib/editor/markdown-shortcuts.js';
import {
  applyVisualShortcut,
  pasteClipboardImages,
  pastePlainText,
  VISUAL_SHORTCUTS,
} from '@/lib/editor/visual-shortcuts.js';
import { extractTitleFromContent } from '@/lib/upcoming/content-title.js';
import { useEditStore } from '@/stores/edit.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '开始输入…' },
  readonly: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  lockFirstHeading: { type: Boolean, default: false },
  hideToolbar: { type: Boolean, default: false },
  demo: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const editStore = useEditStore();
const textareaRef = ref(null);
const visualRef = ref(null);
const imageInputRef = ref(null);
const editorMode = ref('visual');
const visualFocused = ref(false);
let syncTimer = null;

const editable = computed(() => !props.readonly && (props.demo || editStore.canEdit));
const isVisualMode = computed(() => editorMode.value === 'visual');
const isMarkdownMode = computed(() => editorMode.value === 'markdown');
const previewHtml = computed(() => renderMarkdown(props.modelValue || ''));
const shortcutItems = computed(() => (isVisualMode.value ? VISUAL_SHORTCUTS : MARKDOWN_SHORTCUTS));
const fallbackTitle = computed(() => extractTitleFromContent(props.modelValue) || '未命名');

function updateValue(value) {
  emit('update:modelValue', value);
}

function syncVisualToMarkdown() {
  if (!visualRef.value) return;

  if (props.lockFirstHeading) {
    enforceFirstHeadingHtml(visualRef.value, fallbackTitle.value);
  }

  updateValue(htmlToMarkdown(visualRef.value.innerHTML));
}

function applyVisualHtml() {
  if (!visualRef.value || !isVisualMode.value) return;
  visualRef.value.innerHTML = markdownToHtml(props.modelValue || '');

  if (props.lockFirstHeading) {
    enforceFirstHeadingHtml(visualRef.value, fallbackTitle.value);
  }
}

function scheduleVisualSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncVisualToMarkdown, 200);
}

function onVisualInput() {
  scheduleVisualSync();
}

function onVisualFocus() {
  visualFocused.value = true;
}

function onVisualBlur() {
  visualFocused.value = false;
  syncVisualToMarkdown();
}

async function handleImageFile(file) {
  if (!file || !editable.value) return;

  try {
    if (!isImageUploadEnabled()) {
      window.alert('图床未配置：请配置 Supabase，并部署 upload-github-image Edge Function');
      return;
    }

    const url = await uploadEditorImage(file);

    if (isVisualMode.value) {
      insertImageHtml(url, file.name);
      scheduleVisualSync();
      return;
    }

    if (textareaRef.value) {
      const result = insertImageMarkdown(textareaRef.value, props.modelValue, url, file.name);
      updateValue(result.next);
      nextTick(() => {
        textareaRef.value.focus();
        textareaRef.value.setSelectionRange(result.cursorStart, result.cursorEnd);
      });
    }
  } catch (error) {
    window.alert(error?.message || '图片上传失败');
  }
}

function openImagePicker() {
  imageInputRef.value?.click();
}

function onImageInputChange(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (file) handleImageFile(file);
}

function onVisualKeydown(event) {
  if (!editable.value || !isVisualMode.value) return;

  if (props.lockFirstHeading) {
    if (shouldBlockHeadingLevelChange(event, visualRef.value)) {
      event.preventDefault();
      return;
    }
    if (shouldBlockFirstHeadingRemoval(event, visualRef.value)) {
      event.preventDefault();
      return;
    }
  }

  applyVisualShortcut(event, {
    onToggleMarkdownMode: () => switchEditorMode('markdown'),
    onInsertImage: openImagePicker,
    isFirstHeadingSelection: () =>
      props.lockFirstHeading && isSelectionInFirstHeading(visualRef.value),
  });
}

async function onVisualPaste(event) {
  if (!editable.value || !isVisualMode.value) return;

  const handledImage = await pasteClipboardImages(event, {
    onUploadImage: handleImageFile,
  });
  if (handledImage) {
    scheduleVisualSync();
    return;
  }

  pastePlainText(event);
  scheduleVisualSync();
}

function onMarkdownInput(event) {
  updateValue(event.target.value);
}

function onMarkdownKeydown(event) {
  if (!editable.value || !isMarkdownMode.value) return;

  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
    event.preventDefault();
    switchEditorMode('visual');
    return;
  }

  applyMarkdownShortcut(event, textareaRef.value, {
    value: props.modelValue,
    setValue: updateValue,
    onInsertImage: openImagePicker,
  });
}

function switchEditorMode(mode) {
  if (mode === editorMode.value) return;

  if (editorMode.value === 'visual') {
    syncVisualToMarkdown();
  }

  editorMode.value = mode;

  if (mode === 'visual') {
    nextTick(() => {
      applyVisualHtml();
      focusEditor();
    });
  } else {
    nextTick(() => focusEditor());
  }
}

function focusEditor() {
  if (!editable.value) return;

  if (isVisualMode.value && visualRef.value) {
    visualRef.value.focus();
    if (props.lockFirstHeading) {
      const h1 = visualRef.value.querySelector('h1');
      if (h1) {
        const range = document.createRange();
        range.selectNodeContents(h1);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    return;
  }

  if (isMarkdownMode.value && textareaRef.value) {
    textareaRef.value.focus();
    if (props.lockFirstHeading) {
      const firstLineEnd = props.modelValue.indexOf('\n');
      const end = firstLineEnd === -1 ? props.modelValue.length : firstLineEnd;
      textareaRef.value.setSelectionRange(end, end);
    }
  }
}

defineExpose({ focusEditor });

watch(
  () => props.modelValue,
  () => {
    if (!isVisualMode.value || visualFocused.value) return;
    nextTick(() => applyVisualHtml());
  },
);

watch(
  () => editable.value,
  (value) => {
    if (!value) {
      editorMode.value = 'visual';
    } else if (isVisualMode.value) {
      nextTick(() => applyVisualHtml());
    }
  },
);

watch(
  () => props.autofocus,
  (value) => {
    if (value && editable.value) {
      nextTick(() => focusEditor());
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (isVisualMode.value) {
    applyVisualHtml();
  }
  if (props.autofocus && editable.value) {
    nextTick(() => focusEditor());
  }
});

onBeforeUnmount(() => {
  clearTimeout(syncTimer);
});
</script>

<template>
  <div
    class="markdown-editor glass-card overflow-hidden"
    :class="{ 'markdown-editor--minimal': hideToolbar }"
  >
    <div
      v-if="!hideToolbar && (editable || !readonly)"
      class="markdown-editor__toolbar"
    >
      <span v-if="!editable" class="markdown-editor__readonly-hint">只读 · 导航栏解锁后可编辑</span>
      <button
        v-if="editable"
        type="button"
        class="markdown-editor__mode-btn"
        :title="isVisualMode ? '切换 Markdown 模式 (Ctrl+/)' : '切换富文本模式 (Ctrl+/)'"
        @click="switchEditorMode(isVisualMode ? 'markdown' : 'visual')"
      >
        <EditorShortcutIcon :name="isVisualMode ? 'markdown' : 'heading'" />
        <span>{{ isVisualMode ? 'Markdown' : '富文本' }}</span>
      </button>
    </div>

    <div class="markdown-editor__body">
      <div
        v-if="editable && isVisualMode"
        ref="visualRef"
        class="markdown-editor__visual prose-moon"
        :data-placeholder="placeholder"
        contenteditable="true"
        spellcheck="true"
        @input="onVisualInput"
        @focus="onVisualFocus"
        @blur="onVisualBlur"
        @keydown="onVisualKeydown"
        @paste="onVisualPaste"
      />

      <textarea
        v-else-if="editable && isMarkdownMode"
        ref="textareaRef"
        class="markdown-editor__textarea"
        :value="modelValue"
        :placeholder="placeholder"
        spellcheck="false"
        @input="onMarkdownInput"
        @keydown="onMarkdownKeydown"
      />

      <div
        v-else
        class="markdown-editor__preview prose-moon"
        v-html="previewHtml"
      />
    </div>

    <input
      ref="imageInputRef"
      class="markdown-editor__file-input"
      type="file"
      accept="image/*"
      @change="onImageInputChange"
    />

    <Teleport to="body">
      <details v-if="editable" class="markdown-editor__shortcuts">
        <summary>
          <EditorShortcutIcon name="markdown" />
          <span>快捷键参考（Typora）</span>
        </summary>
        <ul>
          <li v-for="item in shortcutItems" :key="item.keys">
            <EditorShortcutIcon :name="item.icon" />
            <kbd>{{ item.keys }}</kbd>
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </details>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  min-height: 28rem;

  &--minimal {
    min-height: 20rem;
    background: #fff;
    border: 1px solid var(--color-border);
    box-shadow: none;

    .markdown-editor__body {
      background: #fff;
      border-radius: 0 0 1rem 1rem;
    }

    .markdown-editor__visual,
    .markdown-editor__textarea,
    .markdown-editor__preview {
      background: #fff;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0.55rem 0.85rem;
    border-bottom: 1px solid var(--color-border);
  }

  &__readonly-hint {
    margin-right: auto;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  &__mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-heading);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
      background: var(--color-glass-bg);
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    max-height: min(60vh, 32rem);
    overflow: hidden;
  }

  &__visual,
  &__textarea,
  &__preview {
    width: 100%;
    height: 100%;
    min-height: 22rem;
    max-height: min(60vh, 32rem);
    padding: 1rem 1.25rem;
    outline: none;
    overflow-y: auto;
  }

  &__visual {
    color: var(--color-heading);
    line-height: 1.65;

    &:empty::before {
      content: attr(data-placeholder);
      color: var(--color-text-muted);
      pointer-events: none;
    }

    :deep(h1:first-child) {
      margin-top: 0;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin-top: 0.65em;
      margin-bottom: 0.35em;
    }

    :deep(p) {
      margin-top: 0.35em;
      margin-bottom: 0.35em;
    }

    :deep(ol),
    :deep(ul) {
      margin-top: 0.45em;
      margin-bottom: 0.45em;
    }

    :deep(li) {
      margin-top: 0.15em;
      margin-bottom: 0.15em;
    }

    :deep(li > p) {
      margin-top: 0;
      margin-bottom: 0;
    }

    :deep(img) {
      max-width: 100%;
      border-radius: 0.5rem;
    }

    &:focus {
      outline: none;
    }
  }

  &__textarea {
    border: none;
    resize: none;
    background: transparent;
    color: var(--color-heading);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9375rem;
    line-height: 1.65;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__preview {
    overflow-y: auto;
  }

  &__file-input {
    display: none;
  }

  &__shortcuts {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 4000;
    width: min(32rem, calc(100vw - 2rem));
    padding: 0.55rem 0.65rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--color-bg) 92%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 28px color-mix(in srgb, var(--color-heading) 10%, transparent);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    pointer-events: auto;

    summary {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
      user-select: none;
      color: var(--color-heading);
      font-weight: 600;
    }

    ul {
      display: grid;
      gap: 0.35rem 0.5rem;
      margin: 0.55rem 0 0;
      padding: 0;
      list-style: none;
      grid-template-columns: repeat(3, minmax(0, 1fr));

      @media (max-width: 640px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      min-width: 0;
    }

    kbd {
      display: inline-block;
      flex-shrink: 0;
      padding: 0.1rem 0.3rem;
      border-radius: 0.35rem;
      border: 1px solid var(--color-border);
      background: var(--color-glass-bg);
      font-family: inherit;
      font-size: 0.625rem;
      color: var(--color-heading);
      white-space: nowrap;
    }

    li span {
      font-size: 0.6875rem;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
