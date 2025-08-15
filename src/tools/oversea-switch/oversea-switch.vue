<script setup lang="ts">
import { createDiscreteApi, useDialog } from 'naive-ui';
import { Search, SwitchHorizontal } from '@vicons/tabler';
import InputCopyable from '../../components/InputCopyable.vue';
import { getJSONValueByPath } from '@/utils/json';
import { getDeviceLogAPI, queryOverseaAPI, switchOverseaAPI } from '@/api/device';
import { formatISO9075 } from 'date-fns';
import { formatRelativeTime } from '@/utils/datetime';

onMounted(() => {
  loadHistory();
});

const imei = ref('');
const { message, dialog } = createDiscreteApi(['message', 'dialog']);

const properties = [
  {
    label: '设备所在环境',
    valueFn: (data) => {
      return data.current_env_name;
    },
  },
  // {
  //     label: '设备server(c16)',
  //     valueFn: (data) => {
  //         return data.c16_raw.result.server;
  //     },
  // },
  {
    label: '当前租户ID',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return '';
      }
      return data.device_raw.data?.tenantId;
    },
  },
  {
    label: '当前租户描述',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return '';
      }
      return data.device_raw?.data?.tenantDesc;
    },
  },
  {
    label: '设备类型',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return '';
      }
      return data.device_raw?.data?.deviceType;
    },
  },
  // {
  //     label: '设备协议',
  //     valueFn: (data) => {
  //         if (data.current_env_name === 'shengchan') {
  //             return '';
  //         }
  //         return data.device_raw?.data?.deviceProtocol;
  //     },
  // },
  {
    label: '上次在线时间',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return '';
      }
      const date = new Date(data.device_raw.data?.lastOnlineTime);
      return formatISO9075(date);
    },
  },
  {
    label: '经纬度',
    // value: 'device_raw.data.updateAt',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return `${data.c34_raw.result.gps.lng},${data.c34_raw.result.gps.lat}`;
      }
      return `${data.device_raw?.data?.lng},${data.device_raw?.data?.lat}`;
    },
  },
  {
    label: '电门状态(acc)',
    // value: 'device_raw.data.updateAt',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return `${data.c34_raw.result.acc}`;
      }
      return `${data.device_raw?.data?.acc}`;
    },
  },
  {
    label: '电压',
    // value: 'device_raw.data.updateAt',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return `${data.c34_raw.result.voltage}`;
      }
      return `${data.device_raw?.data?.voltage}`;
    },
  },
];

const deviceInfo = ref(null);
const queryLoading = ref(false);
function isFifteenDigitNumber(value: string): boolean {
  return value.length === 15 && /^\d+$/.test(value);
}

const urlValidationRules = [
  {
    validator: (value: string) => isFifteenDigitNumber(value),
    message: '',
  },
];

const STORAGE_KEY = 'OVERSEA:IMEI:HISTORY';
const history = ref([]);
const deviceLogs = ref([]);

function historyClick(item) {
  imei.value = item;
  deviceInfo.value = null;
}

function addToHistory() {
  if (imei.value && !history.value.includes(imei.value)) {
    history.value.unshift(imei.value);
    if (history.value.length > 24) {
      history.value.pop();
    }
  }
}

function loadHistory() {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      history.value = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value));
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
}

function handleClose(index) {
  history.value.splice(index, 1);
}

watch(history, () => {
  saveHistory();
}, { deep: true });

const showModal = ref(false);
const targetEnv = ref();
const tenantID = ref();

const envs = [
  {
    label: '海外dev',
    value: 'oversea-dev',
  },
  {
    label: '海外线上新加坡',
    value: 'oversea-prod-sg',
  },
  {
    label: '海外线上法兰克福',
    value: 'oversea-prod-fk',
  },
  {
    label: '硬件生产',
    value: 'shengchan',
  }
];

const switchLoading = ref(false);

watch(targetEnv, (val) => {
  if (val === 'oversea-dev') tenantID.value = 1;
  else tenantID.value = undefined;
});

function showSwitchDialog() {
  showModal.value = true;
}

