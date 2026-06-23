<script setup lang="ts">
import { onMounted, ref } from 'vue';

/**
 * Giscus 评论组件
 * 配置步骤：https://giscus.app/zh-CN
 * 1. 在 GitHub 仓库开启 Discussions
 * 2. 在 giscus.app 生成配置，填入下方 props 或 .env
 */
interface Props {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  repo: import.meta.env.PUBLIC_GISCUS_REPO || 'XiaYue9009/MoonHome',
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID || '',
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY || 'Announcements',
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID || '',
});

const containerRef = ref<HTMLElement | null>(null);
const configured = ref(false);

onMounted(() => {
  if (!props.repoId || !props.categoryId) return;

  configured.value = true;
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', props.repo);
  script.setAttribute('data-repo-id', props.repoId);
  script.setAttribute('data-category', props.category);
  script.setAttribute('data-category-id', props.categoryId);
  script.setAttribute('data-mapping', 'pathname');
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'top');
  script.setAttribute('data-theme', 'dark');
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('data-loading', 'lazy');
  script.crossOrigin = 'anonymous';
  script.async = true;
  containerRef.value?.appendChild(script);
});
</script>

<template>
  <div ref="containerRef" class="giscus-wrapper min-h-[120px]">
    <div
      v-if="!configured"
      class="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-slate-400"
    >
      <p class="font-medium text-slate-300">评论区尚未配置</p>
      <p class="mt-2">
        请前往
        <a
          href="https://giscus.app/zh-CN"
          target="_blank"
          rel="noopener noreferrer"
          class="text-moon-400 hover:text-moon-300"
        >
          giscus.app
        </a>
        生成配置，写入 <code class="text-moon-200">.env</code> 中的
        <code class="text-moon-200">PUBLIC_GISCUS_*</code> 变量。
      </p>
    </div>
  </div>
</template>

<style scoped>
.giscus-wrapper :deep(iframe) {
  width: 100%;
}
</style>
