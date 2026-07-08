<script setup>
import MarkdownEditor from '@/components/editor/MarkdownEditor/index.vue';

const props = defineProps({
  hint: { type: String, default: '可直接在下方编辑体验' },
  content: { type: String, default: '' },
});

const markdownDemo = ref(props.content);
</script>

<template>
  <div class="system-tool-demo">
    <p class="system-tool-demo__hint text-sm text-subtle">
      {{ hint }}
    </p>
    <MarkdownEditor
      v-model="markdownDemo"
      demo
      placeholder="开始输入…"
      class="system-tool-demo__editor"
    />
  </div>
</template>

<style scoped lang="scss">
.system-tool-demo {
  &__hint {
    margin: 0 0 0.85rem;
    line-height: 1.55;
  }

  &__editor {
    border-radius: 0.75rem;
    overflow: hidden;
  }
}
</style>
