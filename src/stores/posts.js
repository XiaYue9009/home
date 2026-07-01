import { defineStore } from 'pinia';
import { parseFrontmatter } from '../lib/content/frontmatter.js';

const modules = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function loadPosts() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const slug = path.match(/\/([^/]+)\.md$/)?.[1];
      if (!slug) return null;

      const { data, content } = parseFrontmatter(raw);
      if (data.draft) return null;

      return {
        slug,
        title: data.title,
        description: data.description,
        pubDate: new Date(data.pubDate).toISOString(),
        category: data.category,
        tags: data.tags || [],
        body: content.trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export const usePostsStore = defineStore('posts', {
  state: () => ({
    items: loadPosts(),
  }),
  getters: {
    all: (state) => state.items,
    bySlug: (state) => (slug) => state.items.find((post) => post.slug === slug),
    byCategory: (state) => (category) => state.items.filter((post) => post.category === category),
    latest: (state) => (limit = 6) => state.items.slice(0, limit),
  },
});
