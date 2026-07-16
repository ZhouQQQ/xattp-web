<template>
  <div class="rental-ecu-mock">
    <div class="card-wrap" :class="{ 'card-wrap-reporting': connectId }">
      <n-card>
        <div class="form-section">
          <n-form :model="formData" label-placement="left" label-width="140px">
            <n-grid :cols="2" :x-gap="12" :y-gap="2">
              <n-gi :span="2">
                <div class="gateway-config-row">
                  <n-form-item label="类型" path="target_mode" required class="target-mode-item">
                    <n-select
                      v-model:value="formData.target_mode"
                      :options="targetModeOptions"
                      :disabled="!!connectId"
                      :clearable="false"
                      placeholder="请选择设备网关"
                      style="width: 220px"
                    />
                  </n-form-item>
                  <n-form-item
                    v-if="formData.target_mode === 'env'"
                    label="环境"
                    path="env"
                    required
                    class="gateway-target-item"
                  >
                    <n-radio-group v-model:value="formData.env" :disabled="!!connectId" name="env">
                      <n-space>
                        <n-radio v-for="opt in envRadioOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </n-radio>
                      </n-space>
                    </n-radio-group>
                  </n-form-item>
                  <n-form-item v-else label="网关地址" path="server" required class="gateway-target-item">
                    <n-input
                      v-model:value="formData.server"
                      placeholder="请输入设备网关地址"
                      clearable
                      size="small"
                      style="width: 620px"
                      :readonly="!!connectId"
                      :class="{ 'input-readonly-gray': connectId }"
                    />
                  </n-form-item>
                </div>
              </n-gi>
              <n-gi :span="2">
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
                          随机
                        </n-button>
                      </template>
                      随机
                    </n-tooltip>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="2">
                <n-grid :cols="24" :x-gap="8">
                  <n-gi :span="11">
                    <n-form-item path="lng">
                      <template #label>
                        <span>经度(GCJ02)</span>
                      </template>
                      <n-input-number v-model:value="formData.lng" placeholder="经度" size="small" clearable
                        :show-button="false" style="width: 100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi :span="11">
                    <n-form-item path="lat">
                      <template #label>
                        <span>纬度(GCJ02)</span>
                      </template>
                      <n-input-number v-model:value="formData.lat" placeholder="纬度" size="small" clearable
                        :show-button="false" style="width: 100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi :span="2">
                    <n-form-item label="" :label-width="0" class="coord-reset-item">
                      <div class="coord-reset-row">
                        <n-button
                          size="small"
                          type="default"
                          title="重置经纬度到武汉留学生创业园"
                          @click="resetDefaultCoords"
                        >
                          重置经纬度
                        </n-button>
                      </div>
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-gi>
              <n-gi>
                <n-form-item label="电压（v）" path="voltage">
                  <n-input-number v-model:value="formData.voltage" placeholder="默认 55" size="small" :min="0"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi>
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
              <n-gi>
                <n-form-item label="电池SN" path="battery_sn">
                  <n-input v-model:value="formData.battery_sn" placeholder="选填，可清除" clearable size="small"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="电池SOC" path="battery_soc">
                  <div class="battery-soc-row">
                    <n-slider v-model:value="formData.battery_soc" :min="0" :max="100" :step="1" size="small"
                      :disabled="!formData.battery_sn?.trim()"
                      style="flex: 1; margin-right: 12px" />
                    <n-input-number v-model:value="formData.battery_soc" :min="0" :max="100" :show-button="false"
                      size="small" style="width: 72px" placeholder="SOC" :disabled="!formData.battery_sn?.trim()" />
                    <span class="soc-unit">%</span>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="电源状态" path="power_exists">
                  <n-space :size="8" align="center">
                    <span class="switch-label">断开</span>
                    <n-switch v-model:value="formData.power_exists" size="small" />
                    <span class="switch-label">连接</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="座舱锁状态" path="seat_locked">
                  <n-space :size="8" align="center">
                    <span class="switch-label">开启</span>
                    <n-switch v-model:value="formData.seat_locked" size="small" />
                    <span class="switch-label">关闭</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi :span="2" class="helmet-row">
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
            </n-grid>
            <n-form-item class="form-item-buttons">
              <template v-if="!connectId">
                <n-button type="primary" :loading="createLoading" @click="handleCreate">
                  开始模拟
                </n-button>
              </template>
              <template v-else>
                <div class="create-actions-row">
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
                    <template #icon>
                      <n-icon :component="Gps" :size="18" />
                    </template>
                    手动移动
                  </n-button>
                  <n-button type="default" @click="openTrackModal">
                    模拟轨迹
                  </n-button>
                  <n-button type="default" @click="openBin5Modal">
                    Bin5上报
                  </n-button>
                  </n-space>
                  <n-button
                    v-if="formData.target_mode === 'env'"
                    type="default"
                    :loading="batchAddLoading"
                    @click="openBatchAddModal"
                    class="batch-add-right-btn"
                  >
                    入库车辆
                  </n-button>
                </div>
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
                <n-input v-model:value="entry.editValue" v-fit-textarea-height type="textarea" placeholder="JSON 字符串"
                  class="cmd-textarea cmd-json-display" :input-props="{ spellcheck: false, autocomplete: 'off' }" />
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

    <!-- Bin5 告警上报弹窗 -->
    <n-modal v-model:show="showBin5Modal" preset="dialog" title="Bin5 告警上报" :mask-closable="false" style="width: 640px">
      <template #action>
        <n-button type="primary" :loading="bin5Loading" @click="handleBin5Submit">
          上报
        </n-button>
      </template>
      <n-form label-placement="top" label-width="auto">
        <n-form-item label="告警类型 (alarm_type)">
          <n-select
            v-model:value="bin5Form.alarm_type"
            :options="bin5AlarmTypeOptions"
            filterable
            tag
            clearable
            placeholder="选择或输入告警值"
            size="small"
            :consistent-menu-width="false"
            style="width: 100%"
          />
        </n-form-item>
        <n-button text type="primary" size="small" @click="openBin5ProtocolDoc">
          参考文档：CMD_5 上报通知
        </n-button>
      </n-form>
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
        <n-form-item label="轨迹点">
          <div class="track-input-wrap">
            <n-input v-model:value="trackText" type="textarea" :rows="12" size="small"
              placeholder="每行一个坐标，格式：经度,纬度&#10;为空时提交将清除轨迹"
              :disabled="trackLoading" style="width: 100%" />
            <n-button v-if="trackText.trim()" text size="small" class="track-clear-btn"
              @click="trackText = ''">
              清除
            </n-button>
          </div>
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 上次模拟可能未停止提示 -->
    <n-modal v-model:show="showPrevMockModal" :mask-closable="true" style="width: 340px">
      <div class="gif-tip-modal">
        <img :src="baojiGif" alt="上次模拟可能未停止" class="gif-tip-img" />
        <div class="gif-tip-text">你的上一个模拟停止了吗？</div>
        <div class="gif-tip-sub">请及时关闭，避免占用连接资源</div>
        <n-button type="primary" size="small" @click="showPrevMockModal = false">知道了</n-button>
      </div>
    </n-modal>

    <!-- 新增 Cmd 弹窗 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="新增命令" positive-text="确定"
      @positive-click="confirmAddCmd">
      <n-form :model="addForm" label-width="80px">
        <n-form-item label="cmd" path="cmd" required>
          <n-input v-model:value="addForm.cmd" placeholder="如 31、34" size="small" />
        </n-form-item>
        <n-form-item label="value" path="value">
          <n-input v-model:value="addForm.value" v-fit-textarea-height type="textarea" :rows="6" size="small"
            placeholder="JSON 字符串" class="cmd-textarea cmd-json-display"
            :input-props="{ spellcheck: false, autocomplete: 'off' }" />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 短租批量入库弹窗 -->
    <n-modal
      v-model:show="showBatchAddModal"
      preset="card"
      title="短租-入库车辆"
      :mask-closable="!batchAddLoading"
      style="width: 760px"
    >
      <n-form :model="batchAddForm" label-placement="left" label-width="110px">
        <n-form-item label="环境" required>
          <n-select
            v-model:value="batchAddForm.env"
            :options="batchAddEnvOptions"
            filterable
            :clearable="false"
            :disabled="true"
            placeholder="请选择环境"
          />
        </n-form-item>
        <n-form-item label="IMEI" required>
          <n-input
            v-model:value="batchAddForm.imei"
            placeholder="IMEI（15 位数字，以 86 开头）"
            clearable
            :readonly="true"
            :class="{ 'input-readonly-gray': true }"
          />
        </n-form-item>
        <n-form-item label="租户" required>
          <n-select
            v-model:value="batchAddForm.tenant_id"
            :options="batchAddTenantOptions"
            :loading="batchAddTenantLoading"
            filterable
            clearable
            placeholder="请选择租户"
          />
        </n-form-item>
        <n-form-item label="加盟商" required>
          <n-select
            v-model:value="batchAddForm.custom_id"
            :options="batchAddFranchiseeOptions"
            :loading="batchAddFranchiseeLoading"
            filterable
            clearable
            placeholder="请选择加盟商"
          />
        </n-form-item>
        <n-form-item label="门店" required>
          <n-select
            v-model:value="batchAddForm.shop_id"
            :options="batchAddShopOptions"
            :loading="batchAddShopLoading"
            filterable
            clearable
            placeholder="请选择门店"
          />
        </n-form-item>
        <n-form-item label="车型" required>
          <n-select
            v-model:value="batchAddForm.vehicle_model_id"
            :options="batchAddVehicleModelOptions"
            :loading="batchAddVehicleModelLoading"
            filterable
            clearable
            placeholder="请选择车型"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button :disabled="batchAddLoading" @click="showBatchAddModal = false">取消</n-button>
          <n-button type="primary" :loading="batchAddLoading" @click="handleBatchAddSubmit">确认入库</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "RentalEcuMock" });

