<template>
  <div class="rental-cabinet-mock">
    <n-card>
      <!-- 表单区 -->
      <div class="form-section">
        <n-form :model="formData" label-placement="left" label-width="100px">
          <n-grid :cols="12" :x-gap="8" :y-gap="2">
            <!-- 第一行：环境、电柜类型 -->
            <n-gi :span="5">
              <n-form-item label="环境" path="env" required>
                <n-radio-group v-model:value="formData.env" :disabled="simulating" name="env" size="small">
                  <n-space :size="5">
                    <n-radio v-for="opt in envOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>
            </n-gi>
            <n-gi :span="7">
              <n-form-item label="电柜类型" path="cabinetType">
                <n-radio-group v-model:value="formData.cabinetType" :disabled="simulating" name="cabinetType"
                  size="small">
                  <n-space :size="4">
                    <n-radio v-for="opt in cabinetTypeOptions" :key="opt.value" :value="opt.value"
                      :disabled="opt.disabled">
                      {{ opt.label }}
                    </n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>
            </n-gi>
            <!-- 第二行：IMEI、仓门数、初始电池 -->
            <n-gi :span="5">
              <n-form-item label="IMEI" path="imei" required>
                <div class="imei-row">
                  <n-input v-model:value="formData.imei" placeholder="15 位数字" clearable size="small"
                    :readonly="simulating" :class="{ 'input-readonly-gray': simulating }" :maxlength="15" />
                  <n-button type="default" size="small" :disabled="simulating" @click="randomImei">
                    <template #icon>
                      <n-icon :component="Dice" :size="18" />
                    </template>
                    随机
                  </n-button>
                </div>
              </n-form-item>
            </n-gi>
            <n-gi :span="3">
              <n-form-item label="仓门数" path="doorCount">
                <n-input-number v-model:value="formData.doorCount" :min="1" :max="16" :step="2" size="small"
                  :disabled="simulating" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <n-gi :span="3">
              <n-form-item label="初始电池" path="batteryCount">
                <n-input-number v-model:value="formData.batteryCount" :min="0" :max="formData.doorCount" :step="1"
                  size="small" :disabled="simulating" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <!-- 第三行：供电模式、耗电量 -->
            <n-gi :span="4">
              <n-form-item label="供电模式" path="powerMode">
                <n-radio-group v-model:value="formData.powerMode" name="powerMode" size="small">
                  <n-space :size="4">
                    <n-radio v-for="opt in powerModeOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>
            </n-gi>
            <n-gi :span="4">
              <n-form-item label="耗电量(kw·h)" path="power_consumption">
                <n-input-number v-model:value="formData.power_consumption" :min="0" :step="0.1" size="small"
                  style="width: 100%" />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-form>
        <div class="form-buttons">
          <n-space :size="8">
            <n-button v-if="!simulating" type="primary" @click="startSimulation">
              开始模拟
            </n-button>
            <template v-else>
              <n-button type="error" @click="stopSimulation">
                <template #icon>
                  <n-icon :component="Trash" :size="18" />
                </template>
                停止模拟
              </n-button>
              <n-button v-show="false" type="default" @click="closeAllDoors">
                仓门全关
              </n-button>
              <n-button v-show="false" type="default" @click="openAllDoors">
                仓门全开
              </n-button>
              <n-button type="default" @click="updateData">
                更新数据
              </n-button>
              <n-button type="default" @click="copyAllBatterySn">
                复制电池SN
              </n-button>
            </template>
          </n-space>
        </div>
      </div>

      <!-- 电柜可视化 -->
      <div v-if="simulating" class="cabinet-frame">
        <div class="cabinet-header">
          <div class="cabinet-led" />
          <span class="cabinet-title">模拟电柜</span>
          <span class="cabinet-imei">{{ formData.imei }}</span>
          <span class="cabinet-env">{{ formData.env }}</span>
          <div class="cabinet-refresh">
            <span class="cabinet-refresh-label">刷新间隔</span>
            <n-select v-model:value="pollIntervalSeconds" :options="pollIntervalOptions" size="tiny" style="width: 82px"
              @update:value="restartPollByInterval" />
          </div>
        </div>
        <div class="cabinet-grid">
          <div v-for="door in doors" :key="door.index" class="door-card"
            :class="{ 'door-open': door.isOpen, 'door-has-battery': !!door.battery, 'door-locked': door.locked }">
            <!-- 仓门头部 -->
            <div class="door-header">
              <span class="door-badge">{{ door.index }}</span>
              <div class="door-header-right">
                <n-switch v-model:value="door.locked" size="small" class="door-locked-switch" disabled>
                  <template #checked>禁仓</template>
                  <template #unchecked>正常</template>
                </n-switch>
                <div class="door-lock"
                  :class="[door.isOpen ? 'lock-open' : 'lock-closed']"
                  @click="toggleDoor(door)">
                  <span class="lock-icon">{{ door.isOpen ? '🔓' : '🔒' }}</span>
                  <span class="lock-text">{{ door.isOpen ? '已开门' : '已关门' }}</span>
                </div>
              </div>
            </div>

            <!-- 有电池 -->
            <div v-if="door.battery" class="door-battery">
              <div class="battery-sn-row">
                <span class="field-label">电池SN</span>
                <n-input v-model:value="door.battery.sn" size="tiny" placeholder="SN"
                  @blur="syncDoorToBackend(door, ['battery_sn'])" />
              </div>
              <!-- SOC 可拖动进度条 -->
              <div class="battery-soc-row">
                <span class="field-label">电池SOC</span>
                <n-slider v-model:value="door.battery.soc" :min="0" :max="100" :step="1" :tooltip="false"
                  class="soc-slider" @update:value="() => syncDoorToBackend(door, ['battery_soc'])" />
                <n-input-number v-model:value="door.battery.soc" :min="0" :max="100" :show-button="false" size="tiny"
                  class="soc-input" />
                <span class="soc-unit">%</span>
              </div>
              <!-- 是否充电中 -->
              <div class="battery-charging-row">
                <span class="field-label">是否充电</span>
                <n-switch v-model:value="door.battery.charging" size="small"
                  @update:value="() => syncDoorToBackend(door, ['battery_charging'])">
                  <template #checked>充电中</template>
                  <template #unchecked>未充电</template>
                </n-switch>
              </div>
              <!-- 参数：每行一个，顺序 充电温度、充电电流、电池电压 -->
              <div class="battery-params">
                <div class="param-item">
                  <span class="param-label">充电温度</span>
                  <n-input-number v-model:value="door.battery.chargeTemp" :min="-20" :max="80" :step="0.1"
                    :show-button="false" size="tiny" class="param-input"
                    @update:value="() => syncDoorToBackend(door, ['charging_temperature'])" />
                  <span class="param-unit">°C</span>
                </div>
                <div class="param-item">
                  <span class="param-label">充电电流</span>
                  <n-input-number v-model:value="door.battery.chargeCurrent" :min="0" :step="0.1" :show-button="false"
                    size="tiny" class="param-input"
                    @update:value="() => syncDoorToBackend(door, ['charging_current'])" />
                  <span class="param-unit">A</span>
                </div>
                <div class="param-item">
                  <span class="param-label">电池电压</span>
                  <n-input-number v-model:value="door.battery.totalVoltage" :min="0" :step="0.1" :show-button="false"
                    size="tiny" class="param-input"
                    @update:value="() => syncDoorToBackend(door, ['battery_voltage'])" />
                  <span class="param-unit">V</span>
                </div>
              </div>
              <!-- 取出电池：居中底部，按钮样式，禁用时悬浮提示 -->
              <div class="door-battery-footer">
                <n-tooltip :disabled="door.isOpen" trigger="hover">
                  <template #trigger>
                    <span class="remove-battery-wrap">
                      <n-button size="tiny" type="error" class="remove-battery-btn" :disabled="!door.isOpen"
                        @click="removeBattery(door)">
                        取出电池
                      </n-button>
                    </span>
                  </template>
                  开启仓门才可取出电池
                </n-tooltip>
              </div>
            </div>

            <!-- 无电池 -->
            <div v-else class="door-empty">
              <div class="empty-slot-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                  <rect x="4" y="6" width="16" height="14" rx="2" />
                  <rect x="8" y="3" width="8" height="3" rx="1" />
                </svg>
              </div>
              <n-button size="tiny" type="primary" quaternary :disabled="!door.isOpen" @click="insertBattery(door)">
                放入电池
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 放入电池弹窗 -->
      <n-modal v-model:show="showInsertBatteryModal" preset="dialog" title="放入电池" positive-text="确认放入"
        negative-text="取消" @positive-click="confirmInsertBattery">
        <n-form :model="insertBatteryForm" label-placement="left" label-width="80px">
          <n-form-item label="电池SN" path="sn" required>
            <n-input v-model:value="insertBatteryForm.sn" placeholder="如 BAT123456789012" />
          </n-form-item>
          <n-form-item label="电池SOC" path="soc" required>
            <n-input-number v-model:value="insertBatteryForm.soc" :min="0" :max="100" :step="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="电池电压" path="totalVoltage" required>
            <n-input-number v-model:value="insertBatteryForm.totalVoltage" :min="0" :step="0.1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="充电电流" path="chargeCurrent">
            <n-input-number v-model:value="insertBatteryForm.chargeCurrent" :min="0" :step="0.1" style="width: 100%"
              placeholder="A" />
          </n-form-item>
          <n-form-item label="是否充电" path="charging">
            <n-switch v-model:value="insertBatteryForm.charging">
              <template #checked>是</template>
              <template #unchecked>否</template>
            </n-switch>
          </n-form-item>
        </n-form>
      </n-modal>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "RentalCabinetMock" });

