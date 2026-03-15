<template>
  <div class="xiaoan-ecu-mock">
    <div class="card-wrap" :class="{ 'card-wrap-reporting': connectId }">
      <n-card>
        <div class="form-section">
          <n-form :model="formData" label-placement="left" label-width="100px">
            <n-grid :cols="12" :x-gap="1" :y-gap="2">
              <!-- 第一行：环境、租户ID、服务区（服务区宽一点） -->
              <n-gi :span="4">
                <n-form-item label="环境" path="env" required>
                  <n-select v-model:value="formData.env" :options="envOptions" placeholder="请选择环境" clearable
                    size="small" :disabled="!!connectId" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="3">
                <n-form-item label="租户ID" path="tenant_id" required>
                  <n-input :value="formData.tenant_id" placeholder="请输入租户 ID" clearable size="small"
                    :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" style="width: 100%"
                    @update:value="onTenantIdInput" />
                </n-form-item>
              </n-gi>
              <n-gi :span="5">
                <n-form-item path="service_area">
                  <template #label>
                    <span>服务区</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      非必填。可切换输入名称或ID，若填写将自动绑定车辆并上架该服务区
                    </n-tooltip>
                  </template>
                  <div class="service-area-row">
                    <n-select
                      v-model:value="formData.serviceAreaInputMode"
                      :options="serviceAreaInputModeOptions"
                      size="small"
                      :disabled="!!connectId"
                      class="service-area-type-select"
                    />
                    <n-input
                      v-if="formData.serviceAreaInputMode === 'name'"
                      v-model:value="formData.service_area_name"
                      placeholder="选填，服务区名称"
                      clearable
                      size="small"
                      :readonly="!!connectId"
                      :class="{ 'input-readonly-gray': connectId }"
                      class="service-area-input"
                    />
                    <n-input
                      v-else
                      v-model:value="formData.service_area_id"
                      placeholder="选填，服务区ID"
                      clearable
                      size="small"
                      :readonly="!!connectId"
                      :class="{ 'input-readonly-gray': connectId }"
                      class="service-area-input"
                    />
                  </div>
                </n-form-item>
              </n-gi>
              <!-- 第二行：IMEI、参考IMEI -->
              <n-gi :span="6">
                <n-form-item label="IMEI" path="imei" required>
                  <div class="imei-row">
                    <n-input v-model:value="formData.imei" placeholder="IMEI（15 位数字，以 86 开头）" clearable size="small"
                      :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" />
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button type="default" size="small" :disabled="!!connectId" @click="randomImei">
                          <template #icon>
                            <n-icon :component="Dice" :size="18" />
                          </template>
                        </n-button>
                      </template>
                      随机生成
                    </n-tooltip>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item path="ref_imei">
                  <template #label>
                    <span>参考IMEI</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      选填。请确保改IMEI真实存在并在线，如填入将参考此IMEI模拟透传返回
                    </n-tooltip>
                  </template>
                  <n-input v-model:value="formData.ref_imei" placeholder="选填，15 位数字" clearable size="small"
                    :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" style="width: 100%"
                    :maxlength="15" show-count />
                </n-form-item>
              </n-gi>
              <!-- 第三行：经度、纬度 -->
              <n-gi :span="6">
                <n-form-item label="经度(GCJ02)" path="lng">
                  <n-input-number v-model:value="formData.lng" placeholder="经度" size="small" clearable
                    :show-button="false" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="纬度(GCJ02)" path="lat">
                  <n-input-number v-model:value="formData.lat" placeholder="纬度" size="small" clearable
                    :show-button="false" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <!-- 剩余每行2个 -->
              <n-gi :span="6">
                <n-form-item label="电压（v）" path="voltage">
                  <n-input-number v-model:value="formData.voltage" placeholder="默认 55" size="small" :min="0"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item path="version">
                  <template #label>
                    <span>版本号</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      仅在开始模拟实时生效，更新数据 需要 设备复位或重启后生效
                    </n-tooltip>
                  </template>
                  <n-input v-model:value="formData.version" placeholder="默认 1.2.3" clearable size="small"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="电源状态" path="power_exists">
                  <n-space :size="8" align="center">
                    <span class="switch-label">断开</span>
                    <n-switch v-model:value="formData.power_exists" size="small" />
                    <span class="switch-label">连接</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="座舱锁状态" path="seat_locked">
                  <n-space :size="8" align="center">
                    <span class="switch-label">开启</span>
                    <n-switch v-model:value="formData.seat_locked" size="small" />
                    <span class="switch-label">关闭</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi :span="12" class="helmet-row" v-show="false">
                <n-space align="center" :size="24">
                  <n-form-item label="模拟头盔" path="has_helmet" label-placement="left">
                    <n-switch v-model:value="formData.has_helmet" size="small" @update:value="onHasHelmetChange" />
                  </n-form-item>
                  <n-form-item label="头盔在位" path="helmet_react" label-placement="left">
                    <n-space :size="8" align="center">
                      <span class="switch-label">否</span>
                      <n-switch v-model:value="formData.helmet_react" size="small" :disabled="!formData.has_helmet" />
                      <span class="switch-label">是</span>
                    </n-space>
                  </n-form-item>
                  <n-form-item label="头盔上锁" path="helmet_lock" label-placement="left">
                    <n-space :size="8" align="center">
                      <span class="switch-label">否</span>
                      <n-switch v-model:value="formData.helmet_lock" size="small" :disabled="!formData.has_helmet" />
                      <span class="switch-label">是</span>
                    </n-space>
                  </n-form-item>
                </n-space>
              </n-gi>
              <!-- TLV 独占一行 -->
              <n-gi :span="12">
                <n-form-item path="tlv">
                  <template #label>
                    <span>TLV数据</span>
                  </template>
                  <div class="tlv-input-row">
                    <n-input
                      v-model:value="formData.tlv"
                      type="textarea"
                      placeholder='选填'
                      :autosize="{ minRows: 4, maxRows: 10 }"
                      clearable
                      size="small"
                      class="tlv-textarea"
                    />
                    <n-space :size="8" class="tlv-btns">
                      <n-button
                        type="default"
                        size="small"
                        class="tlv-ref-btn"
                        @click="insertTlvExample"
                      >
                        示例
                      </n-button>
                      <n-button
                        type="default"
                        size="small"
                        class="tlv-ref-btn"
                        @click="openTlvProtocolDoc"
                      >
                        参考文档
                      </n-button>
                    </n-space>
                  </div>
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-form-item class="form-item-buttons">
              <template v-if="!connectId">
                <n-button type="primary" :loading="createLoading" @click="handleCreate">
                  开始模拟
                </n-button>
              </template>
              <template v-else>
                <n-space :size="8">
                  <n-button type="error" :loading="deleteLoading" @click="handleDisconnect">
                    <template #icon>
                      <n-icon :component="Trash" :size="18" />
                    </template>
                    停止模拟
                  </n-button>
                  <n-button type="default" :loading="updateLoading" @click="handleUpdate">
                    立即更新数据
                  </n-button>
                  <n-button type="default" @click="openMoveModal">                    
                    手动移动
                  </n-button>
                  <n-button type="default" @click="openTrackModal">
                    <template #icon>
                      <n-icon :component="Gps" :size="18" />
                    </template>
                    模拟轨迹
                  </n-button>
                </n-space>
              </template>
            </n-form-item>
          </n-form>
        </div>

        <div v-if="createError" class="error-block">
          <n-alert type="error" :title="createError" />
        </div>

        <!-- Cmd 数据 Tab 区域：仅在有 connect_id 且已拉取过 cmd 数据时展示 -->
        <div v-if="connectId" class="cmd-section">
          <div class="cmd-section-head">
            <span class="cmd-section-title">模拟透传命令cmd返回</span>
            <n-space>
              <n-button size="small" @click="fetchCmdAll">刷新</n-button>
              <n-button type="primary" size="small" @click="openAddCmd">新增</n-button>
            </n-space>
          </div>
          <n-tabs v-if="cmdEntries.length > 0" v-model:value="activeCmdTab" type="segment" addable @add="openAddCmd">
            <n-tab-pane v-for="entry in cmdEntries" :key="entry.key" :name="entry.key">
              <template #tab>
                <span class="cmd-tab-label">
                  <span>{{ entry.key }}</span>
                  <span class="cmd-tab-close-wrap">
                    <n-popconfirm positive-text="确认" negative-text="取消" @positive-click="handleCloseTab(entry.key)">
                      <template #trigger>
                        <n-button quaternary circle size="tiny" class="cmd-tab-close-btn" @click.stop>
                          <template #icon>
                            <n-icon :component="Trash" :size="12" />
                          </template>
                        </n-button>
                      </template>
                      是否确认删除该命令？
                    </n-popconfirm>
                  </span>
                </span>
              </template>
              <div class="cmd-pane-content">
                <div class="json-input-wrap">
                  <n-input v-model:value="entry.editValue" v-fit-textarea-height type="textarea" placeholder="JSON 字符串"
                    class="cmd-textarea cmd-json-display" :input-props="{ spellcheck: false, autocomplete: 'off' }" />
                  <n-space :size="8" class="json-input-actions">
                    <n-button type="default" size="small" @click="applyCmdEntryUnescape(entry)">去除转义</n-button>
                    <n-button type="default" size="small" @click="applyCmdEntryFormat(entry)">格式化</n-button>
                  </n-space>
                </div>
                <n-button type="primary" size="small" @click="saveCmd(entry)">
                  保存
                </n-button>
              </div>
            </n-tab-pane>
          </n-tabs>
          <div v-else-if="cmdLoadDone" class="cmd-empty">
            <n-empty description="暂无命令数据，可点击「新增」添加" />
          </div>
          <div v-else class="cmd-loading">
            <n-spin size="small" />
            <span>加载命令数据中...</span>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 手动移动弹窗 -->
    <n-modal v-model:show="showMoveModal" preset="dialog" title="手动移动（通过GPS上报）" :mask-closable="false">
      <template #action>
        <n-button type="primary" :loading="moveLoading" @click="handleMoveSubmit">
          移动
        </n-button>
      </template>
      <n-form :model="moveForm" label-width="100px" label-placement="top">
        <n-form-item label="方位角">
          <div class="move-compass">
            <div class="compass-row compass-row-top">
              <span class="compass-cell" />
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 0 }" role="button"
                tabindex="0" @click="moveForm.bearing = 0" @keydown.enter.space.prevent="moveForm.bearing = 0">
                <span class="compass-option-dot" />
                <span>北 0°</span>
              </div>
              <span class="compass-cell" />
            </div>
            <div class="compass-row">
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 270 }" role="button"
                tabindex="0" @click="moveForm.bearing = 270" @keydown.enter.space.prevent="moveForm.bearing = 270">
                <span class="compass-option-dot" />
                <span>西 270°</span>
              </div>
              <div class="compass-cell compass-input-wrap">
                <n-input-number v-model:value="moveForm.bearing" :min="0" :max="360" :step="1" size="small"
                  :show-button="false" placeholder="°" class="compass-bearing-input" />
              </div>
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 90 }" role="button"
                tabindex="0" @click="moveForm.bearing = 90" @keydown.enter.space.prevent="moveForm.bearing = 90">
                <span class="compass-option-dot" />
                <span>东 90°</span>
              </div>
            </div>
            <div class="compass-row compass-row-bottom">
              <span class="compass-cell" />
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 180 }" role="button"
                tabindex="0" @click="moveForm.bearing = 180" @keydown.enter.space.prevent="moveForm.bearing = 180">
                <span class="compass-option-dot" />
                <span>南 180°</span>
              </div>
              <span class="compass-cell" />
            </div>
          </div>
        </n-form-item>
        <n-form-item label="移动距离(米)">
          <n-input-number v-model:value="moveForm.distance" :min="0" :step="1" size="small" placeholder="米"
            :show-button="false" style="width: 100%" />
        </n-form-item>
      </n-form>
      <div class="move-record-section">
        <!-- <div class="move-record-title">移动记录</div> -->
        <ul v-if="moveRecordList.length > 0" class="move-record-list">
          <li v-for="(record, index) in moveRecordList" :key="index" class="move-record-item">
            <span class="move-record-arrow">{{ record.arrow }}</span>
            <span class="move-record-time">{{ record.dateTime }}</span>
            向 <span class="move-record-bearing"> {{ record.bearingLabel }} </span> 移动
            <span class="move-record-distance">{{ record.distance }} 米</span>
          </li>
        </ul>
        <div v-else class="move-record-empty">暂无移动记录</div>
      </div>
    </n-modal>

    <!-- 模拟轨迹弹窗 -->
    <n-modal v-model:show="showTrackModal" preset="dialog" title="模拟轨迹" :mask-closable="false"
      style="width: 600px">
      <template #action>
        <n-space :size="8">
          <n-button type="default" :disabled="trackLoading" @click="generateSampleTrack">添加示例</n-button>
          <n-button type="primary" :loading="trackLoading" @click="handleTrackStart">
            提交轨迹
          </n-button>
        </n-space>
      </template>
      <n-form label-width="80px">
        <n-form-item label="轨迹点，将按照下面经纬度列表依次上报数据">
          <div class="track-input-wrap">
            <n-input v-model:value="trackText" type="textarea" :rows="12" size="small"
              placeholder="每行一个坐标，格式：经度,纬度&#10;为空时提交将清除已提交"
              :disabled="trackLoading" style="width: 100%" />
            <n-button v-if="trackText.trim()" text size="small" class="track-clear-btn"
              @click="trackText = ''">
              清除
            </n-button>
          </div>
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 新增 Cmd 弹窗 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="新增命令" positive-text="确定"
      @positive-click="confirmAddCmd">
      <n-form :model="addForm" label-width="80px">
        <n-form-item label="cmd" path="cmd" required>
          <n-input v-model:value="addForm.cmd" placeholder="如 31、34" size="small" />
        </n-form-item>
        <n-form-item label="value" path="value">
          <div class="json-input-wrap">
            <n-input v-model:value="addForm.value" v-fit-textarea-height type="textarea" :rows="6" size="small"
              placeholder="JSON 字符串" class="cmd-textarea cmd-json-display"
              :input-props="{ spellcheck: false, autocomplete: 'off' }" style="width: 100%" />
            <n-space :size="8" class="json-input-actions">
              <n-button type="default" size="small" @click="applyAddFormUnescape">去除转义</n-button>
              <n-button type="default" size="small" @click="applyAddFormFormat">格式化</n-button>
            </n-space>
          </div>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "XiaoanEcuMock" });

