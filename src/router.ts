import { createRouter, createWebHistory } from 'vue-router';
import { layouts } from './layouts/index';
import HomePage from './pages/Home.page.vue';
import OauthCallback from './views/OauthCallback.vue';
import NotFound from './pages/404.page.vue';
import LoginPage from './pages/Login.page.vue';
import { tools } from './tools';
import { config } from './config';
import { routes as demoRoutes } from './ui/demo/demo.routes';
const toolsRoutes = tools.map(({ path, name, component, ...config }) => ({
  path,
  name,
  component,
  meta: { path, isTool: true, layout: layouts.toolLayout, name, ...config },
}));
const toolsRedirectRoutes = tools
  .filter(({ redirectFrom }) => redirectFrom && redirectFrom.length > 0)
  .flatMap(
    ({ path, redirectFrom }) => redirectFrom?.map(redirectSource => ({ path: redirectSource, redirect: path })) ?? [],
  );

const router = createRouter({
  history: createWebHistory(config.app.baseUrl),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { layout: 'blank' },
    },
    {
      path: '/api-keys',
      name: 'api-keys',
      component: () => import('./pages/ApiKey.page.vue'),
      meta: { layout: layouts.base },
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: OauthCallback,
      // meta:{
      //   layout:'blank',
      // }
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('./pages/About.vue'),
    // },
    ...toolsRoutes,
    ...toolsRedirectRoutes,
    ...(config.app.env === 'development' ? demoRoutes : []),
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ],
});

export default router;