import { ref, reactive } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Dice, Trash } from "@vicons/tabler";
import {
  generateRandomImei,
  generateRandomBattery,
  mapBackendDoorsToFrontend,
  mapFrontendDoorToBackend,
} from "./rental-cabinet-mock.service";
import type { CabinetDoor, CabinetBattery, BackendDoorStatusKey } from "./rental-cabinet-mock.service";
import {
  cabinetMockCreateAPI,
  cabinetMockGetAPI,
  cabinetMockUpdateAPI,
  cabinetMockDoorUpdateAPI,
  cabinetMockDeleteAPI,
} from "@/api/device";

const { message } = createDiscreteApi(["message"]);

const envOptions = [
  { label: "test", value: "test" },
  { label: "dev", value: "dev" },
  { label: "uat", value: "uat" },
  { label: "prod", value: "prod" },
];

const cabinetTypeOptions = [
  { label: "小安智能电柜", value: 1, disabled: false },
  { label: "西六楼电柜", value: 2, disabled: true },
  { label: "云酷电柜", value: 3, disabled: true },
];

const powerModeOptions = [
  { label: "市电供电", value: 1 },
  { label: "电池供电", value: 2 },
];

const CABINET_MOCK_FORM_STORAGE_KEY = "XATTP_RENTAL_CABINET_MOCK_FORM";

