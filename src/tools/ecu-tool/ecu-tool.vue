<template>
  <div class="ecu-tool">
    <!-- 顶部工具条（对应客户端 toolStrip） -->
    <div class="ecu-topbar">
      <span class="lb">IMEI：</span>
      <n-auto-complete
        v-model:value="imei"
        class="w-180"
        size="tiny"
        clearable
        placeholder="输入15位IMEI"
        :options="imeiOptions"
        @update:value="onImeiInput"
      />
      <span class="lb">设备服务器配置：</span>
      <n-select
        v-model:value="envKey"
        class="w-180"
        size="tiny"
        clearable
        placeholder="自动查找"
        :options="envOptions"
        :consistent-menu-width="false"
      />
      <n-button size="tiny" class="btn-yellow" :loading="loading" @click="addWhitelist">
        添加白名单
      </n-button>
      <span class="lb">配置设备类型：</span>
      <n-select
        v-model:value="deviceType"
        class="w-140"
        size="tiny"
        clearable
        filterable
        :virtual-scroll="true"
        placeholder="点击拉取"
        :options="deviceTypeOptions"
        :consistent-menu-width="false"
        @focus="loadDeviceTypes"
      />
      <n-button size="tiny" class="btn-yellow" :loading="loading" @click="setDeviceType">
        设置
      </n-button>
      <div class="topbar-right">
        <n-button size="tiny" class="btn-yellow" @click="switchVisible = true">
          切车
        </n-button>
      </div>
    </div>

    <EcuToolSwitch v-model:show="switchVisible" :imei="imei" />

    <div class="ecu-body">
      <!-- 左：快捷命令 -->
      <div class="quick-panel">
        <div class="panel-title">
          快捷命令
        </div>
        <!-- C33 电门控制 -->
        <div class="gb">
          <span class="gb-title">C33 电门控制</span>
          <div class="row">
            <n-button size="tiny" class="btn-50 btn-on" @click="doAcc(true)">
              开电门
            </n-button>
            <n-checkbox v-model:checked="acc.onIdxOn" />
            <n-select v-model:value="acc.onIdx" size="tiny" class="w-50 idx-sel" :options="idxOptions" :consistent-menu-width="false" />
            <n-checkbox v-model:checked="acc.isIgnoreFence">
              忽略围栏
            </n-checkbox>
            <n-checkbox v-model:checked="acc.isKickstand">
              使用脚撑
            </n-checkbox>
          </div>
          <div class="row">
            <n-button size="tiny" class="btn-50 btn-off" @click="doAcc(false)">
              关电门
            </n-button>
            <n-checkbox v-model:checked="acc.offIdxOn" />
            <n-select v-model:value="acc.offIdx" size="tiny" class="w-50 idx-sel" :options="idxOptions" :consistent-menu-width="false" />
            <n-checkbox v-model:checked="acc.isTBeacon">
              判断道钉
            </n-checkbox>
            <n-checkbox v-model:checked="acc.isHelmetWear">
              检查头盔佩戴
            </n-checkbox>
          </div>
          <div class="row">
            <n-checkbox v-model:checked="ovldRemind">
              超载提醒
            </n-checkbox>
            <n-checkbox v-model:checked="ovldCut">
              超载断电
            </n-checkbox>
            <n-checkbox v-model:checked="ovldNotify">
              超载通知
            </n-checkbox>
          </div>
          <div class="row">
            <n-checkbox v-model:checked="rushAccOn">
              开电防飞车
            </n-checkbox>
            <n-checkbox v-model:checked="rushKeepOn">
              持续防飞车
            </n-checkbox>
          </div>
          <div class="row">
            <n-checkbox v-model:checked="helmetLeaveSwitch">
              头盔离位在位开关电门
            </n-checkbox>
            <n-checkbox v-model:checked="helmetLeaveAcc">
              头盔离位开电门
            </n-checkbox>
          </div>
          <div class="row">
            <n-checkbox v-model:checked="acc.speedLimitOn">
              单次启动限速 = {{ acc.speedLimit }}%
            </n-checkbox>
            <n-slider v-model:value="acc.speedLimit" class="slider-110" :max="100" />
          </div>
        </div>

        <!-- C4 设防控制 -->
        <div class="gb">
          <span class="gb-title">C4 设防控制</span>
          <div class="row">
            <n-button size="tiny" class="btn-50 btn-on" @click="doDefend(true)">
              设防
            </n-button>
            <n-checkbox v-model:checked="defend.onIdxOn" />
            <n-select v-model:value="defend.onIdx" size="tiny" class="w-50 idx-sel" :options="idxOptions" :consistent-menu-width="false" />
            <n-checkbox v-model:checked="defend.isKickstand">
              脚撑
            </n-checkbox>
            <n-checkbox v-model:checked="defend.isRFID">
              RFID
            </n-checkbox>
            <n-checkbox v-model:checked="defend.isCamera">
              CAM
            </n-checkbox>
          </div>
          <div class="row">
            <n-button size="tiny" class="btn-50 btn-off" @click="doDefend(false)">
              撤防
            </n-button>
            <n-checkbox v-model:checked="defend.offIdxOn" />
            <n-select v-model:value="defend.offIdx" size="tiny" class="w-50 idx-sel" :options="idxOptions" :consistent-menu-width="false" />
            <n-checkbox v-model:checked="defend.rssiOn">
              道钉设防 RSSI = -{{ defend.rssi }}
            </n-checkbox>
            <n-slider v-model:value="defend.rssi" class="slider-100" :max="128" />
          </div>
        </div>

        <!-- C40 电池仓锁控制 -->
        <div class="gb">
          <span class="gb-title">C40 电池仓锁控制</span>
          <div class="row">
            <n-button size="tiny" class="btn-68 btn-on" @click="doBatteryLock(true)">
              开锁
            </n-button>
            <n-button size="tiny" class="btn-68 btn-off" @click="doBatteryLock(false)">
              复位/上锁
            </n-button>
            <n-checkbox v-model:checked="batteryHalfLock">
              开锁后不自动复位（半锁）
            </n-checkbox>
          </div>
        </div>

        <!-- C82 头盔锁控制 -->
        <div class="gb">
          <span class="gb-title">C82 头盔锁控制</span>
          <div class="row">
            <n-button size="tiny" class="btn-68 btn-on" @click="doHelmetLock(true)">
              开锁
            </n-button>
            <n-button size="tiny" class="btn-68 btn-off" @click="doHelmetLock(false)">
              复位/上锁
            </n-button>
            <n-checkbox v-model:checked="helmetAutoLock">
              开锁后有感应自动上锁
            </n-checkbox>
          </div>
          <div class="row">
            <n-checkbox v-model:checked="helmetAutoOpen" class="ml-144">
              上锁失败后自动开锁
            </n-checkbox>
          </div>
        </div>

        <!-- 子标签页：顺序与客户端一致（语音播放 / 快捷功能按钮 / 超载功能） -->
        <div class="sub-tabs">
          <n-tabs v-model:value="subTab" type="line" size="small" animated>
            <n-tab-pane name="voice" tab="语音播放" display-directive="show:lazy">
              <div class="pane">
                <div class="row">
                  <span class="lb">音量：</span>
                  <n-slider v-model:value="volume" class="slider-110" :max="100" />
                  <span class="val">{{ volume }}%</span>
                  <n-button size="tiny" class="btn-48" :loading="loading" @click="queryVoiceList">
                    查询
                  </n-button>
                  <n-button size="tiny" class="btn-48" @click="playVoice(voiceIdx)">
                    播放
                  </n-button>
                </div>
                <div class="row">
                  <span class="lb">Idx：</span>
                  <n-slider v-model:value="voiceIdx" class="slider-110" :max="80" />
                  <span class="val">{{ voiceIdx }}</span>
                </div>
                <div class="voice-grid-10">
                  <n-button
                    v-for="i in VOICE_IDX_LIST.slice(0, 10)"
                    :key="i"
                    size="tiny"
                    class="voice-btn"
                    :class="{ 'voice-hit': voiceHit.includes(i) }"
                    @click="playVoice(i)"
                  >
                    {{ i }}
                  </n-button>
                </div>
                <div class="voice-grid-7">
                  <n-button
                    v-for="i in VOICE_IDX_LIST.slice(10)"
                    :key="i"
                    size="tiny"
                    class="voice-btn"
                    :class="{ 'voice-hit': voiceHit.includes(i) }"
                    @click="playVoice(i)"
                  >
                    {{ i }}
                  </n-button>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="quick" tab="快捷功能按钮" display-directive="show:lazy">
              <div class="pane grid-2">
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.shutdown, {})">
                  关机
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.bmsRealtime, {})">
                  C41查询BMS实时信息
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.photoCheck, {})">
                  C98 拍照检查
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.bmsFixed, {})">
                  C42查询BMS固定信息
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.reboot, {})">
                  设备重启
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.controllerInfo, {})">
                  C44查询控制器信息
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.parkTest, { parkLedMode: 1, parkLedTime: 3, parkSiteType: 0 })">
                  一键还车测试
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.meterTest, { bikeState: 0, remainSOC: 50, remainMiles: 28 })">
                  X2仪表测试
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.hardwareConfig, {})">
                  C97 硬件配置
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.flowQuery, { token: 'XiaoAnDebug' })">
                  C114 流量查询
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(num.customCmd ?? 0, { token: 'XiaoAnDebug' })">
                  自定义指令
                </n-button>
                <n-input-number v-model:value="num.customCmd" size="tiny" class="w-full" :min="0" />
              </div>
            </n-tab-pane>

            <n-tab-pane name="overload" tab="超载功能" display-directive="show:lazy">
              <div class="pane grid-2">
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { isResetPeelEnable: 1 })">
                  标定①超载去皮
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { updateBikeFactor: num.bikeFactor ?? 0 })">
                  标定②重力校准
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { overLoadThs: num.overLoadThs ?? 0 })">
                  超载阈值设置
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { overWeightThs: num.overWeightThs ?? 0 })">
                  超重阈值设置
                </n-button>
                <n-input-number v-model:value="num.bikeFactor" size="tiny" class="w-full" />
                <n-input-number v-model:value="num.overLoadThs" size="tiny" class="w-full" />
                <n-input-number v-model:value="num.overWeightThs" size="tiny" class="w-full" />
                <n-input-number v-model:value="num.bikeWeight" size="tiny" class="w-full" />
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.debugFlag, { token: 'XiaoAnDebug' })">
                  C109 弃用
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { token: 'XiaoAnDebug' })">
                  C119 超载信息
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { isPreventRushEnable: 1 })">
                  防飞车开启
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overLoad, { isPreventRushEnable: 0 })">
                  防飞车关闭
                </n-button>
                <n-input-number v-model:value="num.carFactor" size="tiny" class="w-full" />
                <n-input-number v-model:value="num.speed" size="tiny" class="w-full" />
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.hardwareConfig, { bikeFactor: num.carFactor ?? 0 })">
                  设置车身系数
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.hardwareConfig, { bikeWeight: num.bikeWeight ?? 0 })">
                  设置去皮值
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.overloadTest, {})">
                  C138 测试
                </n-button>
                <n-button size="tiny" class="btn-full" @click="sendCmd(CMD.speedLimit, { speed: num.speed ?? 0 })">
                  限速下发
                </n-button>
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>
      </div>

      <!-- 右：数据流（4 列：请求/响应 | C59 | C34 | C31+C32） -->
      <div class="flow-panel">
        <div class="flow-grid">
          <div class="flow-col">
            <div class="flow-toolbar">
              <n-select v-model:value="timeoutIdx" size="tiny" class="w-94" :options="timeoutOptions" :consistent-menu-width="false" />
              <n-checkbox v-model:checked="lockSend">
                锁定内容
              </n-checkbox>
              <span class="elapsed">{{ elapsed }}</span>
              <n-button size="tiny" class="btn-48 btn-post" :loading="loading" @click="handlePost">
                Post
              </n-button>
            </div>
            <div class="gb fill">
              <span class="gb-title">请求数据</span>
              <EcuToolJson v-model="sendText" :invalid="!sendTextValid" title="请求数据" :min-height="120" />
            </div>
            <div class="gb fill">
              <span class="gb-title">响应数据</span>
              <EcuToolJson
        v-model="receivedText"
        title="响应数据"
        :min-height="800"
      />
            </div>
          </div>

          <div class="flow-col">
            <n-button
              size="tiny"
              class="query-btn"
              :loading="loading"
              @click="sendCmd(QUERY_BUTTONS[0].c, {}, 0)"
            >
              {{ QUERY_BUTTONS[0].label }}
            </n-button>
            <EcuToolJson
              v-model="results[0]"
              title="C59生产查询"
              :min-height="800"
            />
          </div>

          <div class="flow-col">
            <n-button
              size="tiny"
              class="query-btn"
              :loading="loading"
              @click="sendCmd(QUERY_BUTTONS[1].c, {}, 1)"
            >
              {{ QUERY_BUTTONS[1].label }}
            </n-button>
            <EcuToolJson
              v-model="results[1]"
              title="C34查询状态信息"
              :min-height="800"
            />
          </div>

          <div class="flow-col">
            <div class="btn-pair">
              <n-button
                size="tiny"
                class="query-btn half"
                :loading="loading"
                @click="sendCmd(QUERY_BUTTONS[2].c, {}, 2)"
              >
                {{ QUERY_BUTTONS[2].label }}
              </n-button>
              <n-button
                size="tiny"
                class="query-btn third"
                :loading="loading"
                @click="sendCmd(QUERY_BUTTONS[3].c, {}, 2)"
              >
                {{ QUERY_BUTTONS[3].label }}
              </n-button>
            </div>
            <EcuToolJson
              v-model="results[2]"
              title="C31查询参数 / C32配置参数"
              :min-height="800"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'EcuTool' });

