import { createRouter, createWebHistory } from 'vue-router';
import { SITE, CATEGORIES } from '../config/consts';
import { getStackLink } from '../config/stack.js';

const HomePage = () => import('../views/HomePage/index.vue');
const CategoryPage = () => import('../views/CategoryPage/index.vue');
const PostPage = () => import('../views/PostPage/index.vue');
const NotFoundPage = () => import('../views/NotFoundPage/index.vue');

/** LOL 英雄详情（一屏布局，fitViewport） */
const LolHeroPage = () => import('../views/lol/LolHeroPage/index.vue');

/** 技术栈条目详情 */
const StackDetailPage = () => import('../views/stack/StackDetailPage/index.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { title: '首页' },
    },
    {
      path: '/about',
      redirect: { path: '/', hash: '#about' },
    },
    {
      path: '/posts/:slug',
      name: 'post',
      component: PostPage,
      props: true,
    },
    {
      path: '/lol/:heroId',
      name: 'lol-hero',
      component: LolHeroPage,
      props: true,
      meta: { fitViewport: true },
    },
    {
      path: '/stack/:stackKey',
      name: 'stack-detail',
      component: StackDetailPage,
      props: true,
    },
    {
      path: '/:category(life|tech|travel|lol|upcoming|tools|stack)',
      name: 'category',
      component: CategoryPage,
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
      meta: { title: '页面未找到' },
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} · ${SITE.title}`;
    return;
  }

  if (to.name === 'stack-detail') {
    const item = getStackLink(to.params.stackKey);
    document.title = item
      ? `${item.label} · ${CATEGORIES.stack.label} · ${SITE.title}`
      : SITE.title;
    return;
  }

  if (to.name === 'category') {
    const cat = CATEGORIES[to.params.category];
    document.title = cat ? `${cat.label} · ${SITE.title}` : SITE.title;
  }
});

export default router;
