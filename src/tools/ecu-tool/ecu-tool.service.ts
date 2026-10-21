/**
 * ECU 常用查询 —— 逆向自 ECU_TOOLS.exe（BIN_Parsing.Form1 的 tP_basicPostman 标签页，共享协议）。
 *
 * 客户端原始实现（共享协议 SERVER_NODE / SAAS1 / SAAS2 / PAAS 等分支）：
 * - 快捷命令按钮 -> button_aciton_handle(Rob, cmd, param)
 * - Json_cmd_handle(cmd, param) -> GetJsonCMDString(imei, cmd, param) -> HTTP POST 到设备平台透传接口
 * - 请求体：{ "imei", "async":false, "cmd":{ "c":cmd, "param":param } }
 * - 响应经 ParseResponseJsonString 逐层剥离（data.result / result / message / payload / data）
 *
 * 本工具复用 xattp-server 的设备透传接口（/ebike/device/cmd），
 * 由后端按 IMEI 自动定位环境并补全 platform 鉴权头。
 */

/** 命令码（共享协议） */
export const CMD = {
  /** 添加白名单 */
  whitelist: 3,
  /** 查询设备类型列表 */
  deviceTypeQuery: 18,
  /** 设置设备类型 */
  deviceTypeSet: 14,
  /** 电门控制 */
  acc: 33,
  /** 设防控制 */
  defend: 4,
  /** 电池仓锁控制 */
  batteryLock: 40,
  /** 头盔锁控制 */
  helmetLock: 82,
  /** 查询语音列表 */
  voiceList: 36,
  /** 播放语音 */
  voicePlay: 14,
  /** 设备重启 */
  reboot: 21,
  /** 关机 */
  shutdown: 25,
  /** C98 拍照检查 */
  photoCheck: 98,
  /** C97 硬件配置 / 去皮值 / 车身系数 */
  hardwareConfig: 97,
  /** C109 弃用 */
  debugFlag: 109,
  /** C119 超载信息与参数设置 */
  overLoad: 119,
  /** C114 流量查询 */
  flowQuery: 114,
  /** 一键还车测试 */
  parkTest: 115,
  /** X2 仪表测试 */
  meterTest: 103,
  /** C138 测试 */
  overloadTest: 138,
  /** 限速下发 */
  speedLimit: 45,
  /** C41 查询 BMS 实时信息 */
  bmsRealtime: 41,
  /** C42 查询 BMS 固定信息 */
  bmsFixed: 42,
  /** C44 查询控制器信息 */
  controllerInfo: 44,
} as const;

/** 查询按钮（结果写入右侧 textBox5 / 6 / 7） */
export const QUERY_BUTTONS = [
  { label: 'C59生产查询', c: 59, target: 0 },
  { label: 'C34查询状态信息', c: 34, target: 1 },
  { label: 'C31查询参数', c: 31, target: 2 },
  { label: 'C32配置参数', c: 32, target: 2 },
] as const;

/** 业务类型：共享 / 短租 / 海外 */
export type Business = 'ebike' | 'rental' | 'oversea';

export interface SendOptions {
  business: Business;
  imei: string;
  c: number;
  param?: unknown;
  /** 指定环境（缺省由后端按 IMEI 自动查找） */
  envName?: string;
  /** 设备协议，默认 xiaoan_ebike */
  deviceProtocol?: string;
  /** 短租设备类型：2=新智能中控，其他=共享中控（用于选择网关） */
  type?: number;
}

/**
 * 构造透传给设备平台的请求体：
 * - 共享/海外：{ imei, async:false, cmd:{ c, param } }（客户端 GetJsonCMDString 主分支）
 * - 短租：{ imei, waitResponse:'true', params:{ c, param } }（客户端租车分支）
 */
export function buildCmdBody(options: SendOptions): Record<string, unknown> {
  const { business, imei, c, param, envName, deviceProtocol, type } = options;
  const body: Record<string, unknown> = { imei };
  if (envName) {
    body.envName = envName;
  }
  if (business === 'rental') {
    body.waitResponse = 'true';
    body.params = { c, param: param ?? {} };
    body.type = type ?? 2; // 供后端选择网关，透传前会被剔除
  } else {
    body.async = false;
    body.deviceProtocol = deviceProtocol ?? 'xiaoan_ebike';
    body.cmd = { c, param: param ?? {} };
  }
  return body;
}

