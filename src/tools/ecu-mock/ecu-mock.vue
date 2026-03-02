<template>
  <div class="ecu-mock">
    <n-card>
      <div class="input-section">
        <n-form :model="formData" label-placement="left" label-width="80px">
          <n-form-item label="切车host" path="host">
            <n-input
              v-model:value="formData.host"
              placeholder="请输入切车地址 host"
              clearable
            />
          </n-form-item>
          <n-form-item label="切车port" path="port">
            <n-input-number
              v-model:value="formData.port"
              placeholder="请输入 port"
              :min="1"
              :max="65535"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="IMEI" path="imei">
            <n-input
              v-model:value="formData.imei"
              placeholder="请输入设备 IMEI 号"
              clearable
            />
          </n-form-item>
          <n-form-item label="类型" path="type">
            <n-radio-group v-model:value="formData.type">
              <n-radio :value="1">自动挡</n-radio>
              <n-radio :value="2">手动挡</n-radio>
            </n-radio-group>
          </n-form-item>
          <n-form-item>
            <n-space>
              <n-button
                type="primary"
                :loading="loading"
                @click="handleSimulate"
                class="simulate-button"
              >
                模拟
              </n-button>
              <n-button
                type="default"
                :loading="queryLoading"
                @click="handleQuery"
              >
                查询
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>

      <div v-if="loading" class="loading">
        <n-spin size="small" />
        <span class="loading-text">正在模拟，请稍候...</span>
      </div>
      <div v-if="queryLoading" class="loading">
        <n-spin size="small" />
        <span class="loading-text">正在查询，请稍候...</span>
      </div>

      <div v-if="error" class="error">
        <n-alert type="error" :title="error" />
      </div>

      <!-- <div v-if="resultMsg" class="result">
        <n-alert type="success" :title="resultMsg" />
      </div> -->

      <div v-if="queryResultJson !== null" class="query-result">
        <div class="query-result-title">查询结果</div>
        <pre class="query-result-json">{{ queryResultJson }}</pre>
      </div>

      <!-- 模拟中控更新状态 -->
      <div class="state-update-section">
        <div class="section-title">模拟中控更新状态</div>
        <!-- <p class="section-desc">按编排顺序定期上报状态，可添加多个节点，每节点填写 JSON、循环次数与间隔。</p> -->
        <div class="node-list">
          <div
            v-for="(node, index) in stateNodes"
            :key="node.id"
            class="node-card"
            :class="{ 'node-card-dragging': draggedNodeIndex === index }"
            @dragover.prevent="onNodeDragOver($event, index)"
            @drop="onNodeDrop($event, index)"
          >
            <div class="node-head">
              <span
                class="node-drag-handle"
                title="拖动排序"
                draggable="true"
                @dragstart="onNodeDragStart($event, index)"
                @dragend="onNodeDragEnd"
              >
                <n-icon :component="GripVertical" :size="18" />
              </span>
              <span class="node-index">节点 {{ index + 1 }}</span>
              <n-button
                type="default"
                quaternary
                size="small"
                @click="addStateNode(index)"
              >
                ＋ 在此前添加
              </n-button>
              <n-button
                type="error"
                quaternary
                size="small"
                @click="removeStateNode(node.id)"
              >
                删除
              </n-button>
            </div>
            <div class="node-body">
              <div class="node-field">
                <label>前置等待（秒）</label>
                <n-input-number
                  v-model:value="node.preWaitSeconds"
                  :min="0"
                  placeholder="0"
                  class="node-number node-pre-wait"
                />
                <span v-if="node.preWaitSeconds === 0" class="node-field-hint">立即执行</span>
              </div>
              <div class="node-field">
                <div class="node-field-label-row">
                  <label>模拟JSON 数据</label>
                  <n-checkbox v-model:checked="node.realtimeLocation" class="node-realtime-location">
                    实时定位
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-icon
                          :component="Help"
                          :size="14"
                          class="realtime-location-tip-icon"
                          @click.stop
                        />
                      </template>
                  使用当前设备的定位动态替换 JSON 中的 wgs84Lng、wgs84Lat
                    </n-tooltip>
                  </n-checkbox>
                </div>
                <n-input
                  v-model:value="node.jsonText"
                  type="textarea"
                  placeholder='{"key": "value"}'
                  :rows="10"
                  class="node-json-input"
                />
              </div>
              <div class="node-row">
                <div class="node-field node-field-inline">
                  <label>循环次数</label>
                  <n-input-number
                    v-model:value="node.loopCount"
                    :min="1"
                    :max="999"
                    placeholder="1"
                    class="node-number"
                  />
                </div>
                <div v-if="node.loopCount > 1" class="node-field node-field-inline">
                  <label>间隔（秒）</label>
                  <n-input-number
                    v-model:value="node.intervalSeconds"
                    :min="1"
                    :max="3600"
                    placeholder="1"
                    class="node-number"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <n-button type="default" dashed block class="add-node-btn" @click="addStateNode">
          + 添加节点
        </n-button>
        <n-button
          type="primary"
          :loading="stateUpdateLoading"
          :disabled="stateNodes.length === 0"
          block
          class="update-state-btn"
          @click="handleUpdateState"
        >
          开始模拟更新状态
        </n-button>
        <div v-if="stateUpdateLog" class="state-update-log">
          <div class="state-update-log-title">
            <span>执行日志</span>
            <n-button text type="primary" size="small" @click="clearStateUpdateLog">
              清空
            </n-button>
          </div>
          <pre class="state-update-log-content">{{ stateUpdateLog }}</pre>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { createDiscreteApi } from "naive-ui";
