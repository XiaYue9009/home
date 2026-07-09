<script setup>
import {
  assertValidImageFile,
  IMAGE_ACCEPT_ATTR,
  IMAGE_FORMAT_HINT,
} from '@/lib/editor/image-upload.js';
import {
  checkPicGoAvailable,
  isPicGoConfigured,
  resetPicGoAvailabilityCache,
  toMarkdownImage,
  uploadFileToPicGo,
} from '@/lib/picgo/client.js';

const props = defineProps({
  links: {
    type: Object,
    default: () => ({
      picgo: 'https://picgo.app/',
      docs: 'https://docs.picgo.app/zh/gui/',
      repo: 'https://github.com/XiaYue9009/picgo_moonhome',
    }),
  },
});

const status = ref('checking');
const lastUrl = ref('');
const lastMarkdown = ref('');
const uploading = ref(false);
const error = ref('');

const statusLabel = computed(() => {
  if (status.value === 'checking') return '检测中…';
  if (status.value === 'online') return 'PicGo Server 已连接';
  if (status.value === 'offline') return 'PicGo Server 未启动';
  return 'PicGo 未配置';
});

async function refreshStatus() {
  resetPicGoAvailabilityCache();
  status.value = 'checking';
  error.value = '';

  if (!isPicGoConfigured()) {
    status.value = 'disabled';
    return;
  }

  status.value = (await checkPicGoAvailable()) ? 'online' : 'offline';
}

async function handleUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    assertValidImageFile(file);
  } catch (err) {
    error.value = err?.message || '图片校验失败';
    return;
  }

  uploading.value = true;
  error.value = '';

  try {
    const url = await uploadFileToPicGo(file);
    lastUrl.value = url;
    lastMarkdown.value = toMarkdownImage(url, file.name.replace(/\.[^.]+$/, '') || '图片');
    status.value = 'online';
  } catch (err) {
    error.value = err?.message || '上传失败';
    await refreshStatus();
  } finally {
    uploading.value = false;
  }
}

async function copyMarkdown() {
  if (!lastMarkdown.value) return;
  await navigator.clipboard.writeText(lastMarkdown.value);
}

onMounted(refreshStatus);
</script>

<template>
  <div class="picgo-tool-demo">
    <div class="picgo-tool-demo__status" :data-status="status">
      <span class="picgo-tool-demo__dot" aria-hidden="true" />
      <span>{{ statusLabel }}</span>
      <button type="button" class="picgo-tool-demo__refresh" @click="refreshStatus">
        重新检测
      </button>
    </div>

    <p class="picgo-tool-demo__hint text-sm text-subtle">
      请先安装
      <a :href="props.links.picgo" target="_blank" rel="noopener noreferrer" class="text-link">PicGo</a>
      并开启 Server，安装
      <a :href="props.links.repo" target="_blank" rel="noopener noreferrer" class="text-link">picgo-plugin-moonhome</a>
      后设为当前图床。
    </p>

    <label class="picgo-tool-demo__upload glass-card">
      <input
        type="file"
        :accept="IMAGE_ACCEPT_ATTR"
        :disabled="uploading || status !== 'online'"
        @change="handleUpload"
      />
      <span class="picgo-tool-demo__upload-title">
        {{ uploading ? '上传中…' : '选择图片上传' }}
      </span>
      <span class="picgo-tool-demo__upload-desc text-sm text-muted">
        支持 {{ IMAGE_FORMAT_HINT }}，单张不超过 100MB
      </span>
    </label>

    <p v-if="error" class="picgo-tool-demo__error text-sm">{{ error }}</p>

    <div v-if="lastUrl" class="picgo-tool-demo__result glass-card">
      <img :src="lastUrl" alt="上传预览" class="picgo-tool-demo__preview" />
      <div class="picgo-tool-demo__result-body">
        <p class="picgo-tool-demo__result-label text-sm text-subtle">Markdown 链接</p>
        <code class="picgo-tool-demo__code">{{ lastMarkdown }}</code>
        <button type="button" class="btn-ghost text-sm" @click="copyMarkdown">
          复制 Markdown
        </button>
      </div>
    </div>

    <ol class="picgo-tool-demo__steps text-sm text-muted">
      <li>克隆 <code>picgo-plugin-moonhome</code> 并在 PicGo 中安装插件</li>
      <li>配置 GitHub Token，仓库设为 <code>XiaYue9009/picgo_moonhome</code></li>
      <li>PicGo 设置 → 开启 Server（默认 127.0.0.1:36677）</li>
      <li>本地 <code>pnpm dev</code> 后，编辑器粘贴图片即可自动上传</li>
    </ol>
  </div>
</template>

<style scoped lang="scss">
.picgo-tool-demo {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);

    &[data-status='online'] {
      color: #22c55e;
    }

    &[data-status='offline'],
    &[data-status='disabled'] {
      color: #f97316;
    }
  }

  &__dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
  }

  &__refresh {
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-text-subtle) 25%, transparent);
    border-radius: 999px;
    cursor: pointer;

    &:hover {
      color: var(--color-text);
      border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
    }
  }

  &__hint {
    margin: 0;
    line-height: 1.55;
  }

  &__upload {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1rem 1.1rem;
    cursor: pointer;
    transition: border-color 0.25s ease;

    input {
      display: none;
    }

    &:hover {
      border-color: color-mix(in srgb, #22c55e 28%, transparent);
    }
  }

  &__upload-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-heading);
  }

  &__upload-desc {
    margin: 0;
    line-height: 1.5;
  }

  &__error {
    margin: 0;
    color: #f87171;
  }

  &__result {
    display: grid;
    gap: 0.85rem;
    padding: 0.85rem;

    @media (min-width: 480px) {
      grid-template-columns: 7rem 1fr;
      align-items: start;
    }
  }

  &__preview {
    width: 100%;
    max-height: 7rem;
    object-fit: cover;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-glass-bg) 80%, black 20%);
  }

  &__result-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  &__result-label {
    margin: 0;
  }

  &__code {
    display: block;
    padding: 0.55rem 0.65rem;
    font-size: 0.75rem;
    line-height: 1.5;
    word-break: break-all;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-glass-bg) 88%, #22c55e 12%);
    border: 1px solid color-mix(in srgb, #22c55e 18%, transparent);
  }

  &__steps {
    margin: 0;
    padding-left: 1.1rem;
    line-height: 1.65;

    code {
      font-size: 0.8125rem;
      color: var(--color-accent-soft);
    }
  }
}
</style>
