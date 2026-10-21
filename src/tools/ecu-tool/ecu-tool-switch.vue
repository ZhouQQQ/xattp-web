<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="切车"
    class="ecu-switch-modal"
    :style="{ width: '430px' }"
    size="small"
    :bordered="false"
  >
    <div class="ecu-switch">
      <div class="row">
        <span class="lb">IMEI：</span>
        <span class="imei">{{ imei || '（请先在上方输入 IMEI）' }}</span>
      </div>
      <div class="row">
        <span class="lb">目标环境：</span>
        <n-select v-model:value="targetEnv" size="small" class="grow" :options="envs" placeholder="请选择目标环境" :consistent-menu-width="false" />
      </div>
      <div class="row">
        <span class="lb">租户ID：</span>
        <n-input-number
          v-model:value="tenantID"
          size="small"
          class="grow"
          :show-button="false"
          placeholder="请输入租户ID"
          clearable
        />
      </div>
      <div v-if="targetEnv === 'server'" class="row">
        <span class="lb">Server：</span>
        <n-input v-model:value="server" size="small" class="grow" placeholder="请输入 server 地址" />
      </div>
      <div class="row actions">
        <n-button size="small" @click="visible = false">
          取消
        </n-button>
        <n-button size="small" type="primary" :loading="loading" :disabled="!canSubmit" @click="submit">
          切换
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import { switchEbikeAPI } from '@/api/device';

/**
 * 切车弹窗：参数与流程复用 ebike-switch 工具的既有逻辑
 * （环境列表、租户默认值联动、switchEbikeAPI 提交）。
 */
const props = withDefaults(defineProps<{
  show?: boolean;
  imei?: string;
}>(), {
  show: false,
  imei: '',
});

const emit = defineEmits<{ (e: 'update:show', value: boolean): void }>();

const { message } = createDiscreteApi(['message']);

const visible = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
});

const targetEnv = ref<string | null>(null);
const tenantID = ref<number | null>(null);
const server = ref<string | null>(null);
const loading = ref(false);

/** 与 ebike-switch 工具一致的切车环境列表 */
const envs = [
  { label: 'uat', value: 'uat' },
  { label: 'prod', value: 'prod' },
  { label: 'prod2', value: 'prod2' },
  { label: 'prod-sg(新加坡)', value: 'prod-sg' },
  { label: 'dev', value: 'dev' },
  { label: 'test2', value: 'test2' },
  { label: '硬件生产', value: 'shengchan' },
  { label: '独立部署-云江出行', value: 'yunjiang' },
  { label: '独立部署-圣庄出行', value: 'shengzhuang' },
  { label: '独立部署-北斗千行', value: 'bdqx' },
  { label: '独立部署-骑宜骑', value: 'qiyiqi' },
  { label: '独立部署-飞凡', value: 'feifan' },
  { label: '自定义Server', value: 'server' },
];

/** 目标环境变化时联动默认租户（与 ebike-switch 相同） */
watch(targetEnv, (val) => {
  if (val === 'uat') tenantID.value = 5;
  else if (val === 'prod') tenantID.value = 2;
  else if (val === 'prod2') tenantID.value = 1;
  else if (val === 'prod-sg') tenantID.value = 4164;
  else if (val === 'dev') tenantID.value = 1;
  else if (val === 'test2') tenantID.value = 1;
  else if (val === 'yunjiang') tenantID.value = 1955;
  else if (val === 'yinchuan') tenantID.value = 1752;
  else if (val === 'chengfayou') tenantID.value = 2233;
  else if (val === 'shengzhuang') tenantID.value = 2654;
  else if (val === 'bdqx') tenantID.value = 2719;
  else if (val === 'qiyiqi') tenantID.value = 250;
  else if (val === 'feifan') tenantID.value = 2001;
  else if (val === 'shengchan') tenantID.value = undefined as never;
  else tenantID.value = undefined as never;
});

const canSubmit = computed(() => /^\d{15}$/.test(props.imei) && !!targetEnv.value);

function submit() {
  if (!canSubmit.value) {
    message.warning('请先填写 15 位 IMEI 并选择目标环境');
    return;
  }
  loading.value = true;
  const data = {
    imei: props.imei,
    target_env: targetEnv.value,
    tenant_id: tenantID.value,
    source: 'xattp',
    server: server.value,
  };
  switchEbikeAPI(data)
    .then((response: { code?: number; msg?: string; data?: string }) => {
      if (Number(response?.code) === 0) {
        message.success(response.data || '切车成功');
        visible.value = false;
      } else {
        message.error(response?.msg || '切车失败');
      }
    })
    .catch((error: unknown) => {
      message.error(`未知错误:${error}`);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<style scoped>
.ecu-switch {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.ecu-switch .row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ecu-switch .lb {
  flex: 0 0 72px;
  text-align: right;
  color: #555;
}

.ecu-switch .imei {
  color: #18a058;
  font-family: Consolas, Monaco, monospace;
}

.ecu-switch .grow {
  flex: 1;
}

.ecu-switch .actions {
  justify-content: flex-end;
  margin-top: 4px;
}
</style>