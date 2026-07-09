<script setup>
import { ElMessage } from 'element-plus';
import {
  assertValidImageFile,
  IMAGE_ACCEPT_ATTR,
  IMAGE_FORMAT_HINT,
} from '@/lib/editor/image-upload.js';
import {
  checkGitHubImageBedAvailable,
  getGitHubImageDefaults,
  getGitHubImageRepo,
  isGitHubImageBedConfigured,
  resetGitHubImageAvailabilityCache,
  toMarkdownImage,
  uploadFileToGitHubRepo,
} from '@/lib/github/image-bed.js';

const props = defineProps({
  links: {
    type: Object,
    default: () => ({
      repo: `https://github.com/${getGitHubImageRepo()}`,
    }),
  },
});

const defaults = getGitHubImageDefaults();
const status = ref('checking');
const lastUrl = ref('');
const lastMarkdown = ref('');
const uploading = ref(false);

const statusLabel = computed(() => {
  if (status.value === 'checking') return '检测中…';
  if (status.value === 'online') return '图床可用';
  if (status.value === 'offline') return '图床未就绪';
  return '图床未配置';
});

const uploadDisabled = computed(
  () => uploading.value || status.value !== 'online',
);

async function refreshStatus() {
  resetGitHubImageAvailabilityCache();
  status.value = 'checking';

  if (!isGitHubImageBedConfigured()) {
    status.value = 'disabled';
    return;
  }

  status.value = (await checkGitHubImageBedAvailable()) ? 'online' : 'offline';
}

async function handleUpload(options) {
  const { file, onError, onSuccess } = options;
  uploading.value = true;

  try {
    const url = await uploadFileToGitHubRepo(file);
    const alt = file.name.replace(/\.[^.]+$/, '') || '图片';
    lastUrl.value = url;
    lastMarkdown.value = toMarkdownImage(url, alt);
    status.value = 'online';
    ElMessage.success('上传成功');
    onSuccess?.({ url });
  } catch (err) {
    const message = err?.message || '上传失败';
    ElMessage.error(message);
    await refreshStatus();
    onError?.(err);
  } finally {
    uploading.value = false;
  }
}

function beforeUpload(file) {
  try {
    assertValidImageFile(file);
    return true;
  } catch (err) {
    ElMessage.warning(err?.message || '图片校验失败');
    return false;
  }
}

async function copyText(text, label) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  ElMessage.success(`已复制${label}`);
}

function copyUrl() {
  return copyText(lastUrl.value, '图片地址');
}

function copyMarkdown() {
  return copyText(lastMarkdown.value, 'Markdown');
}

onMounted(refreshStatus);
</script>

<template>
  <div class="github-image-tool-demo">
    <div class="github-image-tool-demo__status" :data-status="status">
      <span class="github-image-tool-demo__dot" aria-hidden="true" />
      <span>{{ statusLabel }}</span>
      <button type="button" class="github-image-tool-demo__refresh" @click="refreshStatus">
        重新检测
      </button>
    </div>

    <p class="github-image-tool-demo__hint text-sm text-subtle">
      上传后图片写入
      <a :href="props.links.repo" target="_blank" rel="noopener noreferrer" class="text-link">
        {{ defaults.repo }}
      </a>
      ，通过 jsDelivr CDN 分发。本地与线上共用 Supabase Edge Function 上传接口。
    </p>

    <el-upload
      class="github-image-tool-demo__upload"
      drag
      :accept="IMAGE_ACCEPT_ATTR"
      :show-file-list="false"
      :disabled="uploadDisabled"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
    >
      <div class="github-image-tool-demo__upload-icon" aria-hidden="true">🖼️</div>
      <div class="el-upload__text">
        {{ uploading ? '上传中…' : '将图片拖到此处，或点击上传' }}
      </div>
      <template #tip>
        <div class="el-upload__tip text-sm text-muted">
          支持 {{ IMAGE_FORMAT_HINT }}，单张不超过 100MB
        </div>
      </template>
    </el-upload>

    <div v-if="lastUrl" class="github-image-tool-demo__result glass-card">
      <img :src="lastUrl" alt="上传预览" class="github-image-tool-demo__preview" />
      <div class="github-image-tool-demo__result-body">
        <p class="github-image-tool-demo__result-label text-sm text-subtle">图片地址</p>
        <code class="github-image-tool-demo__code">{{ lastUrl }}</code>
        <div class="github-image-tool-demo__actions">
          <button type="button" class="btn-ghost text-sm" @click="copyUrl">
            复制图片地址
          </button>
          <button type="button" class="btn-ghost text-sm" @click="copyMarkdown">
            复制 Markdown
          </button>
        </div>
      </div>
    </div>

    <ol class="github-image-tool-demo__steps text-sm text-muted">
      <li>Supabase 部署 <code>upload-github-image</code>，Secret 配置 <code>GITHUB_TOKEN</code></li>
      <li><code>.env</code> 配置 <code>PUBLIC_SUPABASE_URL</code>、<code>PUBLIC_SUPABASE_ANON_KEY</code></li>
      <li>若启用上传密钥，<code>GITHUB_UPLOAD_SECRET</code> 与 <code>PUBLIC_GITHUB_UPLOAD_SECRET</code> 须保持一致</li>
      <li>上传成功后可复制图片地址或 Markdown，编辑器粘贴图片走同一接口</li>
    </ol>
  </div>
</template>

<style scoped lang="scss">
.github-image-tool-demo {
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
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 1.25rem 1rem;
      background: color-mix(in srgb, var(--color-glass-bg) 92%, transparent);
      border-color: color-mix(in srgb, #22c55e 22%, var(--color-border));
      transition: border-color 0.25s ease;

      &:hover {
        border-color: color-mix(in srgb, #22c55e 45%, var(--color-border));
      }
    }
  }

  &__upload-icon {
    font-size: 2rem;
    line-height: 1;
    margin-bottom: 0.35rem;
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

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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