import { ref, reactive, nextTick } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Help, Gps, Trash, Dice } from "@vicons/tabler";
import {
  xiaoanEcuMockCreateAPI,
  xiaoanEcuMockCmdAllAPI,
  xiaoanEcuMockCmdSetAPI,
  xiaoanEcuMockDeleteAPI,
  xiaoanEcuMockUpdateAPI,
  xiaoanEcuMockMoveAPI,
  xiaoanEcuMockTrajectoryAPI,
} from "@/api/device";

const { message } = createDiscreteApi(["message"]);

/** 校验接口返回 code，不为 0 时 toast 返回的 msg 并返回 false */
function checkResCode(res: any): boolean {
  if (res != null && Number(res.code) !== 0) {
    message.error(res.msg || "请求失败");
    return false;
  }
  return true;
}

/** 使 n-input textarea 随内容增高，减少滚动 */
function fitTextareaHeight(el: HTMLElement) {
  nextTick(() => {
    const textarea = el.tagName === "TEXTAREA" ? el : el.querySelector("textarea");
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
  });
}

const vFitTextareaHeight = {
  mounted(el: HTMLElement) {
    fitTextareaHeight(el);
    const textarea = el.querySelector("textarea");
    if (textarea) {
      textarea.addEventListener("input", () => fitTextareaHeight(el));
    }
  },
  updated(el: HTMLElement) {
    fitTextareaHeight(el);
  },
};