import { computed, reactive, ref, watch } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import type { SelectGroupOption } from 'naive-ui';
import { queryEBikeAPI } from '@/api/device';
import {
  ecuToolCloudCmdAPI,
  ecuToolCmdDirectAPI,
  ecuToolCmdEbikeAPI,
  ecuToolCmdOverseaAPI,
  ecuToolCmdRentalAPI,
  ecuToolEnvAllAPI,
} from '@/api/ecu-tool';
import EcuToolJson from './ecu-tool-json.vue';
import EcuToolSwitch from './ecu-tool-switch.vue';
import {
  buildCmdBody,
  type Business,
  CMD,
  clearCachedEnv,
  getCachedEnv,
  IMEI_STORAGE_KEY,
  parseDeviceResponse,
  QUERY_BUTTONS,
  setCachedEnv,
  stringifyResult,
  TIMEOUT_OPTIONS,
  VOICE_IDX_LIST,
} from './ecu-tool.service';

const { message } = createDiscreteApi(['message']);

/** ---------------- 基础状态 ---------------- */
const imei = ref('');
/**
 * 业务类型：完全由「设备服务器配置」所选环境自动推断（未选环境时沿用上次选择，默认共享），
 * 用户无需关心，界面上没有业务选择项。
 */
const business = ref<Business>(readBusiness());
/** 环境下拉选中值，形如 `ebike::prod`（含业务前缀，便于分组下拉） */
const envKey = ref<string | null>(null);
const deviceType = ref<string | null>(null);
const timeoutIdx = ref(3); // 客户端 Form1_Load: comboBox10.SelectedIndex = 3（10秒超时）
const lockSend = ref(false);
const switchVisible = ref(false);
const elapsed = ref('0ms');
const loading = ref(false);
const volume = ref(50); // 客户端 tB_volume.Value = 50

