<template>
  <div class="ecu-json" :class="{ invalid }" :style="{ '--json-min-h': `${minHeight}px` }">
    <!-- 只读：静态 pre，高度随内容撑开 -->
    <pre v-if="readonly" class="hl" v-html="highlighted" />
    <!-- 可编辑：高亮层 + 透明 textarea（自动高度，不出现内部滚动条） -->
    <template v-else>
      <pre ref="hlRef" class="hl overlay" v-html="highlighted" />
      <textarea
        ref="taRef"
        class="ta"
        :value="modelValue"
        spellcheck="false"
        wrap="soft"
        @input="onInput"
      />
    </template>

    <div class="tool-bar">
      <n-button v-if="!readonly" size="tiny" text @click="format">
        格式化
      </n-button>
      <n-button size="tiny" text @click="copy">
        复制
      </n-button>
      <n-button size="tiny" text @click="expand">
        ⛶
      </n-button>
    </div>

    <n-modal
      v-model:show="showFull"
      preset="card"
      :title="title || 'JSON'"
      class="ecu-json-modal"
      :style="{ width: '94vw', height: '90vh' }"
      :bordered="false"
      size="small"
    >
      <pre class="hl full-view" v-html="highlighted" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { createDiscreteApi } from 'naive-ui';

const { message } = createDiscreteApi(['message']);

const props = withDefaults(defineProps<{
  modelValue: string;
  readonly?: boolean;
  invalid?: boolean;
  title?: string;
  /** 默认高度（内容多时会自动撑高） */
  minHeight?: number;
}>(), {
  readonly: false,
  invalid: false,
  title: '',
  minHeight: 150,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const taRef = ref<HTMLTextAreaElement>();
const hlRef = ref<HTMLPreElement>();
const showFull = ref(false);

/** 超过该长度的文本不做语法高亮，避免正则与高亮 DOM 卡死页面 */
const HIGHLIGHT_MAX_LEN = 100_000;

const highlighted = computed(() => {
  const text = props.modelValue;
  // 超大文本跳过高亮：逐 token 正则替换 + 高亮 DOM 会拖垮页面
  if (text.length > HIGHLIGHT_MAX_LEN) {
    return escapeHtml(text);
  }
  return highlightJson(text);
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** JSON 语法高亮（先转义 HTML，再按 token 着色） */
function highlightJson(text: string): string {
  if (!text) {
    return '';
  }
  const escaped = escapeHtml(text);
  return escaped.replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'j-num';
      if (match.startsWith('"')) {
        cls = match.trimEnd().endsWith(':') ? 'j-key' : 'j-str';
      } else if (/^(true|false)$/.test(match)) {
        cls = 'j-bool';
      } else if (match === 'null') {
        cls = 'j-null';
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
  autoResize();
}

/** textarea 高度自适应内容，避免内部滚动条 */
function autoResize() {
  const ta = taRef.value;
  if (!ta) {
    return;
  }
  ta.style.height = 'auto';
  const height = ta.scrollHeight;
  ta.style.height = `${height}px`;
  if (hlRef.value) {
    hlRef.value.style.height = `${height}px`;
  }
}

/** 紧凑格式化：2 空格缩进；非 JSON 保持原样 */
function format() {
  try {
    emit('update:modelValue', JSON.stringify(JSON.parse(props.modelValue), null, 2));
  } catch {
    // 非合法 JSON 时保持原样
  }
  nextTick(autoResize);
}

function expand() {
  showFull.value = true;
}

/** 复制当前框内容到剪贴板 */
async function copy() {
  const text = props.modelValue ?? '';
  if (!text) {
    message.warning('内容为空');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

onMounted(() => nextTick(autoResize));
watch(() => props.modelValue, () => nextTick(autoResize));
</script>

<style scoped>
.ecu-json {
  position: relative;
  flex: 1 1 auto;
  min-height: var(--json-min-h, 150px);
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background-color: #ffffe1;
}

.ecu-json.invalid {
  border-color: #d03050;
}

.hl,
.ta {
  margin: 0;
  padding: 2px 4px;
  border: 0;
  box-sizing: border-box;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.15;
  white-space: pre-wrap;
  word-break: break-all;
}

.hl {
  color: #333;
}

/* 可编辑时的高亮层：覆盖在 textarea 上，不占文档流 */
.overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ta {
  display: block;
  width: 100%;
  min-height: var(--json-min-h, 150px);
  overflow: hidden;
  background: transparent;
  color: transparent;
  caret-color: #333;
  outline: none;
  resize: none;
}

.tool-bar {
  position: absolute;
  top: 1px;
  right: 2px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 2px;
  border-radius: 2px;
  background: rgba(255, 255, 225, 0.92);
}

.tool-bar :deep(.n-button) {
  color: #888;
  font-size: 11px;
}

.tool-bar :deep(.n-button:hover) {
  color: #18a058;
}

/* 语法配色 */
.hl :deep(.j-key) { color: #0451a5; }
.hl :deep(.j-str) { color: #a31515; }
.hl :deep(.j-num) { color: #098658; }
.hl :deep(.j-bool) { color: #0000ff; }
.hl :deep(.j-null) { color: #0000ff; }

.full-view {
  height: calc(90vh - 110px);
  padding: 4px 6px;
  border: 1px solid #e0e0e6;
  border-radius: 3px;
  background-color: #ffffe1;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.25;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
}
</style>