const STORAGE_KEY = "XATTP_ECU_MOCK_FORM";

/** 服务区输入模式：名称 或 ID */
type ServiceAreaInputMode = "name" | "id";

/** 表单持久化结构（与 formData 字段一致，用于 localStorage） */
interface StoredForm {
  env?: string;
  tenant_id?: string;
  imei?: string;
  ref_imei?: string;
  lng?: number | null;
  lat?: number | null;
  voltage?: number | null;
  version?: string;
  service_area_id?: string;
  service_area_name?: string;
  serviceAreaInputMode?: ServiceAreaInputMode;
  seat_locked?: boolean;
  power_exists?: boolean;
  has_helmet?: boolean;
  helmet_react?: boolean;
  helmet_lock?: boolean;
  tlv?: string;
}

/** 默认表单值 */
const defaultFormData = {
  env: "test2",
  tenant_id: "1",
  imei: "",
  ref_imei: "",
  lng: 114.434888,
  lat: 30.500136,
  voltage: 55,
  version: "1.2.3",
  service_area_id: "",
  service_area_name: "",
  serviceAreaInputMode: "name" as ServiceAreaInputMode,
  seat_locked: true,
  power_exists: true,
  has_helmet: false,
  helmet_react: false,
  helmet_lock: false,
  tlv: "",
};

