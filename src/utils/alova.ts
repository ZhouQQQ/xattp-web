import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import { config } from '@/config';
import { sanitizeLoginRedirect } from '@/utils/location';

// 定义不需要处理401的白名单路径
const AUTH_WHITELIST = [
    '/api/v1/auth/login',
    // '/api/v1/auth/info'
];
const GLOBAL_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

export const AlovaInstance = createAlova({
    requestAdapter: adapterFetch(),
    cacheFor: 0,
    beforeRequest(method) {
        // 全局请求超时：10 分钟（未单独设置时生效）
        if (method.config.timeout == null) {
            method.config.timeout = GLOBAL_REQUEST_TIMEOUT_MS;
        }
        method.config.headers = {
            ...(method.config.headers ?? {}),
            'xa-source': 'xattp',
            'xa-version': config.app.version,
        };
        const token = localStorage.getItem('token');
        // 添加 token 到请求头
        if (!method.meta?.ignoreToken && token) {
            method.config.headers['token'] = token;
        }
    },
    responded: {
        onSuccess: async (response, method) => {
            // 判断当前请求URL是否在白名单中
            const isAuthRequest = AUTH_WHITELIST.some(path => method.url.includes(path));
            
            if (response.status == 401 && !isAuthRequest) {
                localStorage.removeItem("token");
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    const redirect = sanitizeLoginRedirect(
                        `${window.location.pathname}${window.location.search}${window.location.hash}`,
                    );
                    const loginPath = redirect === '/'
                        ? '/login'
                        : `/login?redirect=${encodeURIComponent(redirect)}`;
                    window.location.href = loginPath;
                }
            }
            return response.json();
        },
        onError: async (error, method) => {
            // // 判断401并处理
            // if (error?.status === 401) {
            //     const isAuthRequest = AUTH_WHITELIST.some(path => method.url.includes(path));
            //     if (!isAuthRequest) {
            //         const path = window.location.pathname;
            //         localStorage.removeItem('token');
            //         const query = window.location.search;
            //         const hash = window.location.hash;
            //         const result = path + query + hash;
            //         toLogin(result);
            //         return;
            //     }
            // }
            console.error(error);
        },
    },
});




