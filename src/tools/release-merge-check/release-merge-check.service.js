import { AlovaInstance } from '@/utils/alova';
const BASE_PATH = "/xattp-server"
/**
 * @description 获取TAPD发布计划MR统计信息
 * @param {Object} params 请求参数
 * @param {string} params.tapd_release_url TAPD发布计划链接
 * @returns {Promise} API响应
 */
export function getTapdReleaseInfo(params) {
  return AlovaInstance.Post(`${BASE_PATH}/tapd/release/info`, params);
} 