/** 从 localStorage 读取并合并为初始表单（用于首屏回显，刷新/进入页面时执行一次） */
function getInitialFormData(): typeof defaultFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultFormData };
    const data = JSON.parse(raw) as StoredForm;
    return {
      env:
        typeof data.env === "string" && data.env.trim()
          ? data.env.trim()
          : defaultFormData.env,
      tenant_id:
        typeof data.tenant_id === "string"
          ? data.tenant_id.replace(/\D/g, "")
          : defaultFormData.tenant_id,
      imei:
        typeof data.imei === "string" ? data.imei : defaultFormData.imei,
      ref_imei:
        typeof data.ref_imei === "string" ? data.ref_imei : defaultFormData.ref_imei,
      lng:
        typeof data.lng === "number" && !Number.isNaN(data.lng)
          ? data.lng
          : defaultFormData.lng,
      lat:
        typeof data.lat === "number" && !Number.isNaN(data.lat)
          ? data.lat
          : defaultFormData.lat,
      voltage:
        typeof data.voltage === "number" && !Number.isNaN(data.voltage)
          ? data.voltage
          : defaultFormData.voltage,
      version:
        typeof data.version === "string"
          ? data.version
          : defaultFormData.version,
      service_area_id:
        typeof data.service_area_id === "string"
          ? data.service_area_id
          : defaultFormData.service_area_id,
      service_area_name:
        typeof data.service_area_name === "string"
          ? data.service_area_name
          : defaultFormData.service_area_name,
      serviceAreaInputMode:
        data.serviceAreaInputMode === "name" || data.serviceAreaInputMode === "id"
          ? data.serviceAreaInputMode
          : defaultFormData.serviceAreaInputMode,
      seat_locked:
        typeof data.seat_locked === "boolean" ? data.seat_locked : defaultFormData.seat_locked,
      power_exists:
        typeof data.power_exists === "boolean" ? data.power_exists : defaultFormData.power_exists,
      has_helmet:
        typeof data.has_helmet === "boolean" ? data.has_helmet : defaultFormData.has_helmet,
      helmet_react:
        typeof data.helmet_react === "boolean" ? data.helmet_react : defaultFormData.helmet_react,
      helmet_lock:
        typeof data.helmet_lock === "boolean" ? data.helmet_lock : defaultFormData.helmet_lock,
      tlv: typeof data.tlv === "string" ? data.tlv : defaultFormData.tlv,
    };
  } catch (_e) {
    return { ...defaultFormData };
  }
}

/** 服务区输入类型下拉选项 */
const serviceAreaInputModeOptions = [
  { label: "名称", value: "name" },
  { label: "ID", value: "id" },
];

/** env 下拉选项，可按需从接口或配置加载 */
const envOptions = [
  { label: "test2", value: "test2" },
  { label: "dev", value: "dev" },
  { label: "uat", value: "uat" },

  {
    label: 'prod',
    value: 'prod',
  },
  {
    label: 'prod2',
    value: 'prod2',
  },

  {
    label: "独立部署-云江出行",
    value: "yunjiang",
    tenantID: 1955,
  },
  {
    label: "独立部署-银川微公交",
    value: "yinchuan",
    tenantID: 1752,
  },
  {
    label: "独立部署-城发悠出行",
    value: "chengfayou",
    tenantID: 2233,
  },
  {
    label: "独立部署-圣庄出行",
    value: "shengzhuang",
    tenantID: 2654,
  },
  {
    label: "独立部署-北斗千行",
    value: "bdqx",
    tenantID: 2719,
  },
  {
    label: "独立部署-骑宜骑",
    value: "qiyiqi",
    tenantID: 250,
  },
  {
    label: "独立部署-飞凡",
    value: "feifan",
    tenantID: 2001,
  },
];

const formData = reactive(getInitialFormData());

