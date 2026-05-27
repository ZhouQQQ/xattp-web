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

/** 环境配置：获取共享环境列表 */
export function getEbikeEnvListAPI() {
  return AlovaInstance.Get(`${BASE_PATH}/env/ebike/all`);
}

/** 环境配置：获取短租环境列表 */
export function getRentalEnvListAPI() {
  return AlovaInstance.Get(`${BASE_PATH}/env/rental/all`);
}

/** 环境配置：获取海外环境列表 */
export function getOverseaEnvListAPI() {
  return AlovaInstance.Get(`${BASE_PATH}/env/oversea/all`);
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

/** 小安中控批量模拟：按 mode 批量创建并启动 mock */
export function xiaoanEcuMockBatchCreateAPI(data: {
  env: string;
  tenant_id?: string;
  business_type?: 1 | 2 | 3;
  server?: string;
  voltage_min?: number;
  voltage_max?: number;
  lat?: number;
  lng?: number;
  radius_m?: number;
  coord_mode?: "scatter" | "fixed";
  coordinates?: Array<{ lat: number; lng: number }>;
  create_mode?: 1 | 2;
  serial_interval_ms?: number;
  reply_delay_sec?: number;
  mode: 1 | 2 | 3;
  num?: number;
  start_imei?: string;
  imeis?: string[];
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/batch_add`, data);
}

/** 小安中控批量模拟：批量删除 mock（与 batch_add 对应，mode 1/2/3） */
export function xiaoanEcuMockBatchDeleteAPI(data: {
  mode: 1 | 2 | 3;
  server: string;
  num?: number;
  start_imei?: string;
  imei?: string;
  imeis?: string[];
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/batch_delete`, data);
}

/** 小安中控批量模拟：获取当前用户批量创建记录 */
export function xiaoanEcuMockBatchRecordAPI(params?: { source?: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/ecu/mock/list`, {
    params: { _ts: Date.now(), ...params },
  });
}

/** 小安中控批量工具：批量绑定并上架 */
export function xiaoanEcuBatchBindAndOnlineAPI(data: {
  env: string;
  tenant_id: string;
  service_area_id: string;
  imeis: string[];
}) {
  return AlovaInstance.Post(`${BASE_PATH}/business_tool/batch_bind_and_online`, data);
}

/** 小安中控批量工具：按租户和环境查询服务区 */
export function xiaoanEcuServiceAreaAllAPI(params: { tenant_id: string; env: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/business_tool/service_area/all`, { params });
}

/** 短租批量工具：获取环境下租户列表 */
export function rentalBusinessTenantAllAPI(params: { env: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/rental_business_tool/tenant/all`, { params });
}

/** 短租批量工具：获取加盟商列表 */
export function rentalBusinessFranchiseeAllAPI(params: { env: string; tenant_id?: string; tenant_name?: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/rental_business_tool/franchisee/all`, { params });
}

/** 短租批量工具：获取车型列表 */
export function rentalBusinessVehicleModelAllAPI(params: {
  env: string;
  tenant_id?: string;
  tenant_name?: string;
  custom_id?: string;
}) {
  return AlovaInstance.Get(`${BASE_PATH}/rental_business_tool/vehicle_model/all`, { params });
}

/** 短租批量工具：批量入库车辆 */
export function rentalBusinessBatchAddEbikeAPI(data: {
  env: string;
  tenant_id?: string;
  tenant_name?: string;
  custom_id: string;
  vehicle_model_id: string;
  shop_id: string;
  imeis: string[];
}) {
  return AlovaInstance.Post(`${BASE_PATH}/rental_business_tool/ebike/batch_add`, data);
}

/** 短租工具：单车入库 */
export function rentalBusinessAddEbikeAPI(data: {
  env: string;
  imei: string;
  tenant_id?: string;
  tenant_name?: string;
  custom_id: string;
  vehicle_model_id: string;
  shop_id: string;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/rental_business_tool/ebike/add`, data);
}

/** 短租工具：根据美团店铺 ID 查询店铺名称与 access_token */
export function rentalBusinessGetMeituanTokenAPI(params: { meituan_shop_id: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/rental_business_tool/get_meituan_token`, { params });
}

/** 租车中控模拟：添加 mock 连接（接口 /ecu/mock/add，无租户ID/服务区） */
export function rentalEcuMockAddAPI(data: {
  env: string;
  imei: string;
  business_type?: 1 | 2 | 3;
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

/**
 * 小安中控模拟：获取当前用户已有 mock 连接列表
 * @returns mock 请求实例
 */
export function xiaoanEcuMockListAPI() {
  return AlovaInstance.Get(`${BASE_PATH}/ecu/mock/list`);
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

/** 小安中控模拟：设置模拟运动轨迹，后端按 GPS 上报频率逐点推进 */
export function xiaoanEcuMockTrajectoryAPI(data: {
  connect_id: string;
  points: Array<{ lng: number; lat: number }>;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/trajectory`, data);
}

/** 小安中控模拟：上报 Bin5 告警（CMD: 5） */
export function xiaoanEcuMockBin5API(data: {
  connect_id: string;
  alarm_type: number;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/ecu/mock/bin/5`, data);
}

// ---------- 电柜模拟 (cabinet mock) ----------

/** 电柜模拟：创建 mock 连接，返回 connect_id 及连接信息；powermode 1=市电 2=电池 */
export function cabinetMockCreateAPI(data: {
  env: string;
  imei: string;
  door_num: number;
  battery_num: number;
  powermode?: number;
  power_consumption?: number;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/cabinet/mock/create`, data);
}

/** 电柜模拟：根据 connect_id 获取连接信息 */
export function cabinetMockGetAPI(params: { connect_id: string }) {
  return AlovaInstance.Get(`${BASE_PATH}/cabinet/mock/get`, { params });
}

/** 电柜模拟：更新 mock 数据（如 powermode 等），仅传需更新字段 */
export function cabinetMockUpdateAPI(data: { connect_id: string; [key: string]: unknown }) {
  return AlovaInstance.Post(`${BASE_PATH}/cabinet/mock/update`, data);
}

/** 电柜模拟：更新单个仓门状态（door_no 放在 door_status 内） */
export function cabinetMockDoorUpdateAPI(data: {
  connect_id: string;
  door_status: Record<string, unknown>;
}) {
  return AlovaInstance.Post(`${BASE_PATH}/cabinet/mock/door/update`, data);
}

/** 电柜模拟：删除 mock 连接（connect_id 放在 body） */
export function cabinetMockDeleteAPI(data: { connect_id: string }) {
  return AlovaInstance.Delete(`${BASE_PATH}/cabinet/mock/delete`, data);
}