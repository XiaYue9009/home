import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import App from './App.vue';
import router from './router';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from './config/themes';
import 'element-plus/dist/index.css';
import './styles/global.scss';
import './styles/element-plus.scss';

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
const theme = savedTheme === 'nature' || savedTheme === 'minimal' || savedTheme === 'night'
  ? savedTheme
  : DEFAULT_THEME;
document.documentElement.setAttribute('data-theme', theme);

createApp(App).use(ElementPlus).use(createPinia()).use(router).mount('#app');