const sendText = ref('');
const receivedText = ref('');
const results = ref(['', '', '']);

const subTab = ref<'voice' | 'quick' | 'overload'>('voice'); // 客户端默认选中「语音播放」

const envOptions = ref<SelectGroupOption[]>([]);
const imeiOptions = ref<Array<{ label: string; value: string }>>([]);
const deviceTypeOptions = ref<Array<{ label: string; value: string }>>([]);
const deviceTypeConfig = ref<Record<string, string>>({});

/** 解析下拉选中的环境（含业务类型） */
const selectedEnv = computed(() => {
  const raw = envKey.value ?? '';
  const [biz, env] = raw.split('::');
  if (!biz || !env || !['ebike', 'rental', 'oversea'].includes(biz)) {
    return null;
  }
  return { business: biz as Business, env };
});

/** 自动识别回显到下拉框的值，用于区分「自动回显」与「用户手动选择」 */
const autoEnvKey = ref<string | null>(null);

/** 仅当用户手动选择环境时，才视为「强制直连指定环境」 */
const manualEnv = computed(() => {
  if (!envKey.value || envKey.value === autoEnvKey.value) {
    return null;
  }
  return selectedEnv.value;
});

/** 选择环境时同步切换到对应业务（并记忆，未选环境时沿用） */
watch(envKey, (value) => {
  const [biz] = (value ?? '').split('::');
  if (biz === 'ebike' || biz === 'rental' || biz === 'oversea') {
    business.value = biz;
    saveBusiness(biz);
  }
  if (value && value === autoEnvKey.value) {
    // 自动识别回显：保持自动绑定
    return;
  }
  // 用户手动选择 / 清空下拉：解除自动回显绑定
  autoEnvKey.value = null;
});