function swithDevice() {
  switchLoading.value = true;
  const data = {
    imei: imei.value,
    target_env: targetEnv.value,
    tenant_id: tenantID.value.toString(),
    source: 'xattp',
  };
  switchOverseaAPI(data)
    .then(response => {
      if (response.code == 0) {
        message.success(response.data);
        showModal.value = false;
        deviceInfo.value = null;
      } else {
        message.error(response.msg || response.msg.result);
      }
    })
    .catch(error => {
      message.error('未知错误:' + error);
    }).finally(() => {
      switchLoading.value = false;
      deviceLogs.value = []
    });
}

function queryImei() {
  queryLoading.value = true;
  deviceInfo.value = null;
  getDeviceLogAPI({ imei: imei.value, size: 5 }).then((res) => {
    deviceLogs.value = res.data;
  });
  queryOverseaAPI({ imei: imei.value }).then((response) => {
    if (response.code === 0) {
      deviceInfo.value = response.data;
    } else {
      message.error(response.msg);
    }
  }).catch((error) => {
    message.error(`未知错误:${error}`);
  }).finally(() => {
    queryLoading.value = false;
    addToHistory();
  });
}
</script>

<template>
  <div>
    <c-card>
      <div flex gap-2>
        <c-input-text v-model:value.trim="imei" placeholder="请输入15位的IMEI设备号" raw-text
          :validation-rules="urlValidationRules" clearable />
        <n-button class="click-button" :loading="queryLoading" @click="queryImei"
          :disabled="!isFifteenDigitNumber(imei)">
          <template #icon>
            <n-icon>
              <Search />
            </n-icon>
          </template>
          查询
        </n-button>
        <n-button class="click-button" @click="showSwitchDialog" :disabled="!isFifteenDigitNumber(imei)">
          <template #icon>
            <n-icon>
              <SwitchHorizontal />
            </n-icon>
          </template>
          切换
        </n-button>
      </div>
      <div>
        <n-tag @click="historyClick(item)" mt-4 mr-3 size="small" v-for="(item, index) in history" :key="index"
          closable @close="handleClose(index)">
          {{ item }}
        </n-tag>
      </div>
    </c-card>

    <n-flex mt-2 justify="start">
      <c-card title="基本信息" v-if="deviceInfo">
        <n-table>
          <tbody>
            <tr v-for="{ label, valueFn } in properties" :key="label">
              <td font-bold v-if="valueFn(deviceInfo)">
                <span>{{ label }}</span>
              </td>
              <td v-if="valueFn(deviceInfo)">
                <span-copyable v-if="valueFn(deviceInfo)" :value="`${valueFn(deviceInfo)}`" />
                <span v-else op-80>
                  -
                </span>
              </td>
            </tr>
          </tbody>
        </n-table>
      </c-card>
      <c-card title="切换记录" v-if="deviceLogs.length > 0">
        <n-list>
          <n-list-item v-for="deviceLog in deviceLogs">
            👤<span>{{ deviceLog.create_user_name }}</span> <span
              :title="deviceLog.create_datetime">🕙{{ formatRelativeTime(deviceLog.create_datetime) }}</span> 切到
            <n-tag size="small" type="warning"> {{ deviceLog.target_env_name }}</n-tag><span
              v-if="deviceLog.target_tenant_id">-</span><n-tag v-if="deviceLog.target_tenant_id" size="small"
              type="warning"> {{
                deviceLog.target_tenant_id }}</n-tag>
          </n-list-item>
        </n-list>
      </c-card>
    </n-flex>

    <n-modal-provider>
      <n-modal v-model:show="showModal" preset="dialog" @positive-click="swithDevice">
        <template #header>
          <div>快速切换设备环境</div>
        </template>
        <div>
          <p>将设备号 {{ imei }} 切换到环境：</p>
          <n-select placeholder="请选择环境" v-model:value="targetEnv" :options="envs" />
          <div>
            租户ID :
            <n-input-number v-model:value.trim="tenantID" :show-button="false" placeholder="请输入租户ID" clearable />
          </div>
        </div>
        <template #action>
          <div>
            <n-button strong size="large" :loading="switchLoading" @click="swithDevice">
              确定切换
            </n-button>
          </div>
        </template>
      </n-modal>
    </n-modal-provider>
  </div>
</template>

<style lang="less" scoped>
.n-input-group-label {
  text-align: right;
}

.n-input-group {
  margin: 2px 0;
}

.click-button:hover {
  cursor: pointer;
}
</style>
