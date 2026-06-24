import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig({
  base: '/home/',
  envPrefix: ['VITE_', 'PUBLIC_'],
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
  },
});