function readBusiness(): Business {
  try {
    const raw = localStorage.getItem('ecu-tool:business');
    return raw === 'rental' || raw === 'oversea' ? raw : 'ebike';
  } catch {
    return 'ebike';
  }
}

function saveBusiness(value: Business) {
  try {
    localStorage.setItem('ecu-tool:business', value);
  } catch {}
}

const idxOptions = Array.from({ length: 41 }, (_, i) => ({ label: String(i), value: i }));

/** ---------------- 参数默认值（对齐 Designer + Form1_Load） ---------------- */
const acc = reactive({
  onIdxOn: false,
  onIdx: 3, // comboBox6.Text = "3"
  offIdxOn: false,
  offIdx: 0, // comboBox7.Text = "0"
  isIgnoreFence: false,
  isKickstand: false,
  isTBeacon: false,
  isHelmetWear: false,
  // 与原客户端一致：同组复选框互斥，'0' 表示未勾选
  ovld: '0', // 1 超载提醒 / 2 超载断电 / 3 超载通知
  rush: '0', // 1 开电防飞车 / 2 持续防飞车
  helmetLeave: '0', // 1 头盔离位在位开关电门 / 2 头盔离位开电门
  speedLimitOn: false,
  speedLimit: 0,
});

/** 互斥复选框（对应客户端 checkBox27/28/36、37/38、39/40 的联动逻辑） */
const ovldRemind = computed({ get: () => acc.ovld === '1', set: v => { acc.ovld = v ? '1' : '0'; } });
const ovldCut = computed({ get: () => acc.ovld === '2', set: v => { acc.ovld = v ? '2' : '0'; } });
const ovldNotify = computed({ get: () => acc.ovld === '3', set: v => { acc.ovld = v ? '3' : '0'; } });
const rushAccOn = computed({ get: () => acc.rush === '1', set: v => { acc.rush = v ? '1' : '0'; } });
const rushKeepOn = computed({ get: () => acc.rush === '2', set: v => { acc.rush = v ? '2' : '0'; } });
const helmetLeaveSwitch = computed({ get: () => acc.helmetLeave === '1', set: v => { acc.helmetLeave = v ? '1' : '0'; } });
const helmetLeaveAcc = computed({ get: () => acc.helmetLeave === '2', set: v => { acc.helmetLeave = v ? '2' : '0'; } });