/** 将当前表单保存到 localStorage */
function saveFormToStorage() {
  try {
    const payload: StoredForm = {
      env: formData.env,
      tenant_id: formData.tenant_id,
      imei: formData.imei,
      ref_imei: formData.ref_imei,
      lng: formData.lng,
      lat: formData.lat,
      voltage: formData.voltage,
      version: formData.version,
      service_area_id: formData.service_area_id,
      service_area_name: formData.service_area_name,
      serviceAreaInputMode: formData.serviceAreaInputMode,
      seat_locked: formData.seat_locked,
      power_exists: formData.power_exists,
      has_helmet: formData.has_helmet,
      helmet_react: formData.helmet_react,
      helmet_lock: formData.helmet_lock,
      tlv: formData.tlv,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_e) {
    // 忽略存储失败（如隐私模式）
  }
}

const createLoading = ref(false);
const updateLoading = ref(false);
const deleteLoading = ref(false);
const createError = ref("");
const connectId = ref("");
const cmdMap = ref<Record<string, string>>({});
const cmdLoadDone = ref(false);

/** 用于 Tab 展示与编辑的条目：key + 原始 value + 当前编辑 value */
interface CmdEntry {
  key: string;
  value: string;
  editValue: string;
}
const cmdEntries = ref<CmdEntry[]>([]);
/** 当前选中的 cmd tab name，关闭 tab 时切换到下一个 */
const activeCmdTab = ref("");

/** 若为合法 JSON 则格式化为缩进字符串，否则返回原串 */
function formatJsonIfPossible(str: string): string {
  if (!str || typeof str !== "string") return str;
  const trimmed = str.trim();
  if (!trimmed) return str;
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

/**
 * 去除 JSON 字符串中的反斜杠转义（如 \" -> "，\\ -> \，\n -> 换行等）
 * @param str - 可能包含转义字符的字符串
 * @returns 去除转义后的字符串，若处理异常则返回原串
 */
function unescapeJsonString(str: string): string {
  if (!str || typeof str !== "string") return str;
  try {
    return str.replace(/\\(.)/g, (_, c: string) => {
      const map: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      return map[c] ?? c;
    });
  } catch {
    return str;
  }
}

/** Cmd Tab 当前条目的 editValue：去除转义后写回 */
function applyCmdEntryUnescape(entry: CmdEntry) {
  entry.editValue = unescapeJsonString(entry.editValue ?? "");
}

/** Cmd Tab 当前条目的 editValue：格式化后写回 */
function applyCmdEntryFormat(entry: CmdEntry) {
  entry.editValue = formatJsonIfPossible(entry.editValue ?? "");
}

/** 新增命令弹窗 value：去除转义后写回 */
function applyAddFormUnescape() {
  const raw = addForm.value ?? "";
  addForm.value = unescapeJsonString(raw);
}

/** 新增命令弹窗 value：格式化后写回 */
function applyAddFormFormat() {
  const raw = addForm.value ?? "";
  addForm.value = formatJsonIfPossible(raw);
}

/** 从 cmdMap 同步到 cmdEntries，便于 tab 展示与编辑；值为 JSON 时格式化显示 */
function syncCmdEntries() {
  const map = cmdMap.value;
  const entries: CmdEntry[] = Object.keys(map).map((key) => {
    const raw = map[key];
    const formatted = formatJsonIfPossible(raw);
    return {
      key,
      value: raw,
      editValue: formatted,
    };
  });
  cmdEntries.value = entries;
  if (entries.length && !entries.some((e) => e.key === activeCmdTab.value)) {
    activeCmdTab.value = entries[0].key;
  }
}

/** TLV 协议文档 URL（小安 CMD_GPS_V6 状态上报） */
const TLV_PROTOCOL_DOC_URL =
  "https://xc-res.oss-cn-shenzhen.aliyuncs.com/protocol/sharing_bak%40%23%40%24/%E5%B0%8F%E5%AE%89%E7%A7%91%E6%8A%80%E5%85%B1%E4%BA%AB%E8%BD%A6%E6%9C%BA%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE(BIN_ALL).html#_cmd_gps_v6%E7%8A%B6%E6%80%81%E4%B8%8A%E6%8A%A5_cmd_68";

/** TLV 示例数据（插入到输入框） */
const TLV_EXAMPLE_JSON = [
  { type_hex: "0x0B", value_bin: "00001111" },
  { type: 15, value: "03" },
];

/**
 * 在新标签页打开 TLV 协议参考文档
 */
function openTlvProtocolDoc() {
  window.open(TLV_PROTOCOL_DOC_URL, "_blank", "noopener,noreferrer");
}

/**
 * 将 TLV 示例插入到表单输入框（格式化后的 JSON 字符串）
 */
function insertTlvExample() {
  formData.tlv = JSON.stringify(TLV_EXAMPLE_JSON, null, 4);
}

/**
 * 校验 TLV 表单字符串：非空时必须是合法的 JSON 数组。
 * @param raw - 用户输入的 JSON 字符串
 * @returns 校验通过返回 null，否则返回错误提示文案
 */
function validateTlvFormValue(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return "TLV数据必须为 JSON 数组格式";
    }
    return null;
  } catch {
    return "TLV数据 JSON 格式错误，请检查括号、逗号与引号";
  }
}

/**
 * 解析 TLV 表单字符串为数组，供接口使用。非法或空则返回 []。
 * @param raw - 用户输入的 JSON 字符串
 * @returns TLV 项数组
 */
function parseTlvFormValue(raw: string): unknown[] {
  if (!raw || typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 租户ID 仅允许数字，内部存为字符串 */
function onTenantIdInput(v: string | null) {
  const next = String(v ?? "").replace(/\D/g, "");
  formData.tenant_id = next;
}

/** 生成 15 位数字、以 868686 开头的随机 IMEI */
function randomImei() {
  let tail = "";
  for (let i = 0; i < 7; i++) {
    tail += Math.floor(Math.random() * 10);
  }
  formData.imei = `86868686${tail}`;
}

/** 「模拟头盔」开关变化时：打开则下面两项默认打开，关闭则下面两项也关闭 */
function onHasHelmetChange(val: boolean) {
  if (val) {
    formData.helmet_react = true;
    formData.helmet_lock = true;
  } else {
    formData.helmet_react = false;
    formData.helmet_lock = false;
  }
}

/** 创建 mock 连接 */
async function handleCreate() {
  if (!formData.env || !formData.tenant_id?.trim() || !formData.imei?.trim()) {
    message.error("请填写 环境、租户ID、IMEI");
    return;
  }
  const imei = formData.imei.trim();
  const refImei = formData.ref_imei?.trim();
  if (refImei && refImei === imei) {
    message.error("参考IMEI不能和 IMEI 填一样");
    return;
  }
  const tlvError = validateTlvFormValue(formData.tlv);
  if (tlvError) {
    message.error(tlvError);
    return;
  }
  createLoading.value = true;
  createError.value = "";
  try {
    const payload: Record<string, unknown> = {
      env: formData.env,
      tenant_id: formData.tenant_id.trim(),
      imei,
      voltage: formData.voltage ?? 55,
      version: formData.version || "1.2.3",
    };
    if (refImei) {
      payload.ref_imei = refImei;
    }
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.serviceAreaInputMode === "name" && formData.service_area_name?.trim()) {
      payload.service_area_name = formData.service_area_name.trim();
    } else if (formData.service_area_id?.trim()) {
      payload.service_area_id = formData.service_area_id.trim();
    }
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;
    payload.tlv = parseTlvFormValue(formData.tlv);

    const res: any = await xiaoanEcuMockCreateAPI(payload);
    if (!checkResCode(res)) return;
    const data = res?.data;
    let id = "";
    if (typeof data === "string") {
      id = data;
    } else if (data && typeof data.connect_id === "string") {
      id = data.connect_id;
    } else if (data && typeof data === "object") {
      id = data.connect_id ?? "";
    }
    if (!id) {
      message.error("返回中未包含 connect_id");
      return;
    }
    connectId.value = id;
    await fetchCmdAll();
    saveFormToStorage();
    message.success(`模拟中控成功`);
  } catch (e: any) {
    createError.value = e?.message || String(e) || "创建失败";
    message.error(createError.value);
  } finally {
    createLoading.value = false;
  }
}

/** 更新 mock 数据（经度、纬度、电压、版本、座舱锁、电源在位） */
async function handleUpdate() {
  if (!connectId.value) return;
  const tlvError = validateTlvFormValue(formData.tlv);
  if (tlvError) {
    message.error(tlvError);
    return;
  }
  updateLoading.value = true;
  try {
    const payload: Record<string, unknown> = {
      connect_id: connectId.value,
      bin68_immediately: true,
    };
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.voltage != null) payload.voltage = formData.voltage;
    if (formData.version != null && formData.version !== "")
      payload.version = formData.version;
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;
    payload.tlv = parseTlvFormValue(formData.tlv);
    const res: any = await xiaoanEcuMockUpdateAPI(payload);
    if (!checkResCode(res)) return;
    saveFormToStorage();
    message.success("更新模拟数据成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "更新失败");
  } finally {
    updateLoading.value = false;
  }
}

/** 断开 mock 连接：无论接口成功或失败都重置连接与 cmd 状态 */
async function handleDisconnect() {
  if (!connectId.value) return;
  deleteLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockDeleteAPI({ connect_id: connectId.value });
    if (checkResCode(res)) {
      message.success(`已断开连接`);
    } else {
      message.error("断开请求失败");
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "断开失败");
  } finally {
    connectId.value = "";
    cmdMap.value = {};
    cmdEntries.value = [];
    cmdLoadDone.value = false;
    moveRecordList.value = [];
    deleteLoading.value = false;
  }
}

