<template>
  <div class="json-beautify">
    <div class="json-beautify-panels">
      <n-card class="panel panel-input" size="small">
        <div class="panel-inner">
          <div class="panel-toolbar">
            <n-space :size="4" wrap>
              <n-button type="primary" size="tiny" @click="handleFormat">格式化</n-button>
              <n-button v-if="canUndoRepair" size="tiny" @click="handleUndoRepair">
                撤销
              </n-button>
              <n-button v-else-if="canRepair" size="tiny" @click="handleRepair">
                修复
              </n-button>
              <n-button size="tiny" @click="handleUnescape">去除转义</n-button>
              <n-button size="tiny" @click="handleEscape">添加转义</n-button>
              <n-button size="tiny" @click="handleMinify">压缩</n-button>
              <n-button size="tiny" @click="handleCopyInput">复制</n-button>
              <n-button size="tiny" @click="handleClear">清空</n-button>
              <n-button size="tiny" @click="handleShare">分享</n-button>
            </n-space>
          </div>

          <div class="panel-body">
            <EditorWithLineNumbers
              v-model="rawJson"
              placeholder="粘贴或输入 JSON 内容..."
              @user-input="onLeftUserInput"
            />
          </div>

          <n-alert v-if="inputErrorMessage" type="error" :show-icon="true" class="panel-alert">
            {{ inputErrorMessage }}
          </n-alert>
        </div>
      </n-card>

      <n-card class="panel panel-output" size="small">
        <div class="panel-inner">
          <div class="panel-toolbar">
            <n-space :size="4" wrap align="center">
              <n-button size="tiny" :disabled="!fieldNodes.length" @click="expandAll">
                全部展开
              </n-button>
              <n-button size="tiny" :disabled="!fieldNodes.length" @click="collapseAll">
                全部折叠
              </n-button>
              <n-button size="tiny" :disabled="!formattedJson" @click="handleCopyOutput">复制</n-button>
            </n-space>
          </div>

          <n-alert v-if="formatErrorMessage" type="warning" :show-icon="true" class="panel-alert">
            {{ formatErrorMessage }}
          </n-alert>

          <div class="panel-body">
            <div v-if="fieldNodes.length" class="tree-block">
              <JsonCollapsibleView :nodes="fieldNodes" :expanded-keys="expandedKeys" @toggle="toggleField" />
            </div>

            <n-empty v-else-if="!rawJson.trim()" description="左侧输入有效 JSON 后将自动格式化" class="panel-empty" />
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "JsonBeautify" });

import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStorage } from "@vueuse/core";
import { createDiscreteApi } from "naive-ui";
import {
  minifyJsonText,
  formatJsonText,
  escapeJsonText,
  unescapeJsonText,
  repairJsonText,
  tryFormatJsonText,
  resolvePrettyJsonSource,
  buildJsonFieldNodes,
  collectJsonFieldKeys,
  collectTopLevelFieldKeys,
  JsonBeautifyError,
} from "./json-beautify.service";
import JsonCollapsibleView from "./json-collapsible-view.vue";
import EditorWithLineNumbers from "./editor-with-line-numbers.vue";
import {
  JSON_SHARE_QUERY_PARAM,
  JSON_SHARE_URL_MAX_LENGTH,
  buildJsonBeautifyShareUrl,
  getJsonFromRouteQuery,
} from "./json-beautify-share";
import { useCopy } from "@/composable/copy";

const route = useRoute();
const router = useRouter();
const { message } = createDiscreteApi(["message"]);

const JSON_INDENT = 2;

const rawJson = useStorage(
  "json-beautify:raw-json",
  '{\n  "hello": "world",\n  "items": [1, 2, 3]\n}'
);
const inputErrorMessage = ref("");
const expandedKeys = ref<string[]>([]);
/** 智能修复前备份，用于撤销 */
const repairUndoSnapshot = ref<string | null>(null);

const canUndoRepair = computed(() => repairUndoSnapshot.value !== null);

const { copy } = useCopy({ createToast: false });

const displaySource = computed(() => resolvePrettyJsonSource(rawJson.value));

/** 仅当有内容且 JSON 无效、无法格式化时可修复 */
const canRepair = computed(() => {
  if (!rawJson.value.trim()) return false;
  return displaySource.value.kind === "invalid";
});

const formattedJson = computed(() => {
  const { source, kind } = displaySource.value;
  if (kind !== "json" || source === null) return null;
  return tryFormatJsonText(source, JSON_INDENT);
});

const formatErrorMessage = computed(() => {
  if (!rawJson.value.trim()) return "";
  const { kind } = displaySource.value;
  if (kind === "invalid") return "JSON 格式无效，无法自动格式化，可尝试点击「修复」";
  if (kind === "string") return "当前内容为普通字符串，右侧仅展示结构化 JSON";
  return "";
});

const fieldNodes = computed(() => {
  const { source, kind } = displaySource.value;
  if (kind !== "json" || source === null) return [];
  return buildJsonFieldNodes(source) ?? [];
});

watch(
  fieldNodes,
  (nodes) => {
    const validKeys = new Set(collectJsonFieldKeys(nodes));
    const kept = expandedKeys.value.filter((key) => validKeys.has(key));
    const topLevel = collectTopLevelFieldKeys(nodes);
    expandedKeys.value = [...new Set([...kept, ...topLevel])];
  },
  { immediate: true }
);

function toggleField(key: string) {
  if (expandedKeys.value.includes(key)) {
    expandedKeys.value = expandedKeys.value.filter((item) => item !== key);
    return;
  }
  expandedKeys.value = [...expandedKeys.value, key];
}