export interface DeviceResult {
  /** 业务是否成功（code === 0） */
  ok: boolean;
  code: number;
  msg: string;
  /** 剥离外壳后的结果数据 */
  data: unknown;
  /** 后端原始返回 */
  raw: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** 客户端错误码文案（button45_Click / button46_Click 中的映射） */
const DEVICE_ERROR_TEXT: Record<string, string> = {
  0: '成功',
  108: '设备离线',
  109: '设备离线',
  114: '参数不合法',
  115: '参数缺失',
  135: '操作超时',
  136: '识别失败',
};

export function describeCode(code: number): string {
  return DEVICE_ERROR_TEXT[String(code)] ?? '未知错误';
}

/**
 * 复刻客户端 ParseResponseJsonString：最多剥离 8 层，
 * 依次尝试 data.result -> result -> message -> payload -> data。
 */
function peel(value: unknown, state: { code: number | null; msg: string | null }, depth = 0): unknown {
  if (depth > 8) {
    return value;
  }
  let current = value;
  if (typeof current === 'string') {
    try {
      current = JSON.parse(current);
    } catch {
      return current;
    }
  }
  if (!isPlainObject(current)) {
    return current;
  }

  if (state.code == null && current.code != null && !Number.isNaN(Number(current.code))) {
    state.code = Number(current.code);
  }
  if (state.msg == null && current.msg != null) {
    state.msg = String(current.msg);
  }
  if (current.success === false && state.code == null) {
    state.code = -1;
  }

  const next = (isPlainObject(current.data) ? current.data.result : undefined)
    ?? current.result
    ?? current.message
    ?? current.payload
    ?? current.data;

  if (next != null && next !== current) {
    return peel(next, state, depth + 1);
  }
  return current;
}

/** 解析设备平台 / xattp-server 的返回，得到统一结果 */
export function parseDeviceResponse(payload: unknown): DeviceResult {
  const state: { code: number | null; msg: string | null } = { code: null, msg: null };
  const data = peel(payload, state);
  const code = state.code ?? 0;
  const ok = code === 0 && !(isPlainObject(data) && data.success === false);
  const msg = state.msg ?? (ok ? '' : describeCode(code));
  return { ok, code, msg, data, raw: payload };
}

/** 结果格式化：JSON 缩进 2 空格，尽量紧凑展示 */
export function stringifyResult(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** 超时下拉：默认索引 3（与客户端 Form1_Load 的 comboBox10.SelectedIndex = 3 一致） */
export const TIMEOUT_OPTIONS = [
  { label: '不设超时', value: 30000 },
  { label: '2秒超时', value: 2000 },
  { label: '5秒超时', value: 5000 },
  { label: '10秒超时', value: 10000 },
] as const;

/** 语音位 0-37（对应客户端 button57 - button141） */
export const VOICE_IDX_LIST = Array.from({ length: 38 }, (_, i) => i);

/** IMEI 历史记录本地存储键（客户端对应 config.txt） */
export const IMEI_STORAGE_KEY = 'ecu-tool:imei-history';

/** IMEI → 环境 的本地缓存键：首次自动查找命中后记录，下次直接透传该环境（不再遍历查询） */
export const IMEI_ENV_STORAGE_KEY = 'ecu-tool:imei-env';

function readEnvMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(IMEI_ENV_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

/** 读取某 IMEI 上次命中的环境 */
export function getCachedEnv(imei: string): string | null {
  return readEnvMap()[imei] ?? null;
}

/** 记录某 IMEI 命中的环境 */
export function setCachedEnv(imei: string, env: string): void {
  const map = readEnvMap();
  map[imei] = env;
  try {
    localStorage.setItem(IMEI_ENV_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

/** 清除某 IMEI 的环境缓存（设备切走或直连失败时） */
export function clearCachedEnv(imei: string): void {
  const map = readEnvMap();
  if (map[imei]) {
    delete map[imei];
    try {
      localStorage.setItem(IMEI_ENV_STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }
}