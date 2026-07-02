import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

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
    ],
    server: {
      open: true,
      port: 5173,
      proxy: createDouyinProxy(env),
    },
    preview: {
      proxy: createDouyinProxy(env),
    },
  };
});
