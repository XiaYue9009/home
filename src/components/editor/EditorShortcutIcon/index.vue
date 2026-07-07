<script setup>
defineProps({
  name: { type: String, required: true },
});
</script>

<template>
  <svg
    class="editor-shortcut-icon"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="name === 'bold'"
      d="M4 2.5h4.1c1.8 0 3.1 1 3.1 2.6 0 1-.5 1.7-1.3 2.1 1 .4 1.7 1.3 1.7 2.6 0 1.8-1.4 2.9-3.4 2.9H4V2.5zm2.2 4.3h1.7c.8 0 1.2-.4 1.2-1.1 0-.7-.4-1.1-1.2-1.1H6.2v2.2zm0 4.4h2c1 0 1.5-.5 1.5-1.3 0-.8-.5-1.3-1.5-1.3h-2v2.6z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'italic'"
      d="M6.5 2.5h5.2l-.6 1.4H9.3l-2.2 9.2H6.1L8.3 3.9H5.9l.6-1.4z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'link'"
      d="M6.4 9.1a2.6 2.6 0 0 0 3.7 0l1.4-1.4a2.6 2.6 0 1 0-3.7-3.7L7.4 5.4l-.8-.8 1.4-1.4a3.8 3.8 0 1 1 5.4 5.4l-1.4 1.4a3.8 3.8 0 0 1-5.4 0l-.8-.9zM9.6 6.9a2.6 2.6 0 0 0-3.7 0L4.5 8.3a2.6 2.6 0 1 0 3.7 3.7l1.4-1.4.8.8-1.4 1.4a3.8 3.8 0 1 1-5.4-5.4l1.4-1.4a3.8 3.8 0 0 1 5.4 0l.8.9-1.4 1.4z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'code'"
      d="M5.6 4.7 2.8 8l2.8 3.3-.9.8L1.5 8l3.2-4.1.9.8zm4.8 0 .9-.8 3.2 4.1-3.2 4.1-.9-.8L13.2 8 10.4 4.7z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'heading'"
      d="M3 2.5h1.8V6h4.4V2.5H11v11H9.2v-4.5H5.8V13.5H4V2.5z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'table'"
      d="M2.5 3.5A1 1 0 0 1 3.5 2.5h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9zm1 1v2.2h2.2V4.5H3.5zm3.2 0v2.2H9v-2.2H6.7zm3.3 0v2.2h2.2V4.5H10zm-6.5 3.2v2.2h2.2V7.7H3.5zm3.2 0v2.2H9V7.7H6.7zm3.3 0v2.2h2.2V7.7H10zM3.5 11v1.5h2.2V11H3.5zm3.2 0v1.5H9V11H6.7zm3.3 0v1.5h2.2V11H10z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'ol'"
      d="M3.2 3.5h1.1v1.1H3.2V3.5zm0 3.4h1.1v1.1H3.2V6.9zm0 3.4h1.1v1.1H3.2v-1.1zM6 4.1h7v1H6V4.1zm0 3.4h7v1H6v-1zm0 3.4h7v1H6v-1z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'ul'"
      d="M3.4 4.1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM6 4.1h7v1H6V4.1zm0 3.4h7v1H6v-1zm0 3.4h7v1H6v-1z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'color'"
      d="M8 2.5c2.8 0 5 2.2 5 5 0 1.9-1.1 3.6-2.7 4.4L8 13.5l-2.3-1.6A5 5 0 0 1 3 7.5c0-2.8 2.2-5 5-5zm0 1.5c-1.9 0-3.5 1.6-3.5 3.5S6.1 11 8 11s3.5-1.6 3.5-3.5S9.9 4 8 4z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'image'"
      d="M3.5 3.5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zm1 1v4.8l2-1.8 2.2 2.4L11 7.3l1.5 1.7V4.5h-8zm1.2 1.6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'markdown'"
      d="M3.5 2.5h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm1.2 3.2v5.6L7.8 8.8l1.5 2.5 1.5-2.5 3.1 2.5V5.7H4.7z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'math'"
      d="M4.2 12.5 6.1 8.9 3.5 3.5h1.7l1.5 3.4 1.6-3.4h1.6l-2.6 5.4 1.9 3.6H4.2zM11.2 3.5h1.6v9h-1.6v-9z"
      fill="currentColor"
    />
    <path
      v-else
      d="M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z"
      fill="currentColor"
    />
  </svg>
</template>

<style scoped lang="scss">
.editor-shortcut-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: var(--color-accent-soft);
}
</style>
