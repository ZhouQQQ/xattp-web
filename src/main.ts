import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';

import shadow from 'vue-shadow-dom';
import { plausible } from './plugins/plausible.plugin';

import 'virtual:uno.css';

import { naive } from './plugins/naive.plugin';

import App from './App.vue';
import router from './router';
import { createRouterGuards } from './guards';
import { i18nPlugin } from './plugins/i18n.plugin';

// 自动注销所有 Service Worker，彻底避免被拦截
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (regs.length > 0) {
      regs.forEach(r => r.unregister());
      // 控制台输出提示
      console.log('检测到旧的 Service Worker，已自动清理。请刷新页面以获得最新体验！');
    }
  });
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(createHead());
app.use(i18nPlugin);
app.use(router);
createRouterGuards(router, pinia);
app.use(naive);
app.use(plausible);
app.use(shadow);

app.mount('#app');