import { GripVertical, Help } from "@vicons/tabler";
import { ecuMockAPI, ecuQueryAPI, ecuStateUpdateAPI } from "@/api/device";

/** 状态更新节点：前置等待、JSON 文本、循环次数、间隔秒数、是否实时定位 */
interface StateNode {
  id: number;
  preWaitSeconds: number;
  jsonText: string;
  loopCount: number;
  intervalSeconds: number;
  /** 开启后每次请求前用当前定位替换 JSON 中的 wgs84Lng、wgs84Lat */
  realtimeLocation: boolean;
}

/** 创建节点，可选传入默认 JSON；可选传入前置等待秒数（首个节点 0，后续节点默认 10） */
function createStateNode(defaultJson?: string, preWaitSeconds = 0): StateNode {
  return {
    id: Date.now(),
    preWaitSeconds,
    jsonText: defaultJson != null && defaultJson.trim() ? defaultJson.trim() : "",
    loopCount: 1,
    intervalSeconds: 10,
    realtimeLocation: true,
  };
}

/** 获取当前定位，返回 WGS84 经纬度 */
function getCurrentPosition(): Promise<{ wgs84Lng: number; wgs84Lat: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("浏览器不支持定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          wgs84Lng: pos.coords.longitude,
          wgs84Lat: pos.coords.latitude,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 5000 }
    );
  });
}

const formData = ref({
  host: "device-test2.xiaoantech.com",
  port: 9880,
  imei: "",
  type: 1, // 默认 1 自动挡
});

const loading = ref(false);
const queryLoading = ref(false);
const error = ref("");
const resultMsg = ref("");
/** 查询接口返回的全量 JSON，格式化后的字符串，用于展示 */
const queryResultJson = ref<string | null>(null);

/** 模拟中控更新状态：节点列表。首个节点前置等待默认 0 秒 */
const stateNodes = ref<StateNode[]>([createStateNode(undefined, 0)]);
const stateUpdateLoading = ref(false);
const stateUpdateLog = ref("");

const { message } = createDiscreteApi(["message"]);

