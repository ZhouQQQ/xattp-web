<template>
  <div class="rental-meituan-token-container">
    <n-card>
      <n-form :model="formData" label-placement="left" label-width="100">
        <n-form-item label="美团门店ID" path="meituan_shop_id">
          <n-input
            v-model:value="formData.meituan_shop_id"
            placeholder="例如 A582IS3LI098EB00VFECFV0L3BS"
            clearable
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="loading" @click="handleFetch">
            获取 token
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card class="result-card" title="查询结果">
      <n-descriptions
        class="meituan-result-desc"
        :column="1"
        label-placement="left"
        bordered
        size="small"
        :label-style="resultDescLabelStyle"
      >
        <n-descriptions-item label="店铺名称">
          {{ result?.meituan_shop_name || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="access_token">
          <div class="meituan-token-field">
            <InputCopyable
              v-model:value="tokenForCopy"
              multiline
              autosize
              :rows="4"
              monospace
              placeholder="查询成功后展示"
              readonly
            />
          </div>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import InputCopyable from '@/components/InputCopyable.vue';
import { rentalBusinessGetMeituanTokenAPI } from '@/api/device';

const { message } = createDiscreteApi(['message']);

type MeituanTokenData = {
  access_token?: string;
  meituan_shop_name?: string;
};

/** 查询结果表标签列宽度 */
const resultDescLabelStyle = {
  width: '120px',
  minWidth: '120px',
  maxWidth: '120px',
  paddingRight: '8px',
  verticalAlign: 'top' as const,
};

const formData = ref({
  meituan_shop_id: '',
});

const loading = ref(false);
const result = ref<MeituanTokenData | null>(null);
/** 与 InputCopyable 绑定，便于复制；成功查询后写入 */
const tokenForCopy = ref('');

watch(
  () => formData.value.meituan_shop_id,
  () => {
    result.value = null;
    tokenForCopy.value = '';
  },
);

async function handleFetch() {
  const meituan_shop_id = formData.value.meituan_shop_id?.trim();
  if (!meituan_shop_id) {
    message.warning('请输入美团门店ID');
    return;
  }

  try {
    loading.value = true;
    const res = (await rentalBusinessGetMeituanTokenAPI({ meituan_shop_id })) as {
      code?: number;
      msg?: string;
      data?: MeituanTokenData;
    };

    /** 请求期间若门店 ID 已改，丢弃本次结果，避免覆盖清空逻辑或展示错位 */
    if (formData.value.meituan_shop_id?.trim() !== meituan_shop_id) {
      return;
    }

    if (res.code === 0 && res.data) {
      result.value = res.data;
      tokenForCopy.value = res.data.access_token ?? '';
      message.success('获取成功');
    } else {
      result.value = null;
      tokenForCopy.value = '';
      message.error(res.msg || '获取失败');
    }
  } catch (e) {
    console.error('get_meituan_token:', e);
    if (formData.value.meituan_shop_id?.trim() === meituan_shop_id) {
      result.value = null;
      tokenForCopy.value = '';
      message.error('请求失败，请稍后重试');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
.rental-meituan-token-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  max-width: 100%;
}

.meituan-result-desc :deep(.n-descriptions-table-row > td:first-child) {
  width: 120px;
}

.meituan-token-field {
  width: 100%;
  min-width: 0;
}

/* 长 token 无空格时也能断行换行 */
.meituan-token-field :deep(textarea.input) {
  word-break: break-all;
  overflow-wrap: anywhere;
}
</style>