const defend = reactive({
  onIdxOn: false,
  onIdx: 1, // comboBox4.Text = "1"
  offIdxOn: false,
  offIdx: 2, // comboBox5.Text = "2"
  isKickstand: false,
  isRFID: false,
  isCamera: false,
  rssiOn: false,
  rssi: 70, // trackBar13.Value = 70
});

const batteryHalfLock = ref(false);
const helmetAutoLock = ref(true); // checkBox17 默认勾选
const helmetAutoOpen = ref(false);

const num = reactive({
  bikeFactor: 0 as number | null,
  overLoadThs: 0 as number | null,
  overWeightThs: 0 as number | null,
  bikeWeight: 0 as number | null,
  carFactor: 0.37 as number | null, // numericUpDown4 默认 0.37
  speed: 0 as number | null,
  customCmd: 119 as number | null,
});

const voiceIdx = ref(0);
const voiceHit = ref<number[]>([]);

const timeoutOptions = TIMEOUT_OPTIONS.map((item, index) => ({ label: item.label, value: index }));

const sendTextValid = computed(() => {
  if (!sendText.value.trim()) {
    return true;
  }
  try {
    JSON.parse(sendText.value);
    return true;
  } catch {
    return false;
  }
});

/** ---------------- 基础工具 ---------------- */
function checkImei(): boolean {
  if (!/^\d{15}$/.test(imei.value ?? '')) {
    message.error('请检查 IMEI 正确性（15 位数字）');
    return false;
  }
  return true;
}

/** 输入即清洗 + 缓存：非法字符过滤、最多 15 位，满 15 位立刻写入本地历史 */
function onImeiInput(value: string | null) {
  const cleaned = String(value ?? '').replace(/\D/g, '').slice(0, 15);
  imei.value = cleaned;
  // 上一台自动回显的环境不要沿用到新 IMEI（用户手动选择的环境则保留）
  if (autoEnvKey.value && envKey.value === autoEnvKey.value) {
    autoEnvKey.value = null;
    envKey.value = null;
  }
  if (cleaned.length === 15) {
    rememberImei(cleaned);
  }
}

