import type { RouteRecordRaw, Router } from 'vue-router';

// 支持多个回调路径和灵活扩展
const WHITE_PATH_LIST = ['/oauth/callback', '/oauth/callback/', '/login'];
export function createRouterGuards(router: Router) {
    router.beforeEach(async (to, from) => {
        // 白名单路径支持前缀匹配，兼容带参数的回调
        if (WHITE_PATH_LIST.some(path => to.path.startsWith(path))) {
            return true;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            // 未登录时跳转到登录页，不直接跳钉钉
            if (to.path !== '/login') {
                return '/login';
            }
        }
        return true;
    });
}