/** 拉取所有 mock 命令数据 */
async function fetchCmdAll() {
  if (!connectId.value) return;
  cmdLoadDone.value = false;
  try {
    const res: any = await xiaoanEcuMockCmdAllAPI({
      connect_id: connectId.value,
    });
    if (!checkResCode(res)) {
      cmdMap.value = {};
      syncCmdEntries();
      return;
    }
    const data = res?.data;
    cmdMap.value =
      data && typeof data === "object" && !Array.isArray(data) ? { ...data } : {};
    syncCmdEntries();
  } catch (e: any) {
    message.error(e?.message || String(e) || "获取命令数据失败");
    cmdMap.value = {};
    syncCmdEntries();
  } finally {
    cmdLoadDone.value = true;
  }
}

/** 保存单条命令（修改） */
async function saveCmd(entry: CmdEntry) {
  if (!connectId.value) return;
  try {
    const res: any = await xiaoanEcuMockCmdSetAPI({
      connect_id: connectId.value,
      cmd: entry.key,
      value: entry.editValue,
    });
    if (!checkResCode(res)) return;
    entry.value = entry.editValue;
    cmdMap.value = { ...cmdMap.value, [entry.key]: entry.editValue };
    message.success("保存成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "保存失败");
  }
}

const showAddModal = ref(false);
const addForm = reactive({ cmd: "", value: "" });

const showMoveModal = ref(false);
const moveForm = reactive({ bearing: 0, distance: 100 });
const moveLoading = ref(false);
/** 连续向北移动次数，用于彩蛋 */
const consecutiveNorthCount = ref(0);

/** 移动记录项：日期时间、方向文案、距离(米)、方向箭头 */
interface MoveRecord {
  dateTime: string;
  bearingLabel: string;
  distance: number;
  arrow: string;
}
const moveRecordList = ref<MoveRecord[]>([]);

/** 格式化为 2025.10.1 12:23:59 */
function formatMoveRecordDateTime(d: Date): string {
  const y = d.getFullYear();
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}.${M}.${D} ${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** 方位角转展示文案：0 北 90 东 180 南 270 西，其余为 45° */
function getBearingLabel(bearing: number): string {
  const map: Record<number, string> = {
    0: "北",
    90: "东",
    180: "南",
    270: "西",
  };
  return map[bearing] ?? `${bearing}°`;
}

/** 方位角转方向箭头：北↑ 东→ 南↓ 西←，其余用 ↗ */
function getBearingArrow(bearing: number): string {
  const map: Record<number, string> = {
    0: "↑",
    90: "→",
    180: "↓",
    270: "←",
  };
  return map[bearing] ?? "↗";
}

/** 打开手动移动弹窗，默认选中北(0°) */
function openMoveModal() {
  moveForm.bearing = 0;
  showMoveModal.value = true;
}

/** 手动移动：调用接口后 toast 提示，不关闭弹窗 */
async function handleMoveSubmit(): Promise<boolean> {
  if (!connectId.value) return false;
  moveLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockMoveAPI({
      connect_id: connectId.value,
      bearing: Number(moveForm.bearing) || 0,
      distance: Number(moveForm.distance) || 0,
      bin68_immediately: true,
    });
    if (!checkResCode(res)) return false;
    const data = res?.data;
    if (data?.new) {
      const parts = String(data.new).split(",");
      if (parts.length >= 2) {
        const nLng = Number.parseFloat(parts[0].trim());
        const nLat = Number.parseFloat(parts[1].trim());
        if (!Number.isNaN(nLng)) formData.lng = nLng;
        if (!Number.isNaN(nLat)) formData.lat = nLat;
      }
    }
    const bearing = Number(moveForm.bearing) || 0;
    const distance = Number(moveForm.distance) || 0;
    moveRecordList.value.unshift({
      dateTime: formatMoveRecordDateTime(new Date()),
      bearingLabel: getBearingLabel(bearing),
      distance,
      arrow: getBearingArrow(bearing),
    });
    if (bearing === 0) {
      consecutiveNorthCount.value += 1;
      if (consecutiveNorthCount.value >= 3) {
        message.success("触发彩蛋：我一路向北~ 离开有你的季节~");
        consecutiveNorthCount.value = 0;
      } else {
        if (data?.old != null && data?.new != null) {
          message.success(`已移动`);
        } else {
          message.success("移动成功");
        }
      }
    } else {
      consecutiveNorthCount.value = 0;
      if (data?.old != null && data?.new != null) {
        message.success(`已移动：${data.old} → ${data.new}`);
      } else {
        message.success("移动成功");
      }
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "移动失败");
  } finally {
    moveLoading.value = false;
  }
  return false;
}

/* ========== 模拟轨迹 ========== */
const showTrackModal = ref(false);
const trackText = ref("");
const trackLoading = ref(false);

/** 打开模拟轨迹弹窗 */
function openTrackModal() {
  showTrackModal.value = true;
}

/**
 * 根据起点坐标、方位角、距离计算新坐标（GCJ02 近似）
 * @param lng 起点经度
 * @param lat 起点纬度
 * @param bearing 方位角（度，0=北 90=东 180=南 270=西）
 * @param distance 距离（米）
 * @returns [新经度, 新纬度]
 */
function offsetCoord(lng: number, lat: number, bearing: number, distance: number): [number, number] {
  const R = 6371000;
  const rad = Math.PI / 180;
  const bearingRad = bearing * rad;
  const latRad = lat * rad;
  const dLat = (distance * Math.cos(bearingRad)) / R;
  const dLng = (distance * Math.sin(bearingRad)) / (R * Math.cos(latRad));
  return [
    Math.round((lng + dLng / rad) * 1000000) / 1000000,
    Math.round((lat + dLat / rad) * 1000000) / 1000000,
  ];
}

/** 添加示例：模拟电动车骑行轨迹，大体沿一个方向前进，小幅度转弯 */
function generateSampleTrack() {
  let lng = formData.lng ?? 114.397428;
  let lat = formData.lat ?? 39.90923;
  const lines: string[] = [`${lng},${lat}`];
  let bearing = Math.random() * 360;
  for (let i = 1; i < 12; i++) {
    const delta = (Math.random() - 0.5) * 30;
    bearing = (bearing + delta + 360) % 360;
    const dist = 30 + Math.random() * 20;
    [lng, lat] = offsetCoord(lng, lat, bearing, dist);
    lines.push(`${lng},${lat}`);
  }
  trackText.value = lines.join("\n");
}

/**
 * 解析轨迹文本为坐标数组
 * @returns 坐标数组 { lng, lat }[]
 */
function parseTrackPoints(): Array<{ lng: number; lat: number }> {
  return trackText.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      return { lng: Number.parseFloat(parts[0]), lat: Number.parseFloat(parts[1]) };
    })
    .filter((p) => !Number.isNaN(p.lng) && !Number.isNaN(p.lat));
}

