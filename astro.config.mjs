import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://XiaYue9009.github.io',
  base: '/home',
  server: {
    open: true,
  },
  integrations: [vue(), tailwind({ applyBaseStyles: false }), mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
  vite: {
    plugins: [
      AutoImport({
        imports: ['vue'],
        dirs: ['src/lib', 'src/config'],
        vueTemplate: true,
        include: [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.astro$/],
      }),
      Components({
        dirs: ['src/components'],
        extensions: ['vue'],
        deep: false,
      }),
    ],
  },
});
