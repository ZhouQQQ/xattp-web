<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";

defineOptions({ name: "EditorWithLineNumbers" });
const props = withDefaults(
  defineProps<{
    modelValue?: string;
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: "",
    readonly: false,
    placeholder: "",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  /** 仅用户手动编辑时触发 */
  "user-input": [];
}>();

const gutterRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
let syncingFromParent = false;

const lineCount = computed(() => {
  const lines = (props.modelValue || "").split("\n").length;
  return Math.max(lines, 1);
});

watch(
  () => props.modelValue,
  (value) => {
    const el = textareaRef.value;
    if (!el) return;
    const next = value ?? "";
    if (el.value === next) return;
    syncingFromParent = true;
    el.value = next;
    nextTick(() => {
      syncingFromParent = false;
    });
  }
);

function onInput(event: Event) {
  if (syncingFromParent) return;
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  emit("user-input");
}
function syncGutterScroll() {
  if (gutterRef.value && textareaRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop;
  }
}
</script>

<template>
  <div class="editor-with-lines">
    <div ref="gutterRef" class="line-gutter" aria-hidden="true">
      <div v-for="line in lineCount" :key="line" class="line-num">{{ line }}</div>
    </div>
    <textarea
      ref="textareaRef"
      class="editor-textarea"
      :value="modelValue"
      :readonly="readonly"
      :placeholder="placeholder"
      spellcheck="false"
      @input="onInput"
      @scroll="syncGutterScroll"
    />
  </div>
</template>

<style lang="less" scoped>
.editor-with-lines {
  display: flex;
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.line-gutter {
  flex-shrink: 0;
  width: 38px;
  padding: 8px 6px 8px 0;
  overflow: hidden;
  text-align: right;
  user-select: none;
  background: #f5f6f8;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.line-num {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.35;
  color: #9ca3af;
}

.editor-textarea {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 8px;
  border: none;
  outline: none;
  resize: none;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.35;
  word-break: break-all;
  background: transparent;
  color: inherit;

  &::placeholder {
    color: #c0c4cc;
  }

  &:read-only {
    cursor: default;
    color: #374151;
  }
}
</style>