/**
 * 在指定位置添加节点；不传或传 length 表示追加
 * @param insertIndex - 插入位置（0-based），新节点将占据该下标；不传则追加到末尾
 */
function addStateNode(insertIndex?: number) {
  const list = stateNodes.value;
  const isAppend = insertIndex === undefined || insertIndex >= list.length;
  const at = isAppend ? list.length : Math.max(0, insertIndex);
  const isFirstSlot = at === 0;
  const prevNode = at > 0 ? list[at - 1] : null;
  let defaultData: string | undefined;
  const preWait = isFirstSlot ? 0 : 10;
  if (isFirstSlot) {
    const raw = queryResultJson.value;
    if (raw?.trim()) {
      try {
        const parsed = JSON.parse(raw);
        const payload =
          parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "data")
            ? parsed.data
            : parsed;
        defaultData = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
      } catch {
        defaultData = raw;
      }
    } else {
      defaultData = undefined;
    }
  } else {
    defaultData = prevNode?.jsonText;
  }
  const newNode = createStateNode(defaultData ?? undefined, preWait);
  const next = [...list];
  next.splice(at, 0, newNode);
  stateNodes.value = next;
}

function removeStateNode(id: number) {
  stateNodes.value = stateNodes.value.filter((n) => n.id !== id);
}

/** 清空执行日志 */
function clearStateUpdateLog() {
  stateUpdateLog.value = "";
}

/** 当前正在被拖动的节点下标，用于样式 */
const draggedNodeIndex = ref<number | null>(null);

/** 节点拖拽开始：仅从手柄触发 */
function onNodeDragStart(e: DragEvent, index: number) {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData("application/json", String(index));
  e.dataTransfer.effectAllowed = "move";
  draggedNodeIndex.value = index;
}

function onNodeDragEnd() {
  draggedNodeIndex.value = null;
}

function onNodeDragOver(e: DragEvent, _index: number) {
  e.dataTransfer && (e.dataTransfer.dropEffect = "move");
}

