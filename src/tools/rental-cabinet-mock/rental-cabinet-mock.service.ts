/** 单块电池数据 */
export interface CabinetBattery {
  /** 电池 SN */
  sn: string;
  /** 电量百分比 0~100 */
  soc: number;
  /** 是否充电中 */
  charging: boolean;
  /** 电池电压(V) */
  totalVoltage: number;
  /** 充电电流(A) */
  chargeCurrent: number;
  /** 充电温度(°C) */
  chargeTemp: number;
}

/** 单个仓门 */
export interface CabinetDoor {
  /** 仓门序号（从 1 开始） */
  index: number;
  /** 仓门是否打开 */
  isOpen: boolean;
  /** 是否禁仓（该仓门禁用） */
  locked: boolean;
  /** 电池数据，null 表示空仓 */
  battery: CabinetBattery | null;
}

/**
 * 生成 15 位随机 IMEI（86868686 开头）
 * @returns 15 位数字字符串
 */
export function generateRandomImei(): string {
  let tail = "";
  for (let i = 0; i < 7; i++) {
    tail += Math.floor(Math.random() * 10);
  }
  return `86868686${tail}`;
}

/**
 * 生成随机电池 SN（BAT + 12 位数字）
 * @returns 电池 SN 字符串
 */
export function generateRandomBatterySn(): string {
  let digits = "";
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return `BAT${digits}`;
}

/**
 * 根据 SOC 估算总电压（13 节锂电池，单节 3.0~4.2V）
 * @param soc 电量百分比 0~100
 * @param cellCount 电芯节数
 * @returns 总电压(V)
 */
function estimateVoltage(soc: number, cellCount: number): number {
  const minV = 3.0;
  const maxV = 4.2;
  const cellV = minV + (maxV - minV) * (soc / 100);
  return Math.round(cellV * cellCount * 10) / 10;
}

/**
 * 生成一块随机电池数据（模拟真实充电中的电池）
 * @returns CabinetBattery
 */
export function generateRandomBattery(): CabinetBattery {
  const cellCount = 13;
  const soc = Math.round(20 + Math.random() * 80);
  const totalVoltage = estimateVoltage(soc, cellCount);
  const chargeCurrent = soc >= 95
    ? Math.round(Math.random() * 0.5 * 10) / 10
    : Math.round((0.5 + Math.random() * 2) * 10) / 10;
  const chargeTemp = Math.round((25 + Math.random() * 15) * 10) / 10;

  const charging = Math.random() > 0.3;
  return {
    sn: generateRandomBatterySn(),
    soc,
    charging,
    totalVoltage,
    chargeCurrent,
    chargeTemp,
  };
}

/**
 * 初始化电柜仓门数组：从第 1 个仓门开始依次放入电池
 * @param doorCount 仓门总数
 * @param batteryCount 初始电池数（不超过仓门数）
 * @returns CabinetDoor[]
 */
export function createCabinetDoors(doorCount: number, batteryCount: number): CabinetDoor[] {
  const count = Math.min(batteryCount, doorCount);
  const doors: CabinetDoor[] = [];
  for (let i = 0; i < doorCount; i++) {
    doors.push({
      index: i + 1,
      isOpen: false,
      locked: false,
      battery: i < count ? generateRandomBattery() : null,
    });
  }
  return doors;
}

/** 后端单仓门状态（与 Python cabinet mock 一致） */
export interface BackendDoorStatus {
  door_no: number;
  door_open: boolean;
  door_forbidden: boolean;
  has_battery: boolean;
  battery_charging?: boolean;
  charging_temperature?: number;
  charging_current?: number;
  charging_voltage?: number;
  battery_soc?: number;
  battery_sn?: string | null;
  battery_voltage?: number;
}

/**
 * 将后端 door_status 数组转为前端 CabinetDoor[]
 * @param doorStatusList 后端返回的 door_status 数组
 * @returns 前端仓门列表
 */
export function mapBackendDoorsToFrontend(
  doorStatusList: BackendDoorStatus[]
): CabinetDoor[] {
  return doorStatusList.map((d) => {
    const battery: CabinetBattery | null = d.has_battery
      ? {
          sn: d.battery_sn ?? "",
          soc: d.battery_soc ?? 0,
          charging: d.battery_charging ?? false,
          totalVoltage: d.battery_voltage ?? 0,
          chargeCurrent: d.charging_current ?? 0,
          chargeTemp: d.charging_temperature ?? 0,
        }
      : null;
    return {
      index: d.door_no,
      isOpen: d.door_open,
      locked: d.door_forbidden,
      battery,
    };
  });
}

/** 后端 door_status 可单独更新的字段名 */
export type BackendDoorStatusKey =
  | "door_open"
  | "door_forbidden"
  | "has_battery"
  | "battery_charging"
  | "charging_temperature"
  | "charging_current"
  | "battery_soc"
  | "battery_sn"
  | "battery_voltage";

/**
 * 根据前端仓门生成后端 door_status 的完整对象（供内部按字段截取用）
 */
function buildFullDoorStatus(door: CabinetDoor): Record<string, unknown> {
  const hasBattery = !!door.battery;
  const base: Record<string, unknown> = {
    door_open: door.isOpen,
    door_forbidden: door.locked,
    has_battery: hasBattery,
  };
  if (hasBattery && door.battery) {
    base.battery_charging = door.battery.charging;
    base.charging_temperature = door.battery.chargeTemp;
    base.charging_current = door.battery.chargeCurrent;
    base.battery_soc = door.battery.soc;
    base.battery_sn = door.battery.sn;
    base.battery_voltage = door.battery.totalVoltage;
  }
  return base;
}

/**
 * 将前端单个仓门转为后端 door/update 的 door_status 对象（仅包含指定字段，修改什么传什么）
 * @param door 前端仓门
 * @param fields 需要上报的字段，不传则传全部
 * @returns 后端 door_status 部分对象
 */
export function mapFrontendDoorToBackend(
  door: CabinetDoor,
  fields?: BackendDoorStatusKey[]
): Record<string, unknown> {
  const full = buildFullDoorStatus(door);
  if (!fields || fields.length === 0) {
    return full;
  }
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    if (key in full) {
      out[key] = full[key];
    }
  }
  return out;
}
