import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server";

/** ECU 工具专用：开发环境用 mock 地址，生产环境用 mock-test */
const ECU_BASE_URL =
  import.meta.env.DEV
    ? "https://mock.xiaoantech.com/mock/7093"
    : "https://mock-test.xiaoantech.com";

export function queryEBikeAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/ebike/device/info`,{params});
}

export function switchEbikeAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/ebike/device/switch`,data);
}

export function cmdEbikeAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/ebike/device/cmd`,data);
}

/**
 * 快捷设置语音位：根据文本生成语音并下发到设备指定索引
 * @param data - imei/text/idx 必填
 */
export function setVoiceAPI(data: {
  imei: string;
  text: string;
  idx: number;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ebike/device/set-voice`, data);
}

export function queryRentalAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/rental/device/info`,{params});
}

export function switchRentalAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/rental/device/switch`,data);
}

export function getDeviceLogAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/device/log/get`,{params});
}



export function queryOverseaAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/oversea/device/info`,{params});
}

export function switchOverseaAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/oversea/device/switch`,data);
}

/**
 * ECU 模拟接口（baseURL 随环境：dev → mock.xiaoantech.com/mock/7093/ecu，prod → mock-test.xiaoantech.com/ecu）
 * @param data - { host: 切车地址host, port: 切车地址port, imei: 设备IMEI号, type: 类型 1自动挡 2手动挡 默认1 }
 */
export function ecuMockAPI(data: { host: string; port: number; imei: string; type: number }) {
    return AlovaInstance.Post(`${ECU_BASE_URL}/ecu/mock`, data);
}

/**
 * ECU 查询接口，POST，imei 放在 body（baseURL 同上）
 */
export function ecuQueryAPI(data: { imei: string }) {
    return AlovaInstance.Post(`${ECU_BASE_URL}/ecu/states`, data);
}


/**
 * ECU 状态更新接口，POST，imei 放在 body（baseURL 同上）
 */
export function ecuStateUpdateAPI(data) {
    return AlovaInstance.Post(`${ECU_BASE_URL}/ecu/update-states`, data);
}

/** 小安中控模拟：创建 mock 连接，返回含 connect_id */
export function xiaoanEcuMockCreateAPI(data: {
  env: string;
  tenant_id: string;
  imei: string;
  lng?: number;
  lat?: number;
  voltage?: number;
  version?: string;
  service_area_id?: string;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/create`, data);
}

/** 租车中控模拟：添加 mock 连接（接口 /ecu/mock/add，无租户ID/服务区） */
export function rentalEcuMockAddAPI(data: {
  env: string;
  imei: string;
  tenant_id?: string;
  lng?: number;
  lat?: number;
  voltage?: number;
  version?: string;
  service_area_id?: string;
  service_area_name?: string;
  seat_locked?: boolean;
  power_exists?: boolean;
  ecu_type?: number;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/add`, data);
}

/** 小安中控模拟：获取所有默认 mock 命令数据，需传 connect_id */
export function xiaoanEcuMockCmdAllAPI(params: { connect_id: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/ecu/mock/cmd/all`, { params });
}

/** 小安中控模拟：设置单条 mock 命令 */
export function xiaoanEcuMockCmdSetAPI(data: {
  connect_id: string;
  cmd: string;
  value: string;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/cmd/set`, data);
}

/** 小安中控模拟：断开 mock 连接 */
export function xiaoanEcuMockDeleteAPI(data: { connect_id: string }) {
  return AlovaInstance.Delete(`${BASE_PATH}/ecu/mock/delete`, data);
}

/** 小安中控模拟：更新 mock 数据，仅传需更新字段（connect_id 必传） */
export function xiaoanEcuMockUpdateAPI(data: {
  connect_id: string;
  bin68_immediately?: boolean;
  lng?: number;
  lat?: number;
  voltage?: number;
  version?: string;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/update`, data);
}

/** 小安中控模拟：模拟移动，按方位角与距离更新经纬度 */
export function xiaoanEcuMockMoveAPI(data: {
  connect_id: string;
  bearing?: number;
  distance?: number;
  bin68_immediately?: boolean;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/move`, data);
}