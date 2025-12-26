<script setup lang="ts">
import { createDiscreteApi, useDialog } from 'naive-ui';
import { Search, SwitchHorizontal } from '@vicons/tabler';
import {
  formatISO9075,
} from 'date-fns';
import InputCopyable from '../../components/InputCopyable.vue';
import { getJSONValueByPath } from '@/utils/json';
import { getDeviceLogAPI, queryEBikeAPI, switchEbikeAPI, cmdEbikeAPI } from '@/api/device';
// Load history when component is mounted
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
  {
      label: '设备协议',
      valueFn: (data) => {
          if (data.current_env_name === 'shengchan') {
              return '';
          }
          return data.device_raw?.data?.deviceProtocol;
      },
  },
  {
    label: '上次在线时间',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return '';
      }
      try {
        return formatISO9075(new Date(data.device_raw.data?.lastOnlineTime));
      } catch (e) {
        return '';
      }   
    },
  },
  {
    label: '经纬度',
    // value: 'device_raw.data.updateAt',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return `${data.c34_raw.result?.gps?.lng},${data.c34_raw.result?.gps?.lat}`;
      }
      return `${data.device_raw?.data?.lng},${data.device_raw?.data?.lat}`;
    },
  },
  {
    label: '电门状态(acc)',
    // value: 'device_raw.data.updateAt',
    valueFn: (data) => {
      if (data.current_env_name === 'shengchan') {
        return `${data.c34_raw.result?.acc}`;
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
import { formatRelativeTime } from '@/utils/datetime'
function isFifteenDigitNumber(value: string): boolean {
  // if (value === '') {
  //   return true;
  // }
  // 检查字符串长度是否为15
  if (value.length !== 15) {
    return false;
  }
  // 检查字符串是否全部为数字
  return /^\d+$/.test(value);
}

const urlValidationRules = [
  {
    validator: (value: string) => isFifteenDigitNumber(value),
    message: '',
  },
];

const STORAGE_KEY = 'EBIKE:IMEI:HISTORY';
const history = ref([]);
const deviceLogs = ref([]);

function historyClick(item) {
  imei.value = item;
  deviceInfo.value = null;
  // queryImei()
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

// Watch for changes in history and save to localStorage
watch(history, () => {
  saveHistory();
}, { deep: true });


const showModal = ref(false);

const targetEnv = ref();
const tenantID = ref();
const server = ref();

const envs = [
  {
    label: 'UAT',
    value: 'uat',
  },
  {
    label: 'PROD',
    value: 'prod',
  },
  {
    label: 'PROD2',
    value: 'prod2',
  },
  // {
  //   label: 'DIDI',
  //   value: 'didi',
  // },
  {
    label: 'DEV',
    value: 'dev',
  },
  {
    label: 'TEST2',
    value: 'test2',
  },
  {
    label: '硬件生产',
    value: 'shengchan',
  },
  {
    label: '自定义Server',
    value: 'server',
  },
];

const switchLoading = ref(false);

watch(targetEnv, (val) => {
  if (val === 'uat') tenantID.value = 5;
  else if (val === 'prod') tenantID.value = 2;
  else if (val === 'prod2') tenantID.value = 1;
  else if (val === 'dev') tenantID.value = 1;
  else if (val === 'test2') tenantID.value = 1;
  else tenantID.value = undefined;
});

function showSwitchDialog() {
  showModal.value = true;
}

function swithDevice() {
  switchLoading.value = true;
  // 要发送的数据对象
  const data = {
    imei: imei.value,
    target_env: targetEnv.value,
    tenant_id: tenantID.value,
    source: 'xattp',
    server: server.value,
  };
  // 发送POST请求
  switchEbikeAPI(data)
    .then(response => {
      if (response.code == 0) {
        message.success(response.data); // 处理成功响应的数据
        showModal.value = false;
        deviceInfo.value = null;
      } else {
        message.error(response.msg || response.msg.result);
      }
    })
    .catch(error => {
      message.error('未知错误:' + error);// 处理错误
    }).finally(() => {
      switchLoading.value = false;
      deviceLogs.value = []
    });
}


function queryImei() {
  queryLoading.value = true;
  deviceInfo.value = null;
  //查询历史
  getDeviceLogAPI({ imei: imei.value, size: 5 }).then((res) => {
    deviceLogs.value = res.data;
  });

  // 发送POST请求
  queryEBikeAPI({ imei: imei.value }).then((response) => {
    if (response.code === 0) {
      deviceInfo.value = response.data;
    } else {
      message.error(response.msg);
    }
  }).catch((error) => {
    message.error(`未知错误:${error}`);// 处理错误
  }).finally(() => {
    queryLoading.value = false;
    addToHistory();
  });
}


function handleReboot() {

  const data = {
    "deviceProtocol": "xiaoan_ebike",
    "async": false,
    "imei": imei.value,
    "cmd": {
      "c": 21
    }
  }
  // 发送POST请求
  cmdEbikeAPI(data)
    .then(response => {
      if (response.code == 0) {
        message.success("C21重启指令发送成功"); // 处理成功响应的数据
      } else {
        message.error(response.msg || response.msg.result);
      }
    })
    .catch(error => {
      message.error('未知错误:' + error);// 处理错误
    }).finally(() => {
    });
}


// 通用JSON弹窗逻辑
const showJsonModal = ref(false)
const jsonModalTitle = ref('')
const jsonModalData = ref<any>(null)

function openJsonModal(type: 'device' | 'c16' | 'c34') {
  if (!deviceInfo.value) return;
  if (type === 'device') {
    jsonModalTitle.value = '共享设备信息（getByImei）';
    jsonModalData.value = deviceInfo.value.device_raw;
  } else if (type === 'c16') {
    jsonModalTitle.value = 'C16数据';
    jsonModalData.value = deviceInfo.value.c16_raw;
  } else if (type === 'c34') {
    jsonModalTitle.value = 'C34数据';
    jsonModalData.value = deviceInfo.value.c34_raw;
  }
  showJsonModal.value = true;
}
</script>

<template>
  <div>
    <c-card>
      <div flex gap-2>
        <c-input-text v-model:value.trim="imei" placeholder="请输入15位的IMEI设备号" raw-text
          :validation-rules="urlValidationRules" clearable @keyup.enter="queryImei" />
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
          切车
        </n-button>
      </div>
      <div>
        <n-tag @click="historyClick(item)" mt-4 mr-3 size="small" v-for="(item, index) in history" :key="index" closable
          @close="handleClose(index)">
          {{ item }}
        </n-tag>
      </div>
    </c-card>


    <div class="ebike-cards-row">
      <c-card title="基本信息" v-if="deviceInfo" class="ebike-card info-card">
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
      <c-card v-if="deviceInfo && deviceLogs.length > 0" title="切车记录" class="ebike-card log-card">
        <div class="ebike-card-scroll">
          <n-list>
            <n-list-item v-for="deviceLog in deviceLogs">
              👤<span>{{ deviceLog.create_user_name }}</span> <span :title="deviceLog.create_datetime">🕙{{
                formatRelativeTime(deviceLog.create_datetime) }}</span> 切到
              <n-tag size="small" type="warning"> {{ deviceLog.target_env_name }}</n-tag><span
                v-if="deviceLog.target_tenant_id"></span><n-tag v-if="deviceLog.target_tenant_id" size="small"
                type="warning"> {{
                  deviceLog.target_tenant_id }}</n-tag>
            </n-list-item>
          </n-list>
        </div>
      </c-card>
      <c-card title="其他" v-if="deviceInfo" class="ebike-card other-card">
        <n-flex vertical>
          <n-button @click="() => openJsonModal('device')" size="tiny">共享信息</n-button>
          <n-button @click="() => openJsonModal('c16')" size="tiny">C16数据</n-button>
          <n-button @click="handleReboot" size="tiny">C21重启</n-button>
          <n-button @click="() => openJsonModal('c34')" size="tiny">C34数据</n-button>
        </n-flex>
      </c-card>

    <!-- 通用JSON弹窗 -->
    <n-modal v-model:show="showJsonModal" preset="dialog">
      <template #header>
        <span>{{ jsonModalTitle }}</span>
      </template>
      <div style="max-width:600px;overflow:auto;">
        <pre class="json-viewer">{{ JSON.stringify(jsonModalData, null, 2) }}</pre>
      </div>
    </n-modal>
    </div>


    <n-modal-provider>
      <n-modal v-model:show="showModal" preset="dialog" @positive-click="swithDevice">

        <template #header>
          <div>快速切设备环境</div>
        </template>
        <div>
          <p>将设备号 {{ imei }} 切换到环境：</p>

          <n-select placeholder="请选择环境" v-model:value="targetEnv" :options="envs" />

          <div v-if="targetEnv != 'shengchan' && targetEnv != 'server'">
            租户ID :
            <n-input-number v-model:value.trim="tenantID" :show-button="false" placeholder="请输入租户ID" clearable />
          </div>
          <div v-if="targetEnv == 'server'">
            Server地址 :
            <n-input v-model:value.trim="server" :show-button="false" placeholder="请输入自定义的server地址" clearable />
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

/* 卡片横向排列，适配大屏 */
.ebike-cards-row {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 16px;
  align-items: stretch;
  width: 100%;
  min-height: 420px;
}
.ebike-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  background: #fff;
  min-width: 0;
  flex: 1 1 0;
  min-height: 100%;
}
.info-card {
  flex: 12 10 0;
  min-width: 240px;
  max-width: none;
}
.log-card {
  flex: 10 10 0;
  min-width: 200px;
  max-width: none;
}
.other-card {
  flex: 2 2 0;
  min-width: 120px;
  max-width: none;
}




.ebike-card-scroll {
  flex: 1 1 0;
  max-height: 340px;
  overflow-y: auto;
}
</style>
.json-viewer {
  font-size: 10px;
  background: #f7f7f7;
  color: #333;
  padding: 2px 10px;
  margin: 2px 0 8px 0;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
  line-height: 0.9;
}
.ebike-card-empty {
  color: #aaa;
  text-align: center;
  padding: 48px 0;
  font-size: 15px;
}