function loadCabinetMockFormFromStorage(): Partial<{
  env: string;
  imei: string;
  cabinetType: number;
  powerMode: number;
  power_consumption: number;
  doorCount: number;
  batteryCount: number;
}> {
  try {
    const raw = localStorage.getItem(CABINET_MOCK_FORM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const env = typeof parsed.env === "string" ? parsed.env : undefined;
    const imei = typeof parsed.imei === "string" ? parsed.imei : undefined;
    const cabinetType =
      typeof parsed.cabinetType === "number" ? parsed.cabinetType : undefined;
    const powerMode =
      typeof parsed.powerMode === "number" ? parsed.powerMode : undefined;
    const doorCount =
      typeof parsed.doorCount === "number" &&
        parsed.doorCount >= 1 &&
        parsed.doorCount <= 16
        ? parsed.doorCount
        : undefined;
    const batteryCount =
      typeof parsed.batteryCount === "number" &&
        parsed.batteryCount >= 0
        ? parsed.batteryCount
        : undefined;
    const power_consumption =
      typeof parsed.power_consumption === "number" && parsed.power_consumption >= 0
        ? parsed.power_consumption
        : undefined;
    return {
      ...(env != null && { env }),
      ...(imei != null && { imei }),
      ...(cabinetType != null && { cabinetType }),
      ...(powerMode != null && { powerMode }),
      ...(power_consumption != null && { power_consumption }),
      ...(doorCount != null && { doorCount }),
      ...(batteryCount != null && { batteryCount }),
    };
  } catch {
    return {};
  }
}

function saveCabinetMockFormToStorage() {
  try {
    localStorage.setItem(
      CABINET_MOCK_FORM_STORAGE_KEY,
      JSON.stringify({
        env: formData.env,
        imei: formData.imei,
        cabinetType: formData.cabinetType,
        powerMode: formData.powerMode,
        power_consumption: formData.power_consumption,
        doorCount: formData.doorCount,
        batteryCount: formData.batteryCount,
      })
    );
  } catch (e) {
    console.warn("电柜模拟表单持久化失败", e);
  }
}

const formData = reactive({
  env: "test",
  imei: generateRandomImei(),
  cabinetType: 1,
  powerMode: 1,
  power_consumption: 0,
  doorCount: 4,
  batteryCount: 2,
  ...loadCabinetMockFormFromStorage(),
});

// 初始化时保证 batteryCount 不超过 doorCount
if (formData.batteryCount > formData.doorCount) {
  formData.batteryCount = formData.doorCount;
}

const simulating = ref(false);
const doors = ref<CabinetDoor[]>([]);
/** 后端连接 ID，创建成功后用于轮询与更新 */
const connectId = ref<string>("");
/** 轮询间隔（秒），可选 3 / 5 / 10，默认 5 */
const pollIntervalSeconds = ref(5);
const pollIntervalOptions = [
  { label: "1秒", value: 1 },
  { label: "3秒", value: 3 },
  { label: "5秒", value: 5 },
  { label: "10秒", value: 10 },
];
/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** 按当前间隔重启轮询（仅在模拟中时生效） */
function restartPollByInterval() {
  if (!connectId.value || !pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = setInterval(
    fetchAndApplyConn,
    pollIntervalSeconds.value * 1000
  );
}

/**
 * 延迟下一轮 GET：有电柜操作后重置轮询周期，避免刚改的数据被下一次轮询覆盖
 */
function delayNextPoll() {
  if (!connectId.value) return;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  pollTimer = setInterval(
    fetchAndApplyConn,
    pollIntervalSeconds.value * 1000
  );
}

/** 仓门同步防抖：按仓门序号，1s 内多次修改合并为一次请求 */
const doorDebounceMap = new Map<
  number,
  { timer: ReturnType<typeof setTimeout>; pendingFields: Set<BackendDoorStatusKey> }
>();
const DOOR_SYNC_DEBOUNCE_MS = 1000;

/** 上次取出的电池，放入时作为默认值 */
const lastRemovedBattery = ref<CabinetBattery | null>(null);

/** 放入电池弹窗 */
const showInsertBatteryModal = ref(false);
const insertTargetDoor = ref<CabinetDoor | null>(null);
const insertBatteryForm = reactive({
  sn: "",
  soc: 80,
  totalVoltage: 50,
  chargeCurrent: 1.2,
  charging: true,
});

/** 生成随机 IMEI */
function randomImei() {
  formData.imei = generateRandomImei();
}

/**
 * 根据 SOC 返回进度条颜色
 * @param soc 电量百分比
 * @returns CSS 颜色值
 */
function socColor(soc: number): string {
  if (soc >= 80) return "#22c55e";
  if (soc >= 30) return "#f59e0b";
  return "#ef4444";
}

/** 轮询：拉取连接信息并更新本地 doors */
async function fetchAndApplyConn() {
  if (!connectId.value) return;
  try {
    const res = await cabinetMockGetAPI({ connect_id: connectId.value });
    // 后端使用 common_resp 包装，code !== 0 说明连接已失效或出错，此时停止轮询
    if ((res as { code?: number })?.code !== 0) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      connectId.value = "";
      simulating.value = false;
      doors.value = [];
      return;
    }
    const data = (res as {
      data?: { door_status?: unknown[]; powermode?: number; power_consumption?: number };
    })?.data;
    if (data?.door_status && Array.isArray(data.door_status)) {
      doors.value = mapBackendDoorsToFrontend(data.door_status);
    }
    if (data?.powermode != null) {
      formData.powerMode = Number(data.powermode);
    }
    if (data?.power_consumption != null) {
      formData.power_consumption = Number(data.power_consumption);
    }
  } catch (e) {
    console.error("电柜模拟轮询失败", e);
    // 遇到网络/异常错误也停止轮询，避免不停打无效请求
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    connectId.value = "";
    simulating.value = false;
    doors.value = [];
  }
}

/** 开始模拟：调用创建接口并启动每秒轮询 */
async function startSimulation() {
  if (!formData.env) {
    message.error("请选择环境");
    return;
  }
  if (!formData.imei?.trim()) {
    message.error("请填写 IMEI");
    return;
  }
  try {
    const res = await cabinetMockCreateAPI({
      env: formData.env,
      imei: formData.imei.trim(),
      door_num: formData.doorCount,
      battery_num: formData.batteryCount,
      powermode: formData.powerMode,
      power_consumption: formData.power_consumption ?? 0,
    });
    if ((res as { code?: number })?.code !== 0) {
      message.error("创建连接失败：接口未返回成功");
      return;
    }
    const data = (res as {
      data?: {
        connect_id?: string;
        door_status?: unknown[];
        powermode?: number;
        power_consumption?: number;
      };
    })?.data;
    const cid = data?.connect_id;
    if (!cid) {
      message.error("创建连接失败：未返回 connect_id");
      return;
    }
    connectId.value = cid;
    if (data?.door_status && Array.isArray(data.door_status)) {
      doors.value = mapBackendDoorsToFrontend(data.door_status);
    } else {
      doors.value = [];
    }
    if (data?.powermode != null) {
      formData.powerMode = Number(data.powermode);
    }
    if (data?.power_consumption != null) {
      formData.power_consumption = Number(data.power_consumption);
    }
    simulating.value = true;
    message.success("电柜模拟已启动");
    saveCabinetMockFormToStorage();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(
      fetchAndApplyConn,
      pollIntervalSeconds.value * 1000
    );
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : "创建连接失败";
    message.error(errMsg);
  }
}

/** 停止模拟：先停轮询并清空 connectId（避免再调获取连接接口），再调删除并清空本地状态 */
async function stopSimulation() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  doorDebounceMap.forEach(({ timer }) => clearTimeout(timer));
  doorDebounceMap.clear();
  const cid = connectId.value;
  connectId.value = "";
  simulating.value = false;
  doors.value = [];
  if (cid) {
    try {
      await cabinetMockDeleteAPI({ connect_id: cid });
    } catch (e) {
      console.error("删除电柜连接失败", e);
    }
  }
}

