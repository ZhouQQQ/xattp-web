import { AlovaInstance } from '@/utils/alova';

/**
 * ecu-tool 专用接口封装（新增文件，不改动 src/api/device.ts）。
 *
 * 复用 xattp-server 已有的设备命令透传能力：
 * - 共享：POST /xattp-server/ebike/device/cmd
 * - 短租：POST /xattp-server/rental/device/cmd
 * 两者都会按 IMEI 自动定位环境，并补全平台鉴权头，body 原样透传给设备平台。
 */

const BASE_PATH = '/xattp-server';

/** 共享（Ebike）设备命令透传 */
export function ecuToolCmdEbikeAPI(data: Record<string, unknown>, timeout?: number) {
  return AlovaInstance.Post(`${BASE_PATH}/ebike/device/cmd`, data, timeout ? { timeout } : undefined);
}

/** 短租（Rental）设备命令透传 */
export function ecuToolCmdRentalAPI(data: Record<string, unknown>, timeout?: number) {
  return AlovaInstance.Post(`${BASE_PATH}/rental/device/cmd`, data, timeout ? { timeout } : undefined);
}

/** 海外（Oversea）设备命令透传 */
export function ecuToolCmdOverseaAPI(data: Record<string, unknown>, timeout?: number) {
  return AlovaInstance.Post(`${BASE_PATH}/oversea/device/cmd`, data, timeout ? { timeout } : undefined);
}

/** 环境列表（共享 / 短租 / 海外） */
export function ecuToolEnvAllAPI(business: 'ebike' | 'rental' | 'oversea') {
  return AlovaInstance.Get(`${BASE_PATH}/env/${business}/all`);
}

/**
 * 指定环境直连透传（对应客户端「设备服务器配置」选择后直发）：
 * 不查询设备所在环境、不回退，直接透传到所选环境。
 */
export function ecuToolCmdDirectAPI(data: Record<string, unknown>, timeout?: number) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu-tool/cmd/direct`, data, timeout ? { timeout } : undefined);
}

/** 共享环境列表（env key + name） */
export function ecuToolEnvListAPI() {
  return AlovaInstance.Get(`${BASE_PATH}/ecu-tool/envs`);
}

/**
 * 转发到 ecu4cloud 平台（原客户端「添加白名单」「配置设备类型」使用的固定地址）：
 * 后端转发，避免前端跨域与 https→http 混合内容拦截。
 */
export function ecuToolCloudCmdAPI(data: Record<string, unknown>, timeout?: number) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu-tool/cloud/cmd`, data, timeout ? { timeout } : undefined);
}