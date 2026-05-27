import { AlovaInstance } from "@/utils/alova";

const BASE_PATH = "/xattp-server";

export interface ApiKeyRow {
  id: number;
  name?: string | null;
  api_key: string;
  expires_at?: string | null;
  enabled: boolean;
  expired?: boolean;
  create_user_id?: string;
  create_user_name?: string;
  update_datetime?: string;
  rotated?: boolean;
}

/** 当前用户 API Key 列表 */
export function apiKeyListAPI(params?: { enabled?: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/api-key/list`, { params });
}

/** 按 id 查询单条 */
export function apiKeyGetAPI(params: { id: number | string }) {
  return AlovaInstance.Get(`${BASE_PATH}/api-key/get`, { params });
}

/** 创建 API Key */
export function apiKeyCreateAPI(data: { name?: string; expires_at?: string | null }) {
  return AlovaInstance.Post(`${BASE_PATH}/api-key/create`, data);
}

/** 更新 API Key */
export function apiKeyUpdateAPI(data: {
  id: number;
  name?: string | null;
  expires_at?: string | null;
  enabled?: boolean;
  rotate?: boolean;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/api-key/update`, data);
}

/** 删除 API Key */
export function apiKeyDeleteAPI(data: { id: number }) {
  return AlovaInstance.Delete(`${BASE_PATH}/api-key/delete`, data);
}
