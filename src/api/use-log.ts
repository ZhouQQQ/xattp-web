import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = '/xattp-server';

/** POST /use/log/report — 前端使用埋点 */
export function use_log_report_api(data: { type: string; args?: unknown }) {
  return AlovaInstance.Post(`${BASE_PATH}/use/log/report`, data);
}