/** 复制当前所有仓位的电池 SN，一行一个，写入剪贴板 */
async function copyAllBatterySn() {
  if (!doors.value.length) {
    message.warning("当前没有任何仓门数据");
    return;
  }
  const lines: string[] = [];
  doors.value.forEach((door) => {
    const sn = door.battery?.sn?.trim();
    if (sn) {
      lines.push(sn);
    }
  });
  if (!lines.length) {
    message.warning("当前没有任何电池SN可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    message.success("电池SN已复制到剪贴板");
  } catch (e) {
    console.error("复制电池SN失败", e);
    message.error("复制失败，请检查浏览器权限");
  }
}

/** 更新数据：将当前表单参数（如供电模式）同步到后端 */
async function updateData() {
  if (!connectId.value) {
    message.warning("未在模拟中");
    return;
  }
  try {
    await cabinetMockUpdateAPI({
      connect_id: connectId.value,
      powermode: formData.powerMode,
      power_consumption: formData.power_consumption ?? 0,
    });
    message.success("数据已更新");
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : "更新失败";
    message.error(errMsg);
  }
}

/**
 * 单个仓门开关点击切换：开/关状态取反并同步到后端
 * @param door 当前仓门
 */
function toggleDoor(door: CabinetDoor) {
  door.isOpen = !door.isOpen;
  syncDoorToBackend(door, ["door_open"]);
}

/**
 * 仓门全关：本地全部设为关闭，依次调用 update 接口传递每个仓门 door_open: false
 */
async function closeAllDoors() {
  if (!connectId.value) return;
  doorDebounceMap.forEach(({ timer }) => clearTimeout(timer));
  doorDebounceMap.clear();
  for (const door of doors.value) {
    door.isOpen = false;
    await submitDoorToBackend(door, ["door_open"]);
  }
}

/**
 * 仓门全开：本地全部设为开启，依次调用 update 接口传递每个仓门 door_open: true
 */
async function openAllDoors() {
  if (!connectId.value) return;
  doorDebounceMap.forEach(({ timer }) => clearTimeout(timer));
  doorDebounceMap.clear();
  for (const door of doors.value) {
    door.isOpen = true;
    await submitDoorToBackend(door, ["door_open"]);
  }
}

/**
 * 实际提交单个仓门状态到后端（内部使用）
 * @param door 当前仓门
 * @param fields 需要更新的字段
 */
async function submitDoorToBackend(door: CabinetDoor, fields: BackendDoorStatusKey[]) {
  if (!connectId.value) return;
  const doorStatus = mapFrontendDoorToBackend(door, fields);
  if (Object.keys(doorStatus).length === 0) return;
  try {
    await cabinetMockDoorUpdateAPI({
      connect_id: connectId.value,
      door_status: { door_no: door.index, ...doorStatus },
    });
    // 有电柜操作后延迟下一轮 GET，避免刚改的数据被轮询覆盖
    delayNextPoll();
  } catch (e) {
    console.error("同步仓门状态失败", e);
  }
}

/**
 * 将单个仓门状态同步到后端（带 1s 防抖，同一仓门多次修改合并为一次请求）
 * @param door 当前仓门
 * @param fields 需要更新的字段，不传则传全部
 */
function syncDoorToBackend(door: CabinetDoor, fields?: BackendDoorStatusKey[]) {
  if (!connectId.value) return;
  const key = door.index;
  const existing = doorDebounceMap.get(key);
  if (existing) clearTimeout(existing.timer);
  const pendingFields = existing?.pendingFields ?? new Set<BackendDoorStatusKey>();
  if (fields?.length) {
    fields.forEach((f) => pendingFields.add(f));
  }
  const timer = setTimeout(() => {
    const d = doors.value.find((x) => x.index === key);
    if (d) {
      submitDoorToBackend(d, Array.from(pendingFields));
    }
    doorDebounceMap.delete(key);
  }, DOOR_SYNC_DEBOUNCE_MS);
  doorDebounceMap.set(key, { timer, pendingFields });
}

/**
 * 打开放入电池弹窗（仓门必须打开），默认值取上次取出的电池（如有）
 * @param door 仓门对象
 */
function insertBattery(door: CabinetDoor) {
  if (!door.isOpen) {
    message.warning("请先打开仓门");
    return;
  }
  insertTargetDoor.value = door;
  if (lastRemovedBattery.value) {
    insertBatteryForm.sn = lastRemovedBattery.value.sn;
    insertBatteryForm.soc = lastRemovedBattery.value.soc;
    insertBatteryForm.totalVoltage = lastRemovedBattery.value.totalVoltage;
    insertBatteryForm.chargeCurrent = lastRemovedBattery.value.chargeCurrent;
    insertBatteryForm.charging = lastRemovedBattery.value.charging;
  } else {
    const defaultBattery = generateRandomBattery();
    insertBatteryForm.sn = defaultBattery.sn;
    insertBatteryForm.soc = defaultBattery.soc;
    insertBatteryForm.totalVoltage = defaultBattery.totalVoltage;
    insertBatteryForm.chargeCurrent = defaultBattery.chargeCurrent;
    insertBatteryForm.charging = true;
  }
  showInsertBatteryModal.value = true;
}

/**
 * 确认放入电池：根据表单生成电池数据并放入目标仓门
 */
function confirmInsertBattery(): boolean {
  const sn = insertBatteryForm.sn?.trim();
  if (!sn) {
    message.error("请输入电池SN");
    return false;
  }
  const soc = insertBatteryForm.soc;
  if (soc == null || soc < 0 || soc > 100) {
    message.error("SOC 需在 0～100 之间");
    return false;
  }
  const totalVoltage = insertBatteryForm.totalVoltage;
  if (totalVoltage == null || totalVoltage < 0) {
    message.error("请输入有效的电池电压");
    return false;
  }
  const door = insertTargetDoor.value;
  if (!door) return false;
  const last = lastRemovedBattery.value;
  const chargeCurrent =
    insertBatteryForm.chargeCurrent != null && insertBatteryForm.chargeCurrent >= 0
      ? insertBatteryForm.chargeCurrent
      : last?.chargeCurrent ?? 1.2;
  const newBattery: CabinetBattery = {
    sn,
    soc: Math.round(soc),
    totalVoltage,
    charging: insertBatteryForm.charging,
    chargeCurrent,
    chargeTemp: last?.chargeTemp ?? 32,
  };
  // 通过替换数组中对应项触发视图立即刷新，不依赖下一次 GET
  const index = doors.value.findIndex((d) => d.index === door.index);
  if (index >= 0) {
    doors.value = doors.value.map((d, i) =>
      i === index ? { ...d, battery: newBattery } : d
    );
  } else {
    door.battery = newBattery;
  }
  showInsertBatteryModal.value = false;
  insertTargetDoor.value = null;
  const targetDoor = index >= 0 ? doors.value[index] : door;
  // 放入电池直接走 door/update 接口，参数 door_no 在 door_status 内，只传需要的字段
  submitDoorToBackend(targetDoor, [
    "has_battery",
    "battery_sn",
    "battery_soc",
    "battery_voltage",
    "charging_current",
    "charging_temperature",
    "battery_charging",
  ]);
  return true;
}

/**
 * 从仓门中取出电池，并记录为「上次取出的电池」供放入时默认使用（仓门必须打开）
 * 取出后立即向后端同步 has_battery: false，确保一定会传
 * @param door 仓门对象
 */
function removeBattery(door: CabinetDoor) {
  if (!door.isOpen) {
    message.warning("请先打开仓门");
    return;
  }
  if (door.battery) {
    lastRemovedBattery.value = { ...door.battery };
  }
  door.battery = null;
  // 取消该仓门未发出的防抖，立即上报 has_battery: false，确保取出电池时一定会传
  const key = door.index;
  const existing = doorDebounceMap.get(key);
  if (existing) {
    clearTimeout(existing.timer);
    doorDebounceMap.delete(key);
  }
  submitDoorToBackend(door, ["has_battery"]);
}
</script>

<style lang="less" scoped>
.rental-cabinet-mock {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 16px;
}

.imei-row {
  display: flex;
  gap: 4px;
  width: 100%;
}

.imei-row .n-input {
  flex: 1;
}

/* 只读输入框：不写死浅色，避免深色模式下异常；交由 Naive 主题控制 */
.input-readonly-gray {
  background: transparent;
}

.form-buttons {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}

/* 电柜外框 —— 金属质感 */
.cabinet-frame {
  background: linear-gradient(180deg, #2d333b 0%, #3b4250 40%, #343b46 100%);
  border-radius: 14px;
  padding: 18px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid #4b5563;
}

.cabinet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
  font-size: 13px;
}

.cabinet-led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
  flex-shrink: 0;
}

