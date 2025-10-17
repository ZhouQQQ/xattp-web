<script setup lang="ts">
import { createDiscreteApi } from 'naive-ui';
import { Search, SwitchHorizontal } from '@vicons/tabler';
import { getDeviceLogAPI, switchRentalAPI, queryRentalAPI } from '@/api/device';
import { formatRelativeTime } from '@/utils/datetime';
import {
    formatISO9075,
} from 'date-fns';
import InputCopyable from '../../components/InputCopyable.vue';
import { getJSONValueByPath } from '@/utils/json';

// Load history when component is mounted
onMounted(() => {
    loadHistory();
});


const imei = ref('');

const { message } = createDiscreteApi(['message']);


const properties = [
    {
        label: '当前环境',
        valueFn: (data) => {
            return data.env_name;
        },
    },
    {
        label: '设备类型',
        valueFn: (data) => {
            return data.type_name;
        },
    }, {
        label: '设备网关',
        valueFn: (data) => {
            return data.gateway;
        },
    }, {
        label: 'server',
        valueFn: (data) => {
            return data.server;
        },
    }
];

const deviceInfo = ref(null);
const queryLoading = ref(false);
const deviceLogs = ref([]);

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

const STORAGE_KEY = 'RENTAL:IMEI:HISTORY';
const history = ref([]);

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
const dType = ref(1);

const DEVICE_TYPE_ARRAY = [
    { 'value': 1, name: '电柜' },
    { 'value': 2, name: '智能协议中控' },
    { 'value': 3, name: '共享协议中控(新网关)' },
];

const envs = [
    {
        label: 'PROD (生产线上，新客户常用)',
        value: 'prod',
    },
    {
        label: 'UAT ',
        value: 'uat',
    },
    {
        label: 'TEST ',
        value: 'test',
    },
    {
        label: 'DEV',
        value: 'dev',
    }
];

const switchLoading = ref(false);

function showSwitchDialog() {
    showModal.value = true;
}

function swithDevice() {
    switchLoading.value = true;
    // 要发送的数据对象
    const data = {
        imei: imei.value,
        target_env: targetEnv.value,
        type: dType.value,
        source: 'xattp',
    };


    // 发送POST请求
    switchRentalAPI(data)
        .then(response => {
            if (response.code == 0) {
                message.success(response.data); // 处理成功响应的数据
                showModal.value = false;
                deviceInfo.value = null;
                // queryImei();
            } else {
                message.error(response.msg);
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
    queryRentalAPI({ imei: imei.value, type: dType.value })
        .then((response) => {
            if (response.code === 0) {
                deviceInfo.value = response.data;
                if (dType.value != response.data.type) {
                    message.warning(`该设备可能是一个 ${response.data.type_name}`);
                }
                dType.value = response.data.type;

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
</script>

<template>
    <div>
        <c-card>
            <div flex gap-2>
                <c-input-text trim v-model:value.trim="imei" placeholder="请输入15位的IMEI设备号" raw-text
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
                    切换
                </n-button>
            </div>
            <n-radio-group style="margin-top:5px" v-model:value="dType" name="deviceType">
                <n-radio v-for="type in DEVICE_TYPE_ARRAY" :value="type.value" :name="type.name">
                    {{ type.name }}
                </n-radio>
            </n-radio-group>
            <div>
                <n-tag @click="historyClick(item)" mt-4 mr-3 size="small" v-for="(item, index) in history" :key="index"
                    closable @close="handleClose(index)">
                    {{ item }}
                </n-tag>
            </div>
        </c-card>
        <n-flex mt-2 justify="start">
            <c-card title="基本信息" mt-1 v-if="deviceInfo">
                <!-- <InputCopyable placeholder="" label="设备当前环境" :value="deviceInfo?.current_env_name" readonly label-position="left"
                  label-width="200px" mb-2 /> -->

                <n-table>
                    <tbody>
                        <tr v-for="{ label, valueFn } in properties" :key="label">
                            <td font-bold>
                                {{ label }}
                            </td>
                            <td>
                                <span-copyable v-if="valueFn(deviceInfo)" :value="`${valueFn(deviceInfo)}`" />
                                <span v-else op-80>
                                    -
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </n-table>

            </c-card>
            <c-card title="切车记录" v-if="deviceLogs.length > 0">
                <n-list>
                    <n-list-item v-for="deviceLog in deviceLogs">
                        👤<span>{{ deviceLog.create_user_name }}</span> <span :title="deviceLog.create_datetime">🕙{{
                            formatRelativeTime(deviceLog.create_datetime) }}</span>
                        切到
                        <n-tag size="small" type="warning"> {{ deviceLog.target_env_name }}</n-tag>

                    </n-list-item>
                </n-list>

            </c-card>
        </n-flex>
        <n-modal-provider>
            <n-modal v-model:show="showModal" preset="dialog" @positive-click="swithDevice">

                <template #header>
                    <div>快速切设备环境</div>
                </template>
                <div>
                    <p>将设备号 {{ imei }} 切换到环境：</p>

                    <n-select placeholder="请选择环境" v-model:value="targetEnv" :options="envs" />
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