import { ref, reactive, nextTick, computed, watch } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Help, Gps, Trash, Dice } from "@vicons/tabler";
import baojiGif from "@/assets/image/baoji.gif";
import {
  getRentalEnvListAPI,
  rentalBusinessAddEbikeAPI,
  rentalBusinessFranchiseeAllAPI,
  rentalBusinessTenantAllAPI,
  rentalBusinessVehicleModelAllAPI,
  rentalEcuMockAddAPI,
  xiaoanEcuMockCmdAllAPI,
  xiaoanEcuMockCmdSetAPI,
  xiaoanEcuMockDeleteAPI,
  xiaoanEcuMockUpdateAPI,
  xiaoanEcuMockMoveAPI,
  xiaoanEcuMockTrajectoryAPI,
  xiaoanEcuMockBin5API,
} from "@/api/device";
import {
  bin5AlarmTypeOptions,
  BIN5_PROTOCOL_DOC_URL,
  parseBin5AlarmType,
} from "@/tools/ecu-mock/bin5-alarm-types";

const { message } = createDiscreteApi(["message"]);
const DEFAULT_COORD_LNG = 114.434888;
const DEFAULT_COORD_LAT = 30.500136;

/** 校验接口返回 code，不为 0 时 toast 返回的 msg 并返回 false */
function checkResCode(res: any): boolean {
  if (res != null && Number(res.code) !== 0) {
    message.error(res.msg || "请求失败");
    return false;
  }
  return true;
}

