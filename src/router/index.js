import { createRouter, createWebHistory } from 'vue-router';
import { SITE, CATEGORIES } from '../config/consts';

const HomePage = () => import('../views/HomePage.vue');
const CategoryPage = () => import('../views/CategoryPage.vue');
const PostPage = () => import('../views/PostPage.vue');
const AboutPage = () => import('../views/AboutPage.vue');
const LolHeroPage = () => import('../views/LolHeroPage.vue');
const NotFoundPage = () => import('../views/NotFoundPage.vue');

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
      name: 'about',
      component: AboutPage,
      meta: { title: '关于' },
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
      path: '/:category(life|tech|lol)',
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
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} · ${SITE.title}`;
    return;
  }

  if (to.name === 'category') {
    const cat = CATEGORIES[to.params.category];
    document.title = cat ? `${cat.label} · ${SITE.title}` : SITE.title;
  }
});

export default router;