/** 提交模拟轨迹：内容为空时清除轨迹，否则设置轨迹坐标列表 */
async function handleTrackStart() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const points = parseTrackPoints();
  trackLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockTrajectoryAPI({
      connect_id: connectId.value,
      points,
    });
    if (!checkResCode(res)) return;
    if (points.length === 0) {
      message.success("轨迹已清除");
    } else {
      message.success(res?.data || `轨迹已设置，共 ${points.length} 个坐标点`);
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "轨迹设置失败");
  } finally {
    trackLoading.value = false;
  }
}

function openAddCmd() {
  addForm.cmd = "";
  addForm.value = '{"code":0}';
  showAddModal.value = true;
}

function confirmAddCmd() {
  const key = addForm.cmd?.trim();
  if (!key) {
    message.error("请输入 cmd");
    return false;
  }
  if (cmdMap.value[key] !== undefined) {
    message.error("该 cmd 已存在，请直接在修改");
    return false;
  }
  cmdEntries.value.push({
    key,
    value: addForm.value,
    editValue: addForm.value,
  });
  cmdMap.value = { ...cmdMap.value, [key]: addForm.value };
  saveCmd(cmdEntries.value[cmdEntries.value.length - 1]);
  showAddModal.value = false;
  return true;
}

/** 关闭 Tab：从当前列表中移除，并调用 set 置空以在服务端删除；若关闭的是当前 tab 则切换到下一个 */
async function handleCloseTab(name: string) {
  const idx = cmdEntries.value.findIndex((e) => e.key === name);
  if (idx === -1) return;
  const entry = cmdEntries.value[idx];
  const wasActive = name === activeCmdTab.value;
  cmdEntries.value.splice(idx, 1);
  const nextKey =
    cmdEntries.value[idx]?.key ?? cmdEntries.value[idx - 1]?.key ?? "";
  if (wasActive) activeCmdTab.value = nextKey;
  const next: Record<string, string> = { ...cmdMap.value };
  delete next[name];
  cmdMap.value = next;
  if (connectId.value) {
    try {
      const res: any = await xiaoanEcuMockCmdSetAPI({
        connect_id: connectId.value,
        cmd: name,
        value: "",
      });
      if (!checkResCode(res)) {
        cmdEntries.value.splice(idx, 0, entry);
        cmdMap.value = { ...cmdMap.value, [name]: entry.value };
        if (wasActive) activeCmdTab.value = name;
      }
    } catch {
      cmdEntries.value.splice(idx, 0, entry);
      cmdMap.value = { ...cmdMap.value, [name]: entry.value };
      if (wasActive) activeCmdTab.value = name;
    }
  }
}