function clearInputError() {
  inputErrorMessage.value = "";
}

function clearShareQueryParam() {
  if (!route.query[JSON_SHARE_QUERY_PARAM]) return;
  const query = { ...route.query };
  delete query[JSON_SHARE_QUERY_PARAM];
  router.replace({ path: route.path, query }).catch(() => undefined);
}

function applyJsonFromQuery() {
  const fromQuery = getJsonFromRouteQuery(route.query);
  if (!fromQuery) return;
  if (rawJson.value === fromQuery) return;
  rawJson.value = fromQuery;
  repairUndoSnapshot.value = null;
}

watch(
  () => route.query[JSON_SHARE_QUERY_PARAM],
  () => applyJsonFromQuery(),
  { immediate: true }
);

/** 仅用户手动编辑输入框时触发 */
function onLeftUserInput() {
  clearInputError();
  repairUndoSnapshot.value = null;
}

function applyLeftInputValue(value: string) {
  rawJson.value = value;
}

function applyInputTransform(transform: (text: string) => string, successText: string) {
  clearInputError();
  repairUndoSnapshot.value = null;
  try {
    rawJson.value = transform(rawJson.value);
    message.success(successText);
  } catch (e) {
    inputErrorMessage.value =
      e instanceof JsonBeautifyError ? e.message : "操作失败，请检查输入";
    message.error(inputErrorMessage.value);
  }
}

function handleFormat() {
  applyInputTransform(
    (text) => formatJsonText(text, JSON_INDENT),
    "JSON 已格式化"
  );
}

function handleMinify() {
  applyInputTransform((text) => minifyJsonText(text), "JSON 已压缩");
}

function handleEscape() {
  applyInputTransform((text) => escapeJsonText(text), "JSON 已转义");
}

function handleUnescape() {
  applyInputTransform((text) => unescapeJsonText(text), "JSON 已去除转义");
}

function handleRepair() {
  clearInputError();
  if (!rawJson.value.trim()) {
    message.warning("请先输入 JSON 内容");
    return;
  }

  const beforeRepair = rawJson.value;
  const result = repairJsonText(beforeRepair, JSON_INDENT);

  if (result.repaired !== null) {
    repairUndoSnapshot.value = beforeRepair;
    applyLeftInputValue(result.repaired);

    if (result.hints.length > 0) {
      const summary = result.hints.map((h) => h.message).join("；");
      message.success(`已写入左侧输入框：${summary}`, { duration: 5000 });
    } else {
      message.success("已写入左侧输入框，JSON 格式正确");
    }
  } else {
    inputErrorMessage.value = result.error || "无法修复，请手动检查 JSON 格式";
    if (result.hints.length > 0) {
      const partial = result.hints.map((h) => h.message).join("；");
      inputErrorMessage.value += `（已尝试：${partial}）`;
    }
    message.error(inputErrorMessage.value, { duration: 6000 });
  }
}

function handleUndoRepair() {
  if (repairUndoSnapshot.value === null) return;
  applyLeftInputValue(repairUndoSnapshot.value);
  repairUndoSnapshot.value = null;
  clearInputError();
  message.success("已撤销修复，已恢复修复前内容");
}

async function handleShare() {
  if (!rawJson.value.trim()) {
    message.warning("请先输入 JSON 内容");
    return;
  }

  const shareUrl = buildJsonBeautifyShareUrl(
    window.location.origin,
    route.path,
    rawJson.value
  );

  if (shareUrl.length > JSON_SHARE_URL_MAX_LENGTH) {
    message.warning("JSON 过长，无法生成分享链接，请精简后重试");
    return;
  }

  try {
    await router.replace({
      path: route.path,
      query: { ...route.query, [JSON_SHARE_QUERY_PARAM]: rawJson.value },
    });
    await copy(shareUrl);
    message.success("分享链接已复制到剪贴板");
  } catch {
    message.error("分享失败，请检查浏览器权限");
  }
}

async function copyText(text: string, emptyWarning: string) {
  if (!text.trim()) {
    message.warning(emptyWarning);
    return;
  }
  try {
    await copy(text);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败，请检查浏览器权限");
  }
}

function handleCopyInput() {
  copyText(rawJson.value, "没有可复制的内容");
}

function handleCopyOutput() {
  if (!formattedJson.value) {
    message.warning("当前没有可复制的格式化结果");
    return;
  }
  copyText(formattedJson.value, "没有可复制的内容");
}

function handleClear() {
  rawJson.value = "";
  repairUndoSnapshot.value = null;
  clearShareQueryParam();
  clearInputError();
}

function expandAll() {
  expandedKeys.value = collectJsonFieldKeys(fieldNodes.value);
}

function collapseAll() {
  expandedKeys.value = [];
}
</script>

<style lang="less" scoped>
.json-beautify {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  height: calc(100vh - 220px);
  max-height: calc(100vh - 220px);
  min-height: 520px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.json-beautify-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel {
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;

  :deep(.n-card__content) {
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
  }
}

.panel-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.panel-toolbar {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.editor-with-lines) {
    flex: 1;
    min-height: 0;
  }
}

.panel-alert {
  flex-shrink: 0;
  margin-top: 10px;
}

.tree-block {
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 960px) {
  .json-beautify {
    height: auto;
    max-height: none;
    min-height: calc(100vh - 220px);
    overflow: visible;
  }

  .json-beautify-panels {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .panel-body {
    min-height: 320px;
    overflow: hidden;
  }

  .tree-block {
    max-height: 60vh;
    overflow-y: auto;
  }
}
</style>