.cabinet-title {
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
  letter-spacing: 1px;
}

.cabinet-imei {
  font-family: "Consolas", "Monaco", monospace;
  color: #6b7280;
  font-size: 12px;
}

.cabinet-env {
  padding: 2px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cabinet-refresh {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cabinet-refresh-label {
  font-size: 12px;
  color: #9ca3af;
}

/* 仓门网格 */
.cabinet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

/* 单个仓门卡片：防止内容溢出遮挡相邻仓门 */
.door-card {
  background: linear-gradient(180deg, #e8eaed, #dfe1e5);
  border-radius: 4px;
  padding: 6px;
  border: 1px solid #c0c4cc;
  transition: all 0.25s ease;
  position: relative;
  /* 略微加高一些，避免内部内容太挤需要滚动条 */
  aspect-ratio: 9 / 10;
  overflow: hidden;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.door-card .door-header {
  flex-shrink: 0;
}

.door-card .door-battery {
  flex: 1;
  /* 去掉内部滚动条，让仓门整体随内容略微增高 */
  overflow-y: visible;
}

.door-card .door-empty {
  flex: 1;
  min-height: 0;
}

.door-card:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 3px 10px rgba(0, 0, 0, 0.2);
}

.door-card.door-open {
  border-left: 3px solid #22c55e;
  background: linear-gradient(180deg, #f0fdf4, #ecfdf5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px rgba(34, 197, 94, 0.15);
}

.door-card.door-has-battery {
  background: linear-gradient(180deg, #f8f9fb, #f1f3f5);
}

.door-card.door-open.door-has-battery {
  background: linear-gradient(180deg, #f0fdf4, #f1f3f5);
}

.door-card.door-locked {
  opacity: 0.75;
  filter: saturate(0.85);
}

/* 禁仓开关为红色 */
.door-card.door-locked .door-locked-switch {
  color: #dc2626;
}

.door-card.door-locked .door-locked-switch :deep(.n-switch__rail) {
  background-color: rgba(239, 68, 68, 0.4);
}

.door-card.door-locked .door-locked-switch :deep(.n-switch__button) {
  background-color: #ef4444;
}

/* 仓门头部 */
.door-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 4px;
}

.door-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 0;
}

.door-locked-switch {
  flex-shrink: 0;
}

.door-header-right :deep(.n-switch) {
  flex-shrink: 0;
}

.door-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: linear-gradient(135deg, #4b5563, #374151);
  color: #f3f4f6;
  font-weight: 700;
  font-size: 11px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.door-lock {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  user-select: none;
}

.door-lock.lock-open {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.door-lock.lock-closed {
  background: rgba(107, 114, 128, 0.15);
  color: #4b5563;
}

.door-lock:hover {
  opacity: 0.8;
}

.door-lock.lock-no-click {
  cursor: default;
  opacity: 1;
}

.door-lock.lock-no-click:hover {
  opacity: 1;
}

.lock-icon {
  font-size: 12px;
  line-height: 1;
}

.lock-text {
  font-weight: 600;
  white-space: nowrap;
}

/* 有电池区域 */
.door-battery {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  min-width: 50px;
  flex-shrink: 0;
}

.battery-sn-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 仓门卡片内输入框固定浅色样式，深色模式下在浅色卡片上可读 */
.battery-sn-row :deep(.n-input) {
  flex: 1;
  min-width: 0;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
}
.door-card :deep(.n-input .n-input__input-el),
.door-card :deep(.n-input-number .n-input-number-input) {
  background-color: #ffffff;
  color: #1f2937;
  border-color: #e5e7eb;
}
.door-card :deep(.n-input.n-input--focus .n-input__input-el),
.door-card :deep(.n-input-number.n-input-number--focus .n-input-number-input) {
  background-color: #ffffff;
  border-color: #18a058;
}

/* SOC 进度条 */
.battery-soc-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.battery-charging-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.battery-charging-row :deep(.n-switch) {
  flex-shrink: 0;
}

.soc-slider {
  flex: 1;
}

.soc-slider :deep(.n-slider-rail) {
  height: 6px;
}

.soc-slider :deep(.n-slider-rail__fill) {
  background: #22c55e;
}

.soc-input {
  width: 48px;

  :deep(.n-input-number-input) {
    text-align: center;
  }
}

.soc-unit {
  font-size: 11px;
  color: #9ca3af;
}

/* 参数网格 */
.battery-params {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.param-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  min-width: 52px;
}

.param-input {
  flex: 1;
  min-width: 0;
}

.param-input :deep(.n-input-number) {
  min-width: 0;
}

.param-unit {
  font-size: 10px;
  color: #9ca3af;
  min-width: 16px;
}

.cell-input {
  flex: 1;
  min-width: 0;
}

.door-battery-footer {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 6px;
}

.remove-battery-wrap {
  display: inline-block;
}

.remove-battery-btn {
  min-width: 72px;
}

/* 空仓门 */
.door-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 6px;
  opacity: 0.7;
}

.empty-slot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  border: 1.5px dashed #c0c4cc;
}
</style>