/** 记录 IMEI 历史（对应客户端 config.txt 的 IMEI 列表） */
function rememberImei(value: string) {
  const history = [value, ...imeiOptions.value.map(item => item.value).filter(item => item !== value)].slice(0, 50);
  imeiOptions.value = history.map(item => ({ label: item, value: item }));
  try {
    localStorage.setItem(IMEI_STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

function currentTimeout(): number {
  return TIMEOUT_OPTIONS[timeoutIdx.value]?.value ?? 10000;
}

type Target = 'send' | 'received' | 'none' | 0 | 1 | 2;

function setTarget(target: Target, text: string) {
  if (target === 'none') {
    return;
  }
  if (target === 'send') {
    sendText.value = text;
  } else if (target === 'received') {
    receivedText.value = text;
  } else {
    results.value[target] = text;
  }
}

/** ---------------- 核心：命令下发 ---------------- */
/**
 * 识别到设备所在环境后，回显到「设备服务器配置」下拉框
 * （标记为自动回显，不作为强制直连）。
 */
function applyResolvedEnv(env: string) {
  const key = `${business.value}::${env}`;
  autoEnvKey.value = key;
  envKey.value = key;
}

/**
 * 解析目标环境：
 * 1) 本地缓存过该 IMEI 的环境 → 直接复用（不查询）
 * 2) 都没有 → 自动探测一次（/ebike/device/info 会返回 current_env_name）并缓存
 * 命中后回显到「设备服务器配置」下拉框；探测失败则返回 null，回退到后端默认的自动查找接口。
 */
async function resolveEnv(): Promise<string | null> {
  const cached = getCachedEnv(imei.value);
  if (cached) {
    applyResolvedEnv(cached);
    return cached;
  }
  try {
    const probe = (await queryEBikeAPI({ imei: imei.value })) as {
      code?: number;
      data?: { current_env_name?: string };
    };
    const env = probe?.data?.current_env_name;
    if (probe != null && Number(probe.code) === 0 && env) {
      setCachedEnv(imei.value, env);
      applyResolvedEnv(env);
      return env;
    }
  } catch {
    // 探测失败：回退到后端自动查找
  }
  if (autoEnvKey.value && envKey.value === autoEnvKey.value) {
    autoEnvKey.value = null;
    envKey.value = null;
  }
  return null;
}

/** 走 ecu4cloud 固定平台的命令（原客户端「添加白名单」「配置设备类型」） */
async function cloudCmd(cmd: Record<string, unknown>, target: Target = 'received') {
  loading.value = true;
  const start = Date.now();
  const body = { imei: imei.value, cmd };
  if (!lockSend.value) {
    sendText.value = JSON.stringify(body, null, 2);
  }
  try {
    const res = (await ecuToolCloudCmdAPI(body, currentTimeout())) as {
      code?: number;
      msg?: string;
      data?: unknown;
    };
    const parsed = parseDeviceResponse(res);
    setTarget(target, parsed.ok ? stringifyResult(parsed.data) : `code = ${parsed.code}  ${parsed.msg}`);
    return parsed;
  } catch {
    setTarget(target, '返回超时或其他错误!');
    return null;
  } finally {
    elapsed.value = `${Date.now() - start} ms`;
    loading.value = false;
  }
}

async function doRequest(body: Record<string, unknown>, target: Target = 'received') {
  loading.value = true;
  const start = Date.now();
  try {
    const timeout = currentTimeout();
    // 仅用户手动选择环境时才强制直连；自动识别回显的环境仍走自动查找（含失败回退）
    const picked = manualEnv.value;
    let cachedEnv: string | null = null;
    let res: { code?: number; msg?: string; data?: unknown };

    if (picked) {
      // 指定了「设备服务器配置」：按业务直连该环境，不查询、不回退
      res = (await ecuToolCmdDirectAPI(
        { ...body, business: picked.business, env: picked.env },
        timeout,
      )) as typeof res;
    } else if (business.value === 'ebike') {
      // 共享：优先用本地缓存环境直连，未缓存则探测一次
      cachedEnv = await resolveEnv();
      res = cachedEnv
        ? ((await ecuToolCmdDirectAPI({ ...body, business: 'ebike', env: cachedEnv }, timeout)) as typeof res)
        : ((await ecuToolCmdEbikeAPI(body, timeout)) as typeof res);
    } else if (business.value === 'rental') {
      res = (await ecuToolCmdRentalAPI(body, timeout)) as typeof res;
    } else {
      res = (await ecuToolCmdOverseaAPI(body, timeout)) as typeof res;
    }

    let parsed = parseDeviceResponse(res);

    // 缓存环境直连失败（设备可能已切走）：清缓存并回退到自动查找
    if (cachedEnv && !parsed.ok) {
      clearCachedEnv(imei.value);
      // 已不确定设备环境，撤销自动回显，回到「自动查找」
      if (autoEnvKey.value && envKey.value === autoEnvKey.value) {
        autoEnvKey.value = null;
        envKey.value = null;
      }
      res = (await ecuToolCmdEbikeAPI(body, timeout)) as typeof res;
      parsed = parseDeviceResponse(res);
    }

    setTarget(target, parsed.ok ? stringifyResult(parsed.data) : `code = ${parsed.code}  ${parsed.msg}`);
    return parsed;
  } catch {
    setTarget(target, '返回超时或其他错误!');
    return null;
  } finally {
    elapsed.value = `${Date.now() - start} ms`;
    loading.value = false;
  }
}

/** 下发命令（对应客户端 button_aciton_handle） */
async function sendCmd(c: number, param: unknown, target: Target = 'received') {
  if (!checkImei()) {
    return null;
  }
  const value = imei.value;
  rememberImei(value);
  const body = buildCmdBody({ business: business.value, imei: value, c, param });
  if (!lockSend.value) {
    sendText.value = JSON.stringify(body, null, 2);
  }
  return doRequest(body, target);
}

/** Post：直接透传「请求数据」里的 JSON（对应 button37_Click_2） */
async function handlePost() {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(sendText.value);
  } catch {
    message.error('请先检查发送字符串!');
    return;
  }
  sendText.value = JSON.stringify(body, null, 2);
  await doRequest(body, 'received');
}

/** ---------------- 顶部工具条功能 ---------------- */
/** 添加白名单（toolStripButton2_Click -> 固定平台 C3） */
async function addWhitelist() {
  if (!checkImei()) {
    return;
  }
  await cloudCmd({ c: 3 });
}

/** 拉取设备类型（toolStripComboBox1_DropDown -> 固定平台 C18） */
async function loadDeviceTypes() {
  if (deviceTypeOptions.value.length > 0) {
    return;
  }
  if (!checkImei()) {
    return;
  }
  // C18 会返回全量设备类型（每种都带完整 deviceConfig），数据量可能极大。
  // 这里不回显原始响应（JSON 高亮 + 自适应高度会卡死页面），只写一行摘要。
  const parsed = await cloudCmd({ c: 18, param: {} }, 'none');
  if (!parsed?.ok) {
    return;
  }
  const data = (parsed.data ?? {}) as Record<string, unknown>;
  const list = Array.isArray(data.deviceTypes) ? data.deviceTypes : [];
  const options: Array<{ label: string; value: string }> = [];
  const configs: Record<string, string> = {};
  const seen = new Set<string>();
  for (const item of list) {
    const row = (item ?? {}) as Record<string, unknown>;
    const type = String(row.deviceType ?? '').trim();
    if (!type || seen.has(type)) {
      continue;
    }
    seen.add(type);
    options.push({ label: type, value: type });
    configs[type] = String(row.deviceConfig ?? '');
  }
  deviceTypeOptions.value = options;
  deviceTypeConfig.value = configs;
  receivedText.value = `已加载设备类型 ${options.length} 个（全量明细过大，已省略展示）`;
}

/** 设置设备类型（toolStripButton4_Click -> C14 deviceType + imeis） */
async function setDeviceType() {
  if (!deviceType.value) {
    message.warning('请先选择设备类型');
    return;
  }
  if (!checkImei()) {
    return;
  }
  const config = deviceTypeConfig.value[deviceType.value] ?? '';
  await cloudCmd({ c: 14, param: { deviceType: deviceType.value, imeis: [imei.value] } });
  message.success(config ? `已下发设置：${deviceType.value}` : `已下发设置：${deviceType.value}`);
}

/** ---------------- 电门控制（button36_Click） ---------------- */
async function doAcc(isOn: boolean) {
  const param: Record<string, unknown> = { acc: isOn ? 1 : 0 };
  const idxOn = isOn ? acc.onIdxOn : acc.offIdxOn;
  if (idxOn) {
    param.idx = (isOn ? acc.onIdx : acc.offIdx) ?? 0;
  }
  param.volume = volume.value;
  if (acc.isIgnoreFence) {
    param.isIgnoreFence = 1;
  }
  if (acc.isTBeacon) {
    param.isTBeacon = 1;
  }
  if (acc.speedLimitOn) {
    param.singleSpeedLimit = acc.speedLimit;
  }
  if (acc.isKickstand) {
    param.isKickstand = 1;
  }
  if (acc.isHelmetWear) {
    param.isHelmetWear = 1;
  }
  if (acc.ovld !== '0') {
    param.isOvld = Number(acc.ovld);
  }
  if (acc.rush !== '0') {
    param.isPreventRush = Number(acc.rush);
  }
  if (acc.helmetLeave !== '0') {
    param.isHelmetLeave = Number(acc.helmetLeave);
  }
  return sendCmd(CMD.acc, param);
}

/** ---------------- 设防控制（button37_Click / button97_MouseUp） ---------------- */
async function doDefend(isDefend: boolean) {
  const param: Record<string, unknown> = { defend: isDefend ? 1 : 0 };
  const idxOn = isDefend ? defend.onIdxOn : defend.offIdxOn;
  if (idxOn) {
    param.idx = (isDefend ? defend.onIdx : defend.offIdx) ?? 0;
  }
  param.volume = volume.value;
  param.isRFID = defend.isRFID ? 1 : 0;
  param.isKickstand = defend.isKickstand ? 1 : 0;
  param.isTBeacon = defend.rssiOn ? 1 : 0;
  param.tBeaconRange = defend.rssi;
  param.isCamera = defend.isCamera ? 1 : 0;
  return sendCmd(CMD.defend, param);
}

/** ---------------- 电池仓锁（button41_Click） ---------------- */
async function doBatteryLock(isUnlock: boolean) {
  return sendCmd(CMD.batteryLock, isUnlock ? { sw: 0, isHalfUnlock: batteryHalfLock.value ? 1 : 0 } : { sw: 1 });
}

/** ---------------- 头盔锁（button42_Click） ---------------- */
async function doHelmetLock(isUnlock: boolean) {
  return sendCmd(
    CMD.helmetLock,
    isUnlock
      ? { sw: 0, isAutoLock: helmetAutoLock.value ? 1 : 0 }
      : { sw: 1, isAutoOpen: helmetAutoOpen.value ? 1 : 0 },
  );
}

/** ---------------- 语音（button142_Click / button5_Click_1） ---------------- */
function playVoice(idx: number) {
  voiceIdx.value = idx;
  return sendCmd(CMD.voicePlay, { idx, volume: volume.value });
}

function pickAud(data: unknown): number[] {
  const obj = (data ?? {}) as Record<string, unknown>;
  let aud: unknown = obj.aud;
  if (aud == null && obj.result && typeof obj.result === 'object') {
    aud = (obj.result as Record<string, unknown>).aud;
  }
  if (typeof aud === 'string') {
    aud = aud.replace(/[[\]\s\r\n]/g, '').split(',');
  }
  if (!Array.isArray(aud)) {
    return [];
  }
  return aud.map(item => Number(item)).filter(item => !Number.isNaN(item));
}

async function queryVoiceList() {
  const parsed = await sendCmd(CMD.voiceList, {});
  if (parsed?.ok) {
    voiceHit.value = pickAud(parsed.data);
    message.success(`共 ${voiceHit.value.length} 个语音位`);
  }
}

/** ---------------- 环境列表：初始化即加载 共享/短租/海外 三类环境，分组展示供下拉选择 ---------------- */
async function loadEnvOptions() {
  const businesses: Array<{ key: Business; label: string }> = [
    { key: 'ebike', label: '共享业务' },
    { key: 'rental', label: '短租业务' },
    { key: 'oversea', label: '海外业务' },
  ];
  const groups: SelectGroupOption[] = [];
  for (const item of businesses) {
    try {
      const res = (await ecuToolEnvAllAPI(item.key)) as { data?: unknown };
      const data = res?.data;
      const map = data != null && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, { name?: string }>)
        : {};
      const children = Object.entries(map)
        .map(([env, value]) => ({
          label: `${value?.name ?? env}（${env}）`,
          value: `${item.key}::${env}`,
        }))
        .filter(child => child.value);
      if (children.length > 0) {
        groups.push({ type: 'group', label: item.label, key: item.key, children });
      }
    } catch {
      // 单个业务加载失败不影响其它业务
    }
  }
  envOptions.value = groups;
}

// 初始化：IMEI 历史 + 环境列表（setup 阶段直接执行，不依赖挂载时机）
try {
  const raw = localStorage.getItem(IMEI_STORAGE_KEY);
  const history: string[] = raw ? JSON.parse(raw) : [];
  imeiOptions.value = history.map(item => ({ label: item, value: item }));
  if (history.length > 0) {
    imei.value = history[0];
  }
} catch {}
loadEnvOptions();
</script>

<style scoped>
/* 铺满整个宽度（覆盖 tool layout 默认的 80% 限制） */
.ecu-tool {
  flex: 1 1 100% !important;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
  font-size: 12px;
  line-height: 1.25;
  color: #333;
}

/* ---------------- 顶部工具条 ---------------- */
.ecu-topbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  padding: 2px 4px;
  border-bottom: 1px solid #e2e2e6;
}