/** 节点拖拽放置：根据拖动源与放置目标重排列表 */
function onNodeDrop(e: DragEvent, dropIndex: number) {
  e.preventDefault();
  if (!e.dataTransfer) return;
  const from = Number(e.dataTransfer.getData("application/json"));
  if (Number.isNaN(from) || from === dropIndex) return;
  const list = [...stateNodes.value];
  const [removed] = list.splice(from, 1);
  const to = dropIndex > from ? dropIndex - 1 : dropIndex;
  list.splice(to, 0, removed);
  stateNodes.value = list;
  draggedNodeIndex.value = null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 点击模拟，调用 ECU Mock 接口
 */
function handleSimulate() {
  if (!formData.value.host?.trim()) {
    error.value = "请输入切车地址 host";
    message.error("请输入切车地址 host");
    return;
  }
  if (formData.value.port == null || formData.value.port < 1 || formData.value.port > 65535) {
    error.value = "请输入有效的 port（1-65535）";
    message.error("请输入有效的 port");
    return;
  }
  if (!formData.value.imei?.trim()) {
    error.value = "请输入设备 IMEI 号";
    message.error("请输入设备 IMEI 号");
    return;
  }

  loading.value = true;
  error.value = "";
  resultMsg.value = "";

  const body = {
    host: formData.value.host.trim(),
    port: Number(formData.value.port),
    imei: formData.value.imei.trim(),
    type: formData.value.type,
  };

  ecuMockAPI(body)
    .then((res: any) => {
      if (res?.success === true || res?.code === 0 || res?.code === "0") {
        resultMsg.value = res?.msg || res?.data || "模拟成功";
        message.success(resultMsg.value);
      } else {
        error.value = res?.msg || res?.code || "请求失败";
        message.error(error.value);
      }
    })
    .catch((err: any) => {
      error.value = err?.message || String(err) || "请求失败";
      message.error(error.value);
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 点击查询，调用 ECU 查询接口（仅传 imei），将全量 JSON 格式化显示在下方
 */
function handleQuery() {
  if (!formData.value.imei?.trim()) {
    message.error("请输入设备 IMEI 号");
    return;
  }

  queryLoading.value = true;
  error.value = "";
  queryResultJson.value = null;

  ecuQueryAPI({ imei: formData.value.imei.trim() })
    .then((res: any) => {
      try {
        // 查询结果展示接口全量返回数据
        queryResultJson.value =
          typeof res === "string" ? res : JSON.stringify(res, null, 2);
      } catch (e) {
        queryResultJson.value = String(res);
      }
    })
    .catch((err: any) => {
      error.value = err?.message || String(err) || "查询失败";
      message.error(error.value);
    })
    .finally(() => {
      queryLoading.value = false;
    });
}

/**
 * 按编排顺序调用 ecuStateUpdateAPI：每个节点循环 loopCount 次，每次间隔 intervalSeconds 秒（循环 1 次不等待）
 */
async function handleUpdateState() {
  if (stateNodes.value.length === 0) {
    message.warning("请至少添加一个节点");
    return;
  }
  const logs: string[] = [];
  stateUpdateLog.value = "";
  stateUpdateLoading.value = true;
  error.value = "";

  try {
    // 先让 UI 立即更新（loading、日志区），避免点击后界面无响应
    await nextTick();
    // 若首个节点需要实时定位且前置等待为 0，提前发起定位请求，减少首请求前的等待
    const firstNode = stateNodes.value[0];
    const needRealtimeFirst =
      firstNode?.realtimeLocation &&
      Math.max(0, Number(firstNode.preWaitSeconds) || 0) === 0;
    let preStartedPosition: Promise<{ wgs84Lng: number; wgs84Lat: number }> | null = needRealtimeFirst
      ? getCurrentPosition()
      : null;

    for (let i = 0; i < stateNodes.value.length; i++) {
      const node = stateNodes.value[i];
      const preWait = Math.max(0, Number(node.preWaitSeconds) || 0);
      if (preWait > 0) {
        logs.push(`节点 ${i + 1} 前置等待 ${preWait} 秒...`);
        stateUpdateLog.value = logs.join("\n");
        await sleep(preWait * 1000);
      }
      let body: any;
      try {
        body = node.jsonText.trim() ? JSON.parse(node.jsonText) : {};
      } catch (e) {
        logs.push(`节点 ${i + 1} JSON 解析失败`);
        message.error(`节点 ${i + 1} JSON 格式错误`);
        stateUpdateLog.value = logs.join("\n");
        return;
      }
      const loopCount = Math.max(1, Number(node.loopCount) || 1);
      const intervalSeconds = Math.max(0, Number(node.intervalSeconds) || 1);

      for (let k = 0; k < loopCount; k++) {
        const sendBody = { ...body };
        if (node.realtimeLocation) {
          // 首个节点、首轮、前置等待为 0 时：不等待定位，立即用 JSON 内坐标发首包
          const skipWaitForFirstRequest =
            i === 0 && k === 0 && preWait === 0 && preStartedPosition !== null;
          if (skipWaitForFirstRequest) {
            preStartedPosition = null;
            logs.push(`节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 立即请求（使用 JSON 内坐标）`);
            stateUpdateLog.value = logs.join("\n");
          } else {
            try {
              logs.push(`节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 获取定位中...`);
              stateUpdateLog.value = logs.join("\n");
              const pos = preStartedPosition
                ? await preStartedPosition
                : await getCurrentPosition();
              preStartedPosition = null;
              logs.push(`  定位结果: wgs84Lng=${pos.wgs84Lng}, wgs84Lat=${pos.wgs84Lat}`);
              stateUpdateLog.value = logs.join("\n");
              sendBody.wgs84Lng = pos.wgs84Lng;
              sendBody.wgs84Lat = pos.wgs84Lat;
            } catch (locErr: any) {
              logs.push(`节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 定位未就绪: ${locErr?.message || locErr}，使用 JSON 内坐标`);
              stateUpdateLog.value = logs.join("\n");
            }
          }
        }
        logs.push(`节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 请求中...`);
        stateUpdateLog.value = logs.join("\n");
        try {
          const res = await ecuStateUpdateAPI(sendBody);
          logs[logs.length - 1] = `节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 成功`;
          const resStr =
            typeof res === "string" ? res : JSON.stringify(res, null, 2);
          logs.push(`  ← 返回: ${resStr}`);
        } catch (err: any) {
          logs[logs.length - 1] = `节点 ${i + 1} 第 ${k + 1}/${loopCount} 次 失败: ${err?.message || err}`;
          stateUpdateLog.value = logs.join("\n");
          message.error(`节点 ${i + 1} 执行失败`);
          return;
        }
        if (k < loopCount - 1 && intervalSeconds > 0) {
          logs.push(`节点 ${i + 1} 等待 ${intervalSeconds} 秒...`);
          stateUpdateLog.value = logs.join("\n");
          await sleep(intervalSeconds * 1000);
        }
      }
    }
    logs.push("全部完成");
    message.success("更新状态执行完成");
  } finally {
    stateUpdateLoading.value = false;
    stateUpdateLog.value = logs.join("\n");
  }
}
</script>

<style lang="less" scoped>
.ecu-mock {
  width: 100%;
  margin: 0;

  :deep(.n-card) {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .ecu-mock {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }
}

.input-section {
  margin-bottom: 12px;
}

.simulate-button {
  border-radius: 6px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  color: #1677ff;
}

.loading-text {
  font-size: 0.9em;
}

.error {
  margin: 12px 0;
}

.result {
  margin: 12px 0;
}

.query-result {
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.query-result-title {
  padding: 8px 12px;
  background: #f6f8fa;
  font-weight: 600;
  font-size: 13px;
}

.query-result-json {
  margin: 0;
  padding: 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 模拟中控更新状态 */
.state-update-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
}

.section-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fafbfc;
}

.node-card-dragging {
  opacity: 0.7;
}

.node-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f2f5;
}

.node-drag-handle {
  cursor: grab;
  color: #999;
  user-select: none;
  -webkit-user-select: none;
}

.node-drag-handle:active {
  cursor: grabbing;
}

.node-index {
  margin-right: auto;
  font-weight: 600;
  font-size: 13px;
}

.node-body {
  padding: 12px;
}

.node-field {
  margin-bottom: 10px;
}

.node-field:last-child {
  margin-bottom: 0;
}

.node-field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.node-field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.node-field-label-row label {
  margin-bottom: 0;
}

.node-field-hint {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.node-realtime-location {
  font-size: 13px;
}

.realtime-location-tip-icon {
  display: inline-block;
  margin-left: 4px;
  vertical-align: middle;
  cursor: help;
  color: #999;
}

.node-json-input {
  width: 100%;
}

.node-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.node-field-inline {
  flex: 1;
  min-width: 100px;
}

.node-field-inline .node-number {
  width: 100%;
}

.add-node-btn {
  margin-top: 12px;
}

.update-state-btn {
  margin-top: 12px;
  border-radius: 6px;
}

.state-update-log {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.state-update-log-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f6f8fa;
  font-size: 12px;
  font-weight: 600;
}

.state-update-log-content {
  margin: 0;
  padding: 10px 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .state-update-section {
    margin-top: 16px;
    padding-top: 12px;
  }

  .node-head {
    padding: 10px 12px;
  }

  .node-body {
    padding: 10px 12px;
  }

  .node-row {
    flex-direction: column;
    gap: 8px;
  }

  .node-field-inline {
    min-width: 100%;
  }

  .add-node-btn,
  .update-state-btn {
    margin-top: 10px;
    min-height: 40px;
  }
}
</style>