/** 获取有滚动条的第一个祖先 */
function getScrollParent(node: Element | null): Element | null {
  let p = node?.parentElement ?? null;
  while (p) {
    const { overflowY } = getComputedStyle(p);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return p;
    p = p.parentElement;
  }
  return null;
}

/** 使 n-input textarea 随内容增高，减少滚动；调整时保持滚动位置，避免点击编辑时窗口跳动 */
function fitTextareaHeight(el: HTMLElement) {
  const textarea = el.tagName === "TEXTAREA" ? (el as HTMLTextAreaElement) : el.querySelector("textarea");
  if (!textarea) return;
  const winScrollY = window.scrollY ?? document.documentElement.scrollTop;
  const textareaScrollTop = textarea.scrollTop;
  const scrollParent = getScrollParent(textarea);
  const parentScrollTop = scrollParent ? scrollParent.scrollTop : 0;
  nextTick(() => {
    const ta = el.tagName === "TEXTAREA" ? (el as HTMLTextAreaElement) : el.querySelector("textarea");
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 200)}px`;
    ta.scrollTop = textareaScrollTop;
    if (scrollParent) scrollParent.scrollTop = parentScrollTop;
    window.scrollTo({ top: winScrollY, behavior: "auto" });
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

const STORAGE_KEY = "XATTP_RENTAL_ECU_MOCK_FORM";

/** 模拟成功后写入；停止模拟后清除。下次创建时若仍存在则提示（不拦截） */
const ACTIVE_MOCK_FLAG_KEY = "XATTP_RENTAL_ECU_MOCK_ACTIVE";
const showPrevMockModal = ref(false);

function hasActiveMockFlag(): boolean {
  try {
    return localStorage.getItem(ACTIVE_MOCK_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function setActiveMockFlag() {
  try {
    localStorage.setItem(ACTIVE_MOCK_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

function clearActiveMockFlag() {
  try {
    localStorage.removeItem(ACTIVE_MOCK_FLAG_KEY);
  } catch {
    // ignore
  }
}

function warnIfPrevMockPossiblyActive() {
  if (hasActiveMockFlag()) {
    showPrevMockModal.value = true;
  }
}

/** 表单持久化结构（与 formData 字段一致，用于 localStorage） */
interface StoredForm {
  target_mode?: "env" | "server";
  env?: string;
  server?: string;
  imei?: string;
  lng?: number | null;
  lat?: number | null;
  voltage?: number | null;
  battery_sn?: string;
  battery_soc?: number | null;
  version?: string;
  seat_locked?: boolean;
  power_exists?: boolean;
  has_helmet?: boolean;
  helmet_react?: boolean;
  helmet_lock?: boolean;
}

/** 默认表单值 */
const defaultFormData = {
  target_mode: "env" as "env" | "server",
  env: "test",
  server: "",
  imei: "",
  lng: 114.434888,
  lat: 30.500136,
  voltage: 55,
  battery_sn: "",
  version: "1.2.3",
  seat_locked: true,
  power_exists: true,
  has_helmet: false,
  helmet_react: false,
  helmet_lock: false,
};

/** 从 localStorage 读取并合并为初始表单（用于首屏回显，刷新/进入页面时执行一次） */
function getInitialFormData(): typeof defaultFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultFormData };
    const data = JSON.parse(raw) as StoredForm;
    return {
      target_mode:
        data.target_mode === "server" || data.target_mode === "env"
          ? data.target_mode
          : defaultFormData.target_mode,
      env:
        typeof data.env === "string" && data.env.trim()
          ? data.env.trim()
          : defaultFormData.env,
      server:
        typeof data.server === "string" ? data.server : defaultFormData.server,
      imei:
        typeof data.imei === "string" ? data.imei : defaultFormData.imei,
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
      battery_sn:
        typeof data.battery_sn === "string" ? data.battery_sn : defaultFormData.battery_sn,
      battery_soc:
        typeof data.battery_soc === "number" &&
        !Number.isNaN(data.battery_soc) &&
        data.battery_soc >= 0 &&
        data.battery_soc <= 100
          ? data.battery_soc
          : defaultFormData.battery_soc,
      version:
        typeof data.version === "string"
          ? data.version
          : defaultFormData.version,
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
    };
  } catch (_e) {
    return { ...defaultFormData };
  }
}

/** 环境 radio 选项：test 默认，dev/uat/prod */
const envRadioOptions = [
  { label: "test", value: "test" },
  { label: "dev", value: "dev" },
  { label: "uat", value: "uat" },
  { label: "prod", value: "prod" },
];
const targetModeOptions = [
  { label: "选择环境", value: "env" },
  { label: "指定网关", value: "server" },
];

const formData = reactive(getInitialFormData());

/** 将当前表单保存到 localStorage */
function saveFormToStorage() {
  try {
    const payload: StoredForm = {
      target_mode: formData.target_mode,
      env: formData.env,
      server: formData.server,
      imei: formData.imei,
      lng: formData.lng,
      lat: formData.lat,
      voltage: formData.voltage,
      battery_sn: formData.battery_sn,
      battery_soc: formData.battery_soc,
      version: formData.version,
      seat_locked: formData.seat_locked,
      power_exists: formData.power_exists,
      has_helmet: formData.has_helmet,
      helmet_react: formData.helmet_react,
      helmet_lock: formData.helmet_lock,
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

interface BatchAddFormData {
  env: string;
  tenant_id: string;
  tenant_name: string;
  custom_id: string;
  shop_id: string;
  vehicle_model_id: string;
  imei: string;
}
const showBatchAddModal = ref(false);
const batchAddLoading = ref(false);
const batchAddTenantLoading = ref(false);
const batchAddFranchiseeLoading = ref(false);
const batchAddShopLoading = ref(false);
const batchAddVehicleModelLoading = ref(false);
const batchAddForm = reactive<BatchAddFormData>({
  env: "",
  tenant_id: "",
  tenant_name: "",
  custom_id: "",
  shop_id: "",
  vehicle_model_id: "",
  imei: "",
});
const batchAddEnvOptions = ref<Array<{ label: string; value: string }>>([]);
const batchAddTenantOptions = ref<Array<{ label: string; value: string }>>([]);
const batchAddFranchiseeOptions = ref<Array<{ label: string; value: string }>>([]);
const batchAddShopOptions = ref<Array<{ label: string; value: string }>>([]);
const batchAddVehicleModelOptions = ref<Array<{ label: string; value: string }>>([]);
const batchAddFranchiseeShopMap = ref<Record<string, Array<{ label: string; value: string }>>>({});
const batchAddImei = computed(() => String(batchAddForm.imei || "").trim());

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

/** 生成 15 位数字、以 868686 开头的随机 IMEI */
function randomImei() {
  let tail = "";
  for (let i = 0; i < 7; i++) {
    tail += Math.floor(Math.random() * 10);
  }
  formData.imei = `86868686${tail}`;
}

function resetDefaultCoords() {
  formData.lng = DEFAULT_COORD_LNG;
  formData.lat = DEFAULT_COORD_LAT;
  saveFormToStorage();
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

function extractIdAndName(
  item: Record<string, unknown>,
  idKeys: string[],
  nameKeys: string[],
): { id: string; name: string } {
  const id = idKeys.map((key) => String(item[key] ?? "").trim()).find((v) => !!v) || "";
  const name = nameKeys.map((key) => String(item[key] ?? "").trim()).find((v) => !!v) || id;
  return { id, name };
}

function parseShopOptionsFromFranchisee(franchisee: Record<string, unknown>): Array<{ label: string; value: string }> {
  const candidateKeys = ["shopList", "shop_list", "shops", "storeList", "store_list", "shopInfos"];
  const raw = candidateKeys
    .map((key) => franchisee[key])
    .find((value) => Array.isArray(value)) as unknown[] | undefined;
  if (!raw) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const { id, name } = extractIdAndName(
        obj,
        ["id", "shopId", "shop_id", "storeId", "store_id"],
        ["name", "shopName", "shop_name", "storeName", "store_name"],
      );
      if (!id) return null;
      return { label: `${name}(${id})`, value: id };
    })
    .filter((item): item is { label: string; value: string } => item != null);
}

async function loadBatchAddEnvOptions() {
  try {
    const res: any = await getRentalEnvListAPI();
    if (res != null && Number(res.code) !== 0) {
      message.error(res?.msg || "获取环境失败");
      batchAddEnvOptions.value = [];
      return;
    }
    const data = res?.data && typeof res.data === "object" ? (res.data as Record<string, unknown>) : {};
    const options = Object.entries(data)
      .map(([key, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return null;
        const record = value as Record<string, unknown>;
        const order = Number(record.order);
        const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : key;
        if (!Number.isFinite(order)) return null;
        return { label: `${name}(${key})`, value: key, order };
      })
      .filter((item): item is { label: string; value: string; order: number } => item != null)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ label: item.label, value: item.value }));
    batchAddEnvOptions.value = options;
  } catch (error: any) {
    batchAddEnvOptions.value = [];
    message.error(error?.message || String(error) || "获取环境失败");
  }
}

async function loadBatchAddTenantOptions() {
  const env = batchAddForm.env.trim();
  if (!env) {
    batchAddTenantOptions.value = [];
    batchAddForm.tenant_id = "";
    batchAddForm.tenant_name = "";
    return;
  }
  batchAddTenantLoading.value = true;
  try {
    const res: any = await rentalBusinessTenantAllAPI({ env });
    if (res != null && Number(res.code) !== 0) {
      batchAddTenantOptions.value = [];
      batchAddForm.tenant_id = "";
      batchAddForm.tenant_name = "";
      message.error(res?.msg || "获取租户失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(obj, ["tenantId", "tenant_id", "id"], ["tenantName", "tenant_name", "name"]);
        if (!id) return null;
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    batchAddTenantOptions.value = options;
    if (!options.some((item: any) => item.value === batchAddForm.tenant_id)) {
      batchAddForm.tenant_id = "";
      batchAddForm.tenant_name = "";
    }
  } catch (error: any) {
    batchAddTenantOptions.value = [];
    batchAddForm.tenant_id = "";
    batchAddForm.tenant_name = "";
    message.error(error?.message || String(error) || "获取租户失败");
  } finally {
    batchAddTenantLoading.value = false;
  }
}

async function loadBatchAddFranchiseeOptions() {
  const env = batchAddForm.env.trim();
  const tenantId = batchAddForm.tenant_id.trim();
  if (!env || !tenantId) {
    batchAddFranchiseeOptions.value = [];
    batchAddShopOptions.value = [];
    batchAddForm.custom_id = "";
    batchAddForm.shop_id = "";
    batchAddFranchiseeShopMap.value = {};
    return;
  }
  batchAddFranchiseeLoading.value = true;
  try {
    const res: any = await rentalBusinessFranchiseeAllAPI({ env, tenant_id: tenantId });
    if (res != null && Number(res.code) !== 0) {
      batchAddFranchiseeOptions.value = [];
      batchAddShopOptions.value = [];
      batchAddForm.custom_id = "";
      batchAddForm.shop_id = "";
      batchAddFranchiseeShopMap.value = {};
      message.error(res?.msg || "获取加盟商失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const shopMap: Record<string, Array<{ label: string; value: string }>> = {};
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(
          obj,
          ["customId", "custom_id", "id", "agentId", "agent_id"],
          ["customName", "custom_name", "name", "agentName", "agent_name"],
        );
        if (!id) return null;
        shopMap[id] = parseShopOptionsFromFranchisee(obj);
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    batchAddFranchiseeOptions.value = options;
    batchAddFranchiseeShopMap.value = shopMap;
  } catch (error: any) {
    batchAddFranchiseeOptions.value = [];
    batchAddShopOptions.value = [];
    batchAddForm.custom_id = "";
    batchAddForm.shop_id = "";
    batchAddFranchiseeShopMap.value = {};
    message.error(error?.message || String(error) || "获取加盟商失败");
  } finally {
    batchAddFranchiseeLoading.value = false;
  }
}

function refreshBatchAddShopOptions() {
  const customId = batchAddForm.custom_id.trim();
  batchAddShopLoading.value = true;
  const list = customId ? batchAddFranchiseeShopMap.value[customId] || [] : [];
  batchAddShopOptions.value = list;
  if (!list.some((item) => item.value === batchAddForm.shop_id)) {
    batchAddForm.shop_id = "";
  }
  batchAddShopLoading.value = false;
}

async function loadBatchAddVehicleModelOptions() {
  const env = batchAddForm.env.trim();
  const tenantId = batchAddForm.tenant_id.trim();
  const customId = batchAddForm.custom_id.trim();
  if (!env || !tenantId || !customId) {
    batchAddVehicleModelOptions.value = [];
    batchAddForm.vehicle_model_id = "";
    return;
  }
  batchAddVehicleModelLoading.value = true;
  try {
    const res: any = await rentalBusinessVehicleModelAllAPI({
      env,
      tenant_id: tenantId,
      custom_id: customId,
    });
    if (res != null && Number(res.code) !== 0) {
      batchAddVehicleModelOptions.value = [];
      batchAddForm.vehicle_model_id = "";
      message.error(res?.msg || "获取车型失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(
          obj,
          ["id", "modelId", "model_id", "vehicleModelId", "vehicle_model_id"],
          ["name", "modelName", "model_name", "vehicleModelName", "vehicle_model_name"],
        );
        if (!id) return null;
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    batchAddVehicleModelOptions.value = options;
    if (!options.some((item: any) => item.value === batchAddForm.vehicle_model_id)) {
      batchAddForm.vehicle_model_id = "";
    }
  } catch (error: any) {
    batchAddVehicleModelOptions.value = [];
    batchAddForm.vehicle_model_id = "";
    message.error(error?.message || String(error) || "获取车型失败");
  } finally {
    batchAddVehicleModelLoading.value = false;
  }
}

function openBatchAddModal() {
  if (formData.target_mode !== "env") {
    message.warning("指定网关模式不支持入库车辆");
    return;
  }
  batchAddForm.env = formData.env?.trim() || "test";
  batchAddForm.tenant_id = "";
  batchAddForm.tenant_name = "";
  batchAddForm.custom_id = "";
  batchAddForm.shop_id = "";
  batchAddForm.vehicle_model_id = "";
  batchAddForm.imei = formData.imei?.trim() ? formData.imei.trim() : "";
  showBatchAddModal.value = true;
  void loadBatchAddEnvOptions();
  void loadBatchAddTenantOptions();
}

async function handleBatchAddSubmit() {
  const env = batchAddForm.env.trim();
  const tenantId = batchAddForm.tenant_id.trim();
  const customId = batchAddForm.custom_id.trim();
  const shopId = batchAddForm.shop_id.trim();
  const vehicleModelId = batchAddForm.vehicle_model_id.trim();
  if (!env) return void message.error("环境不能为空");
  if (!tenantId) return void message.error("租户不能为空");
  if (!customId) return void message.error("加盟商不能为空");
  if (!shopId) return void message.error("门店不能为空");
  if (!vehicleModelId) return void message.error("车型不能为空");
  const imei = batchAddImei.value;
  if (!/^\d{15}$/.test(imei)) return void message.error("请填写有效 IMEI（15 位数字）");

  batchAddLoading.value = true;
  try {
    const res: any = await rentalBusinessAddEbikeAPI({
      env,
      imei,
      tenant_id: tenantId,
      tenant_name: batchAddForm.tenant_name.trim() || undefined,
      custom_id: customId,
      shop_id: shopId,
      vehicle_model_id: vehicleModelId,
    });
    if (res != null && Number(res.code) !== 0) {
      message.error(res?.msg || "入库失败");
      return;
    }
    showBatchAddModal.value = false;
    message.success("短租入库成功：1 台");
  } catch (error: any) {
    const msg = error?.message || String(error) || "入库失败";
    message.error(msg);
  } finally {
    batchAddLoading.value = false;
  }
}

/** 创建 mock 连接 */
async function handleCreate() {
  const useServer = formData.target_mode === "server";
  const server = formData.server?.trim() || "";
  const env = formData.env?.trim() || "";
  if (!formData.imei?.trim()) {
    message.error("请填写 IMEI");
    return;
  }
  if (useServer && !server) {
    message.error("请填写 指定网关（server）");
    return;
  }
  if (!useServer && !env) {
    message.error("请填写 环境");
    return;
  }
  warnIfPrevMockPossiblyActive();
  createLoading.value = true;
  createError.value = "";
  try {
    const payload: Record<string, unknown> = {
      imei: formData.imei.trim(),
      voltage: formData.voltage ?? 55,
      version: formData.version || "1.2.3",
      business_type: 2,
    };
    if (useServer) payload.server = server;
    else payload.env = env;
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.battery_sn != null && formData.battery_sn !== "")
      payload.battery_sn = formData.battery_sn.trim();
    if (formData.battery_soc != null) payload.battery_soc = formData.battery_soc;
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;

    const res: any = await rentalEcuMockAddAPI(payload);
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
    setActiveMockFlag();
    await fetchCmdAll();
    saveFormToStorage();
    message.success(`模拟中控成功`);
  } catch (e: any) {   
    message.error("模拟中控请求失败");
  } finally {
    createLoading.value = false;
  }
}

/** 更新 mock 数据（经度、纬度、电压、版本、座舱锁、电源在位） */
async function handleUpdate() {
  if (!connectId.value) return;
  updateLoading.value = true;
  try {
    const payload: Record<string, unknown> = {
      connect_id: connectId.value,
      bin68_immediately: true,
    };
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.voltage != null) payload.voltage = formData.voltage;
    if (formData.battery_sn != null) payload.battery_sn = formData.battery_sn;
    if (formData.battery_soc != null) payload.battery_soc = formData.battery_soc;
    if (formData.version != null && formData.version !== "")
      payload.version = formData.version;
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;
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
      message.success(`已停止模拟`);
    } else {
      // message.error("停止模拟请求失败");
    }
  } catch (e: any) {
    // message.error("断开失败");
  } finally {
    connectId.value = "";
    clearActiveMockFlag();
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

/* ========== Bin5 告警上报 ========== */
const showBin5Modal = ref(false);
const bin5Form = reactive<{ alarm_type: number | string | null }>({ alarm_type: null });
const bin5Loading = ref(false);

function openBin5ProtocolDoc() {
  window.open(BIN5_PROTOCOL_DOC_URL, "_blank", "noopener,noreferrer");
}

function openBin5Modal() {
  showBin5Modal.value = true;
}

/** Bin5 上报：调用接口后 toast，不关闭弹窗 */
async function handleBin5Submit() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const alarmType = parseBin5AlarmType(bin5Form.alarm_type);
  if (alarmType == null) {
    message.error("请选择或输入有效的告警类型数字");
    return;
  }
  bin5Loading.value = true;
  try {
    const res: any = await xiaoanEcuMockBin5API({
      connect_id: connectId.value,
      alarm_type: alarmType,
    });
    if (!checkResCode(res)) return;
    message.success(res?.data || "上报 bin5 alarm 成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "Bin5 上报失败");
  } finally {
    bin5Loading.value = false;
  }
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
  let lng = formData.lng ?? 116.397428;
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

watch(
  () => batchAddForm.env,
  () => {
    if (!showBatchAddModal.value) return;
    batchAddForm.tenant_id = "";
    batchAddForm.tenant_name = "";
    batchAddForm.custom_id = "";
    batchAddForm.shop_id = "";
    batchAddForm.vehicle_model_id = "";
    batchAddTenantOptions.value = [];
    batchAddFranchiseeOptions.value = [];
    batchAddShopOptions.value = [];
    batchAddVehicleModelOptions.value = [];
    batchAddFranchiseeShopMap.value = {};
    void loadBatchAddTenantOptions();
  },
);

watch(
  () => batchAddForm.tenant_id,
  () => {
    if (!showBatchAddModal.value) return;
    const selected = batchAddTenantOptions.value.find((item) => item.value === batchAddForm.tenant_id);
    batchAddForm.tenant_name = selected?.label?.replace(/\([^)]*\)\s*$/, "") || "";
    batchAddForm.custom_id = "";
    batchAddForm.shop_id = "";
    batchAddForm.vehicle_model_id = "";
    batchAddFranchiseeOptions.value = [];
    batchAddShopOptions.value = [];
    batchAddVehicleModelOptions.value = [];
    batchAddFranchiseeShopMap.value = {};
    void loadBatchAddFranchiseeOptions();
  },
);

watch(
  () => batchAddForm.custom_id,
  () => {
    if (!showBatchAddModal.value) return;
    batchAddForm.shop_id = "";
    batchAddForm.vehicle_model_id = "";
    batchAddVehicleModelOptions.value = [];
    refreshBatchAddShopOptions();
    void loadBatchAddVehicleModelOptions();
  },
);

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
.rental-ecu-mock {
  width: 100%;
  margin: 0;

  :deep(.n-card) {
    padding: 16px;
  }
}

/* 连接成功时：整卡绿色边框（无动画） */
.card-wrap {
  border-radius: 8px;
}

.card-wrap-reporting {
  border-radius: 10px;
  border: 2px solid #22c55e;
}

.card-wrap-reporting :deep(.n-card) {
  border-radius: 6px;
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

.gateway-config-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.gateway-target-item {
  flex: 1;
  min-width: 0;
}

.create-actions-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.batch-add-right-btn {
  margin-left: auto;
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

.battery-soc-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.soc-unit {
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

.service-area-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.service-area-row .service-area-type-select {
  width: 80px;
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

.coord-reset-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: 28px;
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

.gif-tip-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  background: #fff;
  border-radius: 8px;
}

.gif-tip-img {
  width: 220px;
  max-width: 100%;
  border-radius: 6px;
  display: block;
}

.gif-tip-text {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.gif-tip-sub {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin-top: -4px;
}

</style>
