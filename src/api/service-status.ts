import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = '/xattp-server';

export type ServiceStatusStep = {
  id?: number;
  report_id?: string;
  client_name?: string | null;
  scene_name?: string | null;
  step_name?: string | null;
  api_path?: string | null;
  /** 0 跳过 1 成功 2 失败 null 未知 */
  step_status?: number | null;
  errormsg?: string | null;
  start_time?: string | null;
};

export type ServiceStatusReport = {
  id?: number | null;
  report_id?: string | null;
  env?: string | null;
  env_name?: string | null;
  tenant_id?: string | null;
  business_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  error_msg?: string | null;
  success_count?: number;
  fail_count?: number;
  skip_count?: number;
  unknown_count?: number;
  total_count?: number;
  list?: ServiceStatusStep[];
};

export type ServiceStatusListParams = {
  business_name: string;
  env: string;
  latest?: number;
  tenant_id?: string;
  id?: number | string;
  report_id?: string;
};

/** GET /service_status/list — 查询最近一次（或第 n 次）巡检报告及步骤 */
export function service_status_list_api(params: ServiceStatusListParams) {
  return AlovaInstance.Get(`${BASE_PATH}/service_status/list`, { params });
}

/** POST /service_status/run — 触发指定环境 Jenkins 巡检 */
export function service_status_run_api(data: { env: string }) {
  return AlovaInstance.Post(`${BASE_PATH}/service_status/run`, data);
}
