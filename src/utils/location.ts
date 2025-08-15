import type { LocationQueryValue } from 'vue-router';

export function toLogin(redirectUrl: string | null | LocationQueryValue[]) {
    // 跳转到登录
    let redirectUri = window.location.origin + '/oauth/callback';
    let safeRedirect = redirectUrl;
    if (typeof safeRedirect === 'string' && safeRedirect.includes('/oauth/callback')) {
        safeRedirect = '/';
    }
    if(safeRedirect){
        redirectUri = redirectUri+"?r="+safeRedirect;
    }
    let loginUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=ding5uqchbmuas1g9bis&scope=openid&state=state&prompt=consent`;
    window.location.href = loginUrl;
}