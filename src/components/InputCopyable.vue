<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { useCopy } from '@/composable/copy';

const props = withDefaults(
  defineProps<{
    value: string
    multiline?: boolean
    autosize?: boolean
    rows?: number | string
    monospace?: boolean
    placeholder?: string
    readonly?: boolean
  }>(),
  {
    multiline: false,
    autosize: false,
    rows: 3,
    monospace: false,
    placeholder: undefined,
    readonly: false,
  },
);
const emit = defineEmits(['update:value']);

const value = useVModel(props, 'value', emit);
const { copy, isJustCopied } = useCopy({ source: value, createToast: false });
const tooltipText = computed(() => isJustCopied.value ? '已复制!' : '复制');
</script>

<template>
  <c-input-text
    v-model:value="value"
    :multiline="multiline"
    :autosize="autosize"
    :rows="rows"
    :monospace="monospace"
    :placeholder="placeholder"
    :readonly="readonly"
  >
    <template #suffix>
      <c-tooltip :tooltip="tooltipText">
        <c-button circle variant="text" size="small" @click="copy()">
          <icon-mdi-content-copy />
        </c-button>
      </c-tooltip>
    </template>
  </c-input-text>
</template>
