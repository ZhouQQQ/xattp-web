<script setup lang="ts">
import { createDiscreteApi } from "naive-ui";
import type { JsonFieldNode } from "./json-beautify.service";

defineOptions({ name: "JsonCollapsibleView" });

const props = withDefaults(
  defineProps<{
    nodes: JsonFieldNode[];
    expandedKeys: string[];
    depth?: number;
  }>(),
  { depth: 0 }
);

const emit = defineEmits<{
  toggle: [key: string];
}>();

const { message } = createDiscreteApi(["message"]);

function isExpanded(key: string) {
  return props.expandedKeys.includes(key);
}

function isExpandable(node: JsonFieldNode) {
  return !!node.children?.length;
}

async function copyText(text: string, tip: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success(tip);
  } catch {
    message.error("复制失败，请检查浏览器权限");
  }
}

function copyKey(node: JsonFieldNode) {
  copyText(node.name, `已复制 key：${node.name}`);
}

function unquoteCopyValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") return parsed;
    } catch {
      // 非标准 JSON 字符串，保留原样
    }
  }
  return value;
}

function copyValue(node: JsonFieldNode) {
  const value = node.preview ?? node.collapsedPreview;
  if (value == null) return;
  copyText(unquoteCopyValue(value), "已复制 value");
}
</script>

<template>
  <div class="json-collapsible-view">
    <div v-for="node in nodes" :key="node.key" class="json-field">
      <div class="json-field-row">
        <button
          v-if="isExpandable(node)"
          type="button"
          class="json-fold-btn"
          @click="emit('toggle', node.key)"
        >
          {{ isExpanded(node.key) ? "▼" : "▶" }}
        </button>
        <span v-else class="json-fold-placeholder" />
        <span
          class="json-field-name json-copyable"
          title="点击复制 key"
          @click="copyKey(node)"
        >{{ node.name }}</span>
        <span class="json-field-sep">:</span>
        <span
          v-if="!isExpandable(node)"
          class="json-field-value json-copyable"
          title="点击复制 value"
          @click="copyValue(node)"
        >{{ node.preview }}</span>
        <span
          v-else-if="!isExpanded(node.key)"
          class="json-field-preview json-copyable"
          title="点击复制 value"
          @click="copyValue(node)"
        >{{ node.collapsedPreview }}</span>
      </div>
      <div v-if="isExpandable(node) && isExpanded(node.key)" class="json-field-children">
        <JsonCollapsibleView
          :nodes="node.children!"
          :expanded-keys="expandedKeys"
          :depth="depth + 1"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.json-collapsible-view {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.35;
}

.json-field {
  min-width: 0;
}

.json-field-row {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  min-height: 18px;
  padding: 0 2px;
  border-radius: 2px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.json-fold-btn {
  flex-shrink: 0;
  width: 14px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-size: 9px;
  line-height: 16px;
  text-align: center;

  &:hover {
    color: #18a058;
  }
}

.json-fold-placeholder {
  flex-shrink: 0;
  width: 14px;
}

.json-field-name {
  color: #881391;
  flex-shrink: 0;
}

.json-copyable {
  cursor: pointer;
  border-radius: 2px;

  &:hover {
    background: rgba(24, 160, 88, 0.12);
  }
}

.json-field-sep {
  color: #666;
  flex-shrink: 0;
}

.json-field-value {
  color: #1a1aa6;
  word-break: break-all;
}

.json-field-preview {
  color: #666;
}

.json-field-children {
  padding-left: 14px;
}
</style>
