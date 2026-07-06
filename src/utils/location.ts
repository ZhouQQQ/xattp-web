import type { LocationQueryValue } from 'vue-router';

const LOGIN_REDIRECT_BLOCKLIST = ['/oauth/callback', '/login'] as const;

/** 登录后允许回跳的路径（仅站内相对路径） */
export function sanitizeLoginRedirect(redirect: string | null | undefined): string {
  if (!redirect || typeof redirect !== 'string') return '/';
  const trimmed = redirect.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (LOGIN_REDIRECT_BLOCKLIST.some((path) => trimmed === path || trimmed.startsWith(`${path}?`))) {
    return '/';
  }
  if (trimmed.includes('/oauth/callback')) return '/';
  return trimmed;
}

export function toLogin(redirectUrl: string | null | LocationQueryValue[] = '/') {
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const safeRedirect = sanitizeLoginRedirect(
    Array.isArray(redirectUrl) ? null : redirectUrl,
  );
  // 钉钉回调不会保留 redirect_uri 上的 query，需通过 state 带回登录前路径
  const state = encodeURIComponent(safeRedirect);
  const loginUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=ding5uqchbmuas1g9bis&scope=openid&state=${state}&prompt=consent`;
  window.location.href = loginUrl;
}

export function resolvePostLoginRedirect(
  state: LocationQueryValue | LocationQueryValue[] | undefined,
  legacyRedirect?: LocationQueryValue | LocationQueryValue[],
): string {
  if (typeof state === 'string' && state) {
    try {
      return sanitizeLoginRedirect(decodeURIComponent(state));
    } catch {
      return sanitizeLoginRedirect(state);
    }
  }
  if (typeof legacyRedirect === 'string' && legacyRedirect) {
    return sanitizeLoginRedirect(legacyRedirect);
  }
  return '/';
}