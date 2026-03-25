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
        label: '设备网关(透传)',
        valueFn: (data) => {
            return data.gateway;
        },
    }, {
        label: 'server',
        valueFn: (data) => {
            return data.server;
        },
    }
    ,
    // {
    //     label: 'DB-当前环境',
    //     valueFn: (data) => {
    //         return data.tenant_info.db_env ? data.tenant_info.db_env : '-';
    //     },
    // },
    {
        label: 'DB-租户ID',
        valueFn: (data) => {
            return data.tenant_info?.tenant_id ?? '-';
        },
    },
    {
        label: 'DB-租户名称',
        valueFn: (data) => {
            return data.tenant_info?.tenant_name ?? '-';
        }
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

const STORAGE_KEY = 'RENTAL:DEVICE_HISTORY:v2';

interface RentalHistoryItem {
    imei: string;
    type: number;
}

const history = ref<RentalHistoryItem[]>([]);

function getTypeShortLabel(type: number): string {
    if (type === 3) return '共享';
    if (type === 2) return '智能';
    if (type === 1) return '电柜';
    return '共享';
}

function historyClick(item: RentalHistoryItem) {
    imei.value = item.imei;
    dType.value = item.type;
    deviceInfo.value = null;
    // queryImei()
}

/**
 * 在新标签页打开租户 domain
 */
function openTenantDomain() {
    const domain = deviceInfo.value?.tenant_info?.domain;
    if (!domain) return;
    const url = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

function addToHistory(item: RentalHistoryItem) {
    const currentImei = item?.imei?.trim();
    const currentType = Number(item?.type);
    if (!currentImei) return;
    if (![1, 2, 3].includes(currentType)) return;

    const existedIndex = history.value.findIndex((h) => h.imei === currentImei);
    if (existedIndex !== -1) {
        history.value.splice(existedIndex, 1);
    }
    history.value.unshift({ imei: currentImei, type: currentType });
    if (history.value.length > 24) {
        history.value.pop();
    }
}

function loadHistory() {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            if (Array.isArray(parsed)) {
                history.value = parsed
                    .map((x: unknown) => {
                        if (!x || typeof x !== 'object') return null;
                        const raw = x as Record<string, unknown>;
                        const nextImei = typeof raw.imei === 'string' ? raw.imei.trim() : '';
                        const nextType = typeof raw.type === 'number' ? raw.type : Number(raw.type);
                        if (!nextImei) return null;
                        if (![1, 2, 3].includes(nextType)) return null;
                        return { imei: nextImei, type: nextType } as RentalHistoryItem;
                    })
                    .filter((x: RentalHistoryItem | null): x is RentalHistoryItem => x != null);
            }
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

// 监听输入框变化，清空切车记录和基本信息
watch(imei, () => {
    deviceLogs.value = [];
    deviceInfo.value = null;
});


const showModal = ref(false);

const targetEnv = ref();
const customServer = ref("");
const tenantID = ref();
const dType = ref(3);
const CUSTOM_SERVER_ENV = "custom_server";

const DEVICE_TYPE_ARRAY = [
    { 'value': 3, name: '共享协议中控' },
    { 'value': 2, name: '智能协议中控' },
    { 'value': 1, name: '电柜' },
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
    },
    {
        label: '硬件生产',
        value: 'shengchan',
    },
    {
        label: '自定义server',
        value: CUSTOM_SERVER_ENV,
    }
];

const switchLoading = ref(false);

function showSwitchDialog() {
    showModal.value = true;
}

function swithDevice() {
    if (targetEnv.value === CUSTOM_SERVER_ENV && !customServer.value.trim()) {
        message.error("请选择自定义server后，请填写server");
        return;
    }
    switchLoading.value = true;
    // 要发送的数据对象
    const data = {
        imei: imei.value,
        target_env: targetEnv.value,
        server: targetEnv.value === CUSTOM_SERVER_ENV ? customServer.value.trim() : "",
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

watch(targetEnv, (value) => {
    if (value !== CUSTOM_SERVER_ENV) {
        customServer.value = "";
    }
});


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
                addToHistory({
                    imei: typeof response.data.imei === 'string' ? response.data.imei : imei.value,
                    type: response.data.type,
                });

            } else {
                message.error(response.msg);
            }
        }).catch((error) => {
            message.error(`未知错误:${error}`);// 处理错误
        }).finally(() => {
            queryLoading.value = false;
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
                <n-tag
                    class="history-tag"
                    @click="historyClick(item)"
                    mt-4
                    mr-3
                    size="small"
                    v-for="(item, index) in history"
                    :key="`${item.type}-${item.imei}`"
                    closable
                    @close="handleClose(index)"
                >
                    <div class="history-tag-content">
                        <span class="history-tag-type" :class="`history-tag-type-${item.type}`">
                            {{ getTypeShortLabel(item.type) }}
                        </span>
                        <span class="history-tag-imei">{{ item.imei }}</span>
                    </div>
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
                                <n-button
                                    v-if="label === 'DB-租户名称' && deviceInfo?.tenant_info?.domain"
                                    quaternary
                                    size="small"
                                    type="primary"
                                    style="margin-left: 8px;"
                                    @click="openTenantDomain"
                                >
                                    去后台
                                </n-button>
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
                    <n-input
                        v-if="targetEnv === CUSTOM_SERVER_ENV"
                        v-model:value="customServer"
                        style="margin-top: 8px"
                        placeholder="请输入 server，例如：112.74.77.182:9880"
                    />
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

:deep(.history-tag) {
    background: transparent !important;
    border: none !important;
    padding: 0 6px 0 2px !important;
}

.history-tag-content {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(27, 31, 36, 0.15);
    border-radius: 4px;
    overflow: hidden;
    font-size: 12px;
    line-height: 18px;
    margin-right: 4px;
}

.history-tag-type {
    font-weight: 700;
    padding: 2px 8px;
    color: #ffffff;
    background: var(--badge-type-bg);
}

.history-tag-imei {
    font-weight: 600;
    padding: 2px 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    background: var(--badge-imei-bg);
    color: #1f2937;
}

.history-tag-type-3 {
    --badge-type-bg: #2da44e;
    --badge-imei-bg: rgba(45, 164, 78, 0.12);
}

.history-tag-type-2 {
    --badge-type-bg: #0969da;
    --badge-imei-bg: rgba(9, 105, 218, 0.12);
}

.history-tag-type-1 {
    --badge-type-bg: #b62324;
    --badge-imei-bg: rgba(182, 35, 36, 0.12);
}
</style>
