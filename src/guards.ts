import type { Router } from 'vue-router';
import type { Pinia } from 'pinia';
import { tools } from '@/tools';
import { useUserStore } from '@/stores/user.store';

// 支持多个回调路径和灵活扩展
const WHITE_PATH_LIST = ['/oauth/callback', '/oauth/callback/', '/login'];

/**
 * 工具路由权限：若目标为带 allowUsers 的工具且当前用户 mobile 不在列表中，则重定向首页
 */
function checkToolAllowUser(toPath: string, mobile: string | undefined): boolean {
    const tool = tools.find((t) => t.path === toPath);
    if (!tool?.allowUsers || tool.allowUsers.length === 0) return true;
    return mobile != null && mobile !== '' && tool.allowUsers.includes(mobile);
}

export function createRouterGuards(router: Router, pinia: Pinia) {
    router.beforeEach((to) => {
        // 白名单路径支持前缀匹配，兼容带参数的回调
        if (WHITE_PATH_LIST.some((path) => to.path.startsWith(path))) {
            return true;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            if (to.path !== '/login') {
                return '/login';
            }
            return true;
        }
        // 工具页 allowUsers 校验：无权限则回首页
        if (to.meta?.isTool === true) {
            const userStore = useUserStore(pinia);
            const mobile = userStore.userInfo?.mobile;
            if (!checkToolAllowUser(to.path, mobile)) {
                return '/';
            }
        }
        return true;
    });
}