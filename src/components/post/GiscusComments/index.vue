<script setup>
const props = defineProps({
  repo: {
    type: String,
    default: import.meta.env.PUBLIC_GISCUS_REPO || 'XiaYue9009/home',
  },
  repoId: {
    type: String,
    default: import.meta.env.PUBLIC_GISCUS_REPO_ID || '',
  },
  category: {
    type: String,
    default: import.meta.env.PUBLIC_GISCUS_CATEGORY || 'Announcements',
  },
  categoryId: {
    type: String,
    default: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID || '',
  },
});

const containerRef = ref(null);
const configured = ref(false);

function getGiscusTheme() {
  const theme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  return THEMES[theme]?.giscus ?? 'dark_dimmed';
}

function syncGiscusTheme() {
  const iframe = document.querySelector('iframe.giscus-frame');
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: getGiscusTheme() } } },
    'https://giscus.app',
  );
}

function mountGiscus() {
  if (!props.repoId || !props.categoryId || !containerRef.value) return;

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
  script.setAttribute('data-theme', getGiscusTheme());
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('data-loading', 'lazy');
  script.crossOrigin = 'anonymous';
  script.async = true;
  containerRef.value.appendChild(script);
}

onMounted(() => {
  mountGiscus();
  window.addEventListener('theme-change', syncGiscusTheme);
});

onUnmounted(() => {
  window.removeEventListener('theme-change', syncGiscusTheme);
});
</script>

<template>
  <div ref="containerRef" class="giscus-wrapper min-h-[120px]">
    <div
      v-if="!configured"
      class="glass-card rounded-xl border border-dashed p-6 text-sm text-muted"
    >
      <p class="font-medium text-heading">评论区尚未配置</p>
      <p class="mt-2">
        请前往
        <a
          href="https://giscus.app/zh-CN"
          target="_blank"
          rel="noopener noreferrer"
          class="text-link"
        >
          giscus.app
        </a>
        生成配置，写入 <code class="text-accent-soft">.env</code> 中的
        <code class="text-accent-soft">PUBLIC_GISCUS_*</code> 变量。
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.giscus-wrapper {
  :deep(iframe) {
    width: 100%;
  }
}
</style>
