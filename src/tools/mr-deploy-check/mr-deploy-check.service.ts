import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = '/xattp-server';

export type MrDeployEnv = 'test' | 'uat';

export interface MrDeployCheckParams {
  env: MrDeployEnv;
  merge_request_url: string;
}

/**
 * 检测 MR 是否在指定环境部署过
 */
export function getMrDeployCheck(params: MrDeployCheckParams) {
  return AlovaInstance.Get(`${BASE_PATH}/k8s/mr_deploy_check`, { params });
}
