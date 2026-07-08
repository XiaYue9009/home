import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import {
  buildUniqueFileName,
  getGitHubImageDefaults,
  isGitHubUploadConfigured,
  uploadToGitHub,
} from './scripts/lib/github-image-upload.mjs';

function createDouyinProxy(env) {
  return {
    '/api/douyin': {
      target: 'https://www.douyin.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/douyin/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          const cookie = env.DOUYIN_COOKIE?.trim();
          if (cookie) proxyReq.setHeader('Cookie', cookie);
          proxyReq.setHeader('Referer', 'https://www.douyin.com/');
        });
      },
    },
  };
}

function createGitHubImageUploadPlugin(env) {
  const defaults = getGitHubImageDefaults();

  function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }

  function assertUploadSecret(req) {
    const expected = env.GITHUB_UPLOAD_SECRET?.trim();
    if (!expected) return;
    const provided = String(req.headers['x-upload-secret'] || '').trim();
    if (provided !== expected) {
      throw new Error('上传密钥无效');
    }
  }

  async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    return raw ? JSON.parse(raw) : {};
  }

  return {
    name: 'moonhome-github-image-upload',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (pathname !== '/api/github-image') return next();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'content-type, x-upload-secret',
        );
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          sendJson(res, 200, { ok: isGitHubUploadConfigured(env) });
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { success: false, message: 'Method not allowed' });
          return;
        }

        try {
          assertUploadSecret(req);

          if (!isGitHubUploadConfigured(env)) {
            sendJson(res, 500, { success: false, message: '未配置 GITHUB_TOKEN' });
            return;
          }

          const body = await readJsonBody(req);
          const content = String(body?.content || '').trim();
          const originalName = String(body?.fileName || 'image.png').trim();

          if (!content) {
            sendJson(res, 400, { success: false, message: '缺少图片内容' });
            return;
          }

          const fileName = buildUniqueFileName(originalName);
          const url = await uploadToGitHub({
            token: env.GITHUB_TOKEN,
            repo: defaults.repo,
            branch: defaults.branch,
            basePath: defaults.basePath,
            fileName,
            contentBase64: content,
            customUrl: defaults.customUrl,
          });

          sendJson(res, 200, { success: true, url, fileName });
        } catch (error) {
          sendJson(res, 500, {
            success: false,
            message: error?.message || '上传失败',
          });
        }
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/home/',
    envPrefix: ['VITE_', 'PUBLIC_'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dirs: ['src/lib', 'src/config', 'src/stores'],
        vueTemplate: true,
      }),
      createGitHubImageUploadPlugin(env),
    ],
    server: {
      open: true,
      port: 5577,
      proxy: {
        ...createDouyinProxy(env),
      },
    },
    preview: {
      proxy: {
        ...createDouyinProxy(env),
      },
    },
  };
});