</script>

<style lang="less" scoped>
.xiaoan-ecu-mock {
  width: 100%;
  margin: 0;

  :deep(.n-card) {
    padding: 16px;
  }
}

/* 连接成功时：整卡绿色追随转圈边框动画 */
.card-wrap {
  border-radius: 8px;
}

.card-wrap-reporting {
  border-radius: 10px;
  border: 2px solid transparent;
  background: linear-gradient(var(--card-bg, #fff), var(--card-bg, #fff)) padding-box,
    conic-gradient(from var(--border-angle, 0deg),
      #22c55e 0deg,
      #22c55e 90deg,
      transparent 90deg) border-box;
  background-origin: border-box;
  background-repeat: no-repeat;
  animation: border-angle-spin 5s linear infinite;
}

.card-wrap-reporting :deep(.n-card) {
  border-radius: 6px;
}

@property --border-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes border-angle-spin {
  to {
    --border-angle: 360deg;
  }
}

.form-section {
  max-width: 960px;
}

.form-section :deep(.n-form-item) {
  margin-bottom: 2px;
}

.form-section .form-item-buttons {
  margin-top: 6px;
  margin-bottom: 0;
}

/* 模拟成功后的只读输入框：灰底只读样式，可选中、可复制 */
.form-section .input-readonly-gray :deep(.n-input__input-el) {
  cursor: text;
  user-select: text;
  min-width: 0;
  background-color: #f3f4f6 !important;
  color: #6b7280;
}

.form-section .input-readonly-gray :deep(.n-input-wrapper) {
  background-color: #f3f4f6 !important;
}

.imei-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.imei-row .n-input {
  flex: 1;
  min-width: 0;
}

.service-area-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.service-area-row .service-area-type-select {
  width: 70px;
  flex-shrink: 0;
}
.service-area-row .service-area-input {
  flex: 1;
  min-width: 0;
}

.tip-icon {
  vertical-align: middle;
  cursor: help;
  color: #999;
}

.tlv-input-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.tlv-input-row .tlv-textarea {
  flex: 1;
  min-width: 0;
  font-size: 11px;
}

.tlv-input-row .tlv-textarea :deep(.n-input__input-el),
.tlv-input-row .tlv-textarea :deep(textarea) {
  font-size: 11px;
}

.tlv-input-row .tlv-btns {
  flex-shrink: 0;
}

.move-compass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.move-compass .compass-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.move-compass .compass-cell {
  width: 72px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.move-compass .compass-input-wrap {
  width: 72px;
  min-width: 72px;
  display: flex;
  justify-content: center;
}

.move-compass .compass-bearing-input {
  width: 100%;
}

.move-compass .compass-bearing-input :deep(.n-input__input-el) {
  text-align: center;
}

/* 方位选项：卡片式，非按钮，选中态为绿色 */
.move-compass .compass-option {
  min-width: 72px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.move-compass .compass-option:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.move-compass .compass-option-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  flex-shrink: 0;
  transition: border-color 0.2s, background-color 0.2s;
}

/* 选中后显示绿色 */
.move-compass .compass-option-selected {
  border-color: #22c55e;
  background: #dcfce7;
  color: #15803d;
}

.move-compass .compass-option-selected .compass-option-dot {
  border-color: #22c55e;
  background: #22c55e;
}

.move-compass .compass-option-selected:hover {
  border-color: #16a34a;
  background: #bbf7d0;
}

/* 模拟移动弹窗 - 移动记录列表 */
.move-record-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

.move-record-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.move-record-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
}

.move-record-item {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.move-record-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 14px;
  color: #15803d;
  flex-shrink: 0;
}

.move-record-time {
  color: #6b7280;
}

.move-record-bearing {
  color: #15803d;
}

.move-record-distance {
  color: #1d4ed8;
}

.move-record-empty {
  font-size: 13px;
  color: #9ca3af;
}

.error-block {
  margin-top: 12px;
  max-width: 960px;
}

.cmd-section {
  margin-top: 20px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.cmd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cmd-section-title {
  font-weight: 600;
  font-size: 14px;
}

/* tab 标签：名称在左，删除图标绝对定位到最右侧，减少误触 */
.cmd-tab-label {
  display: inline-flex;
  align-items: center;
  position: relative;
  padding-right: 26px;
  min-width: 100%;
  box-sizing: border-box;
}

.cmd-tab-label .cmd-tab-close-wrap {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.cmd-tab-label .cmd-tab-close-btn {
  color: #9ca3af;
  width: 22px;
  height: 22px;
  min-width: 22px;
  padding: 0;
}

.cmd-tab-label .cmd-tab-close-btn:hover {
  color: #6b7280;
}

.cmd-pane-content {
  padding: 12px 0;
}

/* JSON 输入框右上角操作按钮容器 */
.json-input-wrap {
  position: relative;
  margin-bottom: 8px;
  width: 100%;
}

.json-input-wrap .json-input-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.json-input-wrap .cmd-textarea {
  margin-bottom: 0;
}

.cmd-textarea {
  margin-bottom: 8px;
  font-family: "Consolas", "Monaco", "Menlo", "Ubuntu Mono", monospace;
  line-height: 0.9;
}

.cmd-json-display {
  font-size: 12px;
  line-height: 0.9;
}

.cmd-json-display :deep(textarea) {
  font-family: "Consolas", "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 0.9;
  min-height: 60vh;
  resize: vertical;
}

.cmd-empty,
.cmd-loading {
  padding: 24px;
  text-align: center;
  color: #999;
}

.cmd-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 轨迹输入框容器，右上角放清除按钮 */
.track-input-wrap {
  position: relative;
  width: 100%;
}

.track-clear-btn {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 1;
  color: #9ca3af;
}

.track-clear-btn:hover {
  color: #f56c6c;
}
</style>