.ecu-topbar .lb {
  color: #333;
  white-space: nowrap;
}

.ecu-topbar .hint {
  color: #999;
  font-size: 11px;
  white-space: nowrap;
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---------------- 主体 ---------------- */
.ecu-body {
  display: flex;
  gap: 4px;
  align-items: stretch;
}

.quick-panel {
  flex: 0 0 336px;
  width: 336px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  padding: 4px 4px 3px;
}

.panel-title {
  padding: 0 0 1px 4px;
  font-size: 12px;
  color: #333;
}

/* 模拟 WinForms GroupBox（不用 fieldset，避免 flex 高度异常） */
.gb {
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  padding: 11px 5px 4px;
  margin: 0;
}

.gb-title {
  position: absolute;
  top: -7px;
  left: 7px;
  padding: 0 3px;
  background: var(--n-color, #fff);
  font-size: 12px;
  color: #333;
}

.gb.fill {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin: 2px 0;
}

.sub-tabs {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  padding: 0 4px 2px;
}

.sub-tabs :deep(.n-tabs-nav) {
  margin-bottom: 2px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 2px;
}

.pane.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 5px;
  align-items: center;
}

.lb {
  color: #333;
  white-space: nowrap;
}

.val {
  min-width: 26px;
  color: #666;
}

.ml-144 {
  margin-left: 144px;
}

/* 语音位按钮：0-9 一行十个，10+ 每行七个（与客户端排布一致） */
.voice-grid-10 {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 2px;
}

.voice-grid-7 {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
  margin-top: 2px;
}

.voice-btn {
  min-width: 0;
  padding: 0 1px;
  height: 22px;
}

.voice-hit {
  background-color: #b7eb8f !important;
  border-color: #95d46d !important;
}

/* ---------------- 右侧数据流 ---------------- */
.flow-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  padding: 3px;
}

