import type { LocationQuery } from "vue-router";

/** 地址栏分享参数名 */
export const JSON_SHARE_QUERY_PARAM = "json";

/** 分享链接建议上限（字符数，含域名与参数名） */
export const JSON_SHARE_URL_MAX_LENGTH = 8000;

export function getJsonFromRouteQuery(query: LocationQuery): string | null {
  const raw = query[JSON_SHARE_QUERY_PARAM];
  if (raw == null) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (typeof str !== "string" || !str.trim()) return null;
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export function buildJsonBeautifyShareUrl(
  origin: string,
  path: string,
  json: string
): string {
  const url = new URL(path, origin);
  url.searchParams.set(JSON_SHARE_QUERY_PARAM, json);
  return url.toString();
}