.flow-grid {
  display: grid;
  grid-template-columns: 353px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 3px;
}

.flow-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.flow-toolbar {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
}

.flow-toolbar .elapsed {
  min-width: 52px;
  text-align: right;
  color: #666;
  font-size: 11px;
}

.query-btn {
  height: 32px;
}

.btn-pair {
  display: flex;
  gap: 3px;
  height: 32px;
}

.query-btn.half {
  flex: 1.5;
}

.query-btn.third {
  flex: 1;
}

.quick-panel :deep(.n-checkbox__label) {
  padding-left: 4px;
  font-size: 12px;
}

.quick-panel :deep(.n-checkbox) {
  font-size: 12px;
}

/* ---------------- 尺寸工具类 ---------------- */
.w-50 { width: 50px; }
.w-94 { width: 94px; }
.w-100 { width: 100px; }
.w-135 { width: 135px; }
.w-140 { width: 140px; }
.w-158 { width: 158px; }
.w-165 { width: 165px; }
.w-180 { width: 180px; }
.w-full { width: 100%; }

.slider-100 { width: 100px; }
.slider-110 { width: 110px; }

.btn-48 { width: 48px; }
.btn-50 { width: 50px; }
.btn-68 { width: 68px; }
.btn-full { width: 100%; }

/* 客户端配色：正向操作绿色、反向操作粉红、工具条按钮浅黄 */
.btn-on {
  background-color: #7cfc00 !important;
  border-color: #6ad400 !important;
  color: #000 !important;
}

.btn-off {
  background-color: #ff9a9a !important;
  border-color: #ff7f7f !important;
  color: #000 !important;
}

.btn-yellow {
  background-color: #ffffe1 !important;
  border-color: #d9d9b0 !important;
  color: #333 !important;
}

.btn-post {
  background-color: #e8f4ff !important;
  border-color: #a8cdf0 !important;
  color: #333 !important;
}
</style>