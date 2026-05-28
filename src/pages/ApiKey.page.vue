<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { useHead } from "@vueuse/head";
import {
  NButton,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useCopy } from "@/composable/copy";
import InputCopyable from "@/components/InputCopyable.vue";
import {
  apiKeyCreateAPI,
  apiKeyDeleteAPI,
  apiKeyListAPI,
  apiKeyUpdateAPI,
  type ApiKeyRow,
} from "@/api/api-key";

useHead({ title: "API-Key 管理 - 小安测试工具平台" });

const message = useMessage();
const { copy } = useCopy({ createToast: false });

const loading = ref(false);
const list = ref<ApiKeyRow[]>([]);
const enabledFilter = ref<"all" | "enabled" | "disabled">("all");

const showFormModal = ref(false);
const formSubmitting = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: 0,
  name: "",
  permanent: true,
  expiresAt: null as number | null,
  enabled: true,
});

const showCreatedKeyModal = ref(false);
const createdKeyValue = ref("");
const expireMode = computed<"permanent" | "custom">({
  get: () => (form.permanent ? "permanent" : "custom"),
  set: (mode) => {
    form.permanent = mode === "permanent";
    if (form.permanent) {
      form.expiresAt = null;
    }
  },
});

function checkResCode(res: { code?: number; msg?: string } | null | undefined): boolean {
  if (res != null && Number(res.code) !== 0) {
    message.error(res.msg || "请求失败");
    return false;
  }
  return true;
}

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseExpiresAtToMs(value?: string | null): number | null {
  if (!value || !String(value).trim()) return null;
  const text = String(value).trim();
  const normalized = text.replace("T", " ").slice(0, 19);
  const ms = Date.parse(normalized.replace(/-/g, "/"));
  return Number.isFinite(ms) ? ms : null;
}

/** 快捷设置：在当前时间基础上增加若干个月 */
function setExpiresInMonths(months: number) {
  const base = new Date();
  const d = new Date(
    base.getFullYear(),
    base.getMonth() + months,
    base.getDate(),
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
  );
  form.permanent = false;
  form.expiresAt = d.getTime();
}

function formatExpiresDisplay(row: ApiKeyRow): string {
  if (!row.expires_at) return "永久有效";
  return row.expires_at;
}

async function fetchList() {
  loading.value = true;
  try {
    const params: { enabled?: string } = {};
    if (enabledFilter.value === "enabled") params.enabled = "true";
    if (enabledFilter.value === "disabled") params.enabled = "false";
    const res: any = await apiKeyListAPI(params);
    if (!checkResCode(res)) {
      list.value = [];
      return;
    }
    list.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e: any) {
    message.error(e?.message || String(e) || "加载失败");
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = 0;
  form.name = "";
  form.permanent = true;
  form.expiresAt = null;
  form.enabled = true;
}

function openCreateModal() {
  isEdit.value = false;
  resetForm();
  showFormModal.value = true;
}

function openEditModal(row: ApiKeyRow) {
  isEdit.value = true;
  form.id = row.id;
  form.name = row.name || "";
  const ms = parseExpiresAtToMs(row.expires_at);
  form.permanent = ms == null && !row.expires_at;
  form.expiresAt = ms;
  form.enabled = row.enabled !== false;
  showFormModal.value = true;
}

function buildExpiresPayload(): string | null | undefined {
  if (form.permanent) return null;
  if (form.expiresAt == null) return null;
  return formatDateTime(form.expiresAt);
}

async function handleFormSubmit() {
  formSubmitting.value = true;
  try {
    if (isEdit.value) {
      const res: any = await apiKeyUpdateAPI({
        id: form.id,
        name: form.name.trim() || null,
        expires_at: buildExpiresPayload(),
        enabled: form.enabled,
      });
      if (!checkResCode(res)) return;
      message.success("已更新");
      showFormModal.value = false;
      await fetchList();
      return;
    }
    const res: any = await apiKeyCreateAPI({
      name: form.name.trim() || undefined,
      expires_at: buildExpiresPayload(),
    });
    if (!checkResCode(res)) return;
    const row = res?.data as ApiKeyRow | undefined;
    showFormModal.value = false;
    if (row?.api_key) {
      createdKeyValue.value = row.api_key;
      showCreatedKeyModal.value = true;
    }
    message.success("API Key 已创建");
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || String(e) || "保存失败");
  } finally {
    formSubmitting.value = false;
  }
}

async function handleRotate(row: ApiKeyRow) {
  try {
    const res: any = await apiKeyUpdateAPI({ id: row.id, rotate: true });
    if (!checkResCode(res)) return;
    const data = res?.data as ApiKeyRow | undefined;
    if (data?.api_key) {
      createdKeyValue.value = data.api_key;
      showCreatedKeyModal.value = true;
    }
    message.success("密钥已重新生成");
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || String(e) || "重新生成失败");
  }
}

async function handleDelete(row: ApiKeyRow) {
  try {
    const res: any = await apiKeyDeleteAPI({ id: row.id });
    if (!checkResCode(res)) return;
    message.success("已删除");
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || String(e) || "删除失败");
  }
}

async function copyKey(key: string) {
  try {
    await copy(key);
    message.success("已复制 API Key");
  } catch (e: any) {
    message.error(e?.message || String(e) || "复制失败");
  }
}

const columns = computed<DataTableColumns<ApiKeyRow>>(() => [
  {
    title: "名称",
    key: "name",
    width: 140,
    ellipsis: { tooltip: true },
    render: (row) => row.name || h("span", { style: "color:#9ca3af" }, "未命名"),
  },
  {
    title: "API Key",
    key: "api_key",
    minWidth: 150,
    render: (row) =>
      h(NSpace, { size: 8, align: "center" }, () => [
        h("code", { class: "api-key-code" }, row.api_key),
        h(
          NButton,
          { size: "tiny", quaternary: true, onClick: () => copyKey(row.api_key) },
          { default: () => "复制" },
        ),
      ]),
  },
  {
    title: "过期时间",
    key: "expires_at",
    width: 240,
    render: (row) => {
      if (row.expired) {
        return h("span", { class: "expired-text" }, `${row.expires_at}（已过期）`);
      }
      return formatExpiresDisplay(row);
    },
  },
  {
    title: "状态",
    key: "enabled",
    width: 120,
    render: (row) => {
      const tags = [];
      if (row.enabled === false) {
        tags.push(h(NTag, { size: "small", type: "default" }, { default: () => "已禁用" }));
      } else {
        tags.push(h(NTag, { size: "small", type: "success" }, { default: () => "启用" }));
      }
      if (row.expired) {
        tags.push(h(NTag, { size: "small", type: "error" }, { default: () => "已过期" }));
      }
      return h(NSpace, { size: 4 }, () => tags);
    },
  },
  {
    title: "更新时间",
    key: "update_datetime",
    width: 170,
    ellipsis: { tooltip: true },
  },
  {
    title: "操作",
    key: "actions",
    width: 190,
    render: (row) =>
      h(NSpace, { size: 4 }, () => [
        h(
          NButton,
          { size: "small", onClick: () => openEditModal(row) },
          { default: () => "编辑" },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleRotate(row),
          },
          {
            trigger: () =>
              h(NButton, { size: "small" }, { default: () => "轮换" }),
            default: () => "重新生成后旧密钥立即失效，是否继续？",
          },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            trigger: () =>
              h(NButton, { size: "small", type: "error" }, { default: () => "删除" }),
            default: () => "确定删除该 API Key？",
          },
        ),
      ]),
  },
]);

onMounted(() => {
  void fetchList();
});
</script>

<template>
  <div class="api-key-page">
    <n-card title="API-Key 管理">
      <template #header-extra>
        <n-space :size="12" align="center">
          <n-radio-group v-model:value="enabledFilter" size="small" @update:value="fetchList">
            <n-radio-button value="all">全部</n-radio-button>
            <n-radio-button value="enabled">启用</n-radio-button>
            <n-radio-button value="disabled">禁用</n-radio-button>
          </n-radio-group>
          <n-button size="small" :loading="loading" @click="fetchList">刷新</n-button>
          <n-button type="success" size="small" @click="openCreateModal">创建 API Key</n-button>
        </n-space>
      </template>

      <n-alert :bordered="false" class="api-key-tip">
        <template #icon>
          <span class="api-key-tip-icon">ℹ</span>
        </template>
        用于通过 API Key 调用平台开放接口。请妥善保管密钥，勿提交到代码仓库或公开渠道。
      </n-alert>

      <n-data-table
        class="api-key-table"
        :columns="columns"
        :data="list"
        :loading="loading"
        :bordered="false"
        :single-line="false"
        size="small"
      />
    </n-card>

    <!-- 创建 / 编辑 -->
    <n-modal
      v-model:show="showFormModal"
      preset="card"
      class="api-key-form-modal"
      :title="isEdit ? '编辑 API Key' : '创建 API Key'"
      style="width: min(560px, 92vw)"
      :mask-closable="!formSubmitting"
    >
      <n-form label-placement="left" label-width="76px" size="small" class="api-key-form">
        <n-form-item label="名称">
          <n-input v-model:value="form.name" placeholder="选填，便于识别用途" clearable />
        </n-form-item>
        <n-form-item label="过期时间">
          <n-space vertical :size="8" class="expires-panel">
            <n-radio-group v-model:value="expireMode" size="small">
              <n-radio-button value="permanent">永久有效</n-radio-button>
              <n-radio-button value="custom">指定时间</n-radio-button>
            </n-radio-group>
            <span class="expires-hint">
              {{ form.permanent ? "到期时间将被忽略" : "到期后该密钥将不再可用" }}
            </span>
            <n-space v-if="!form.permanent" :size="8">
              <n-button size="tiny" tertiary @click="setExpiresInMonths(1)">1 个月</n-button>
              <n-button size="tiny" tertiary @click="setExpiresInMonths(3)">3 个月</n-button>
              <n-button size="tiny" tertiary @click="setExpiresInMonths(6)">半年</n-button>
              <n-button size="tiny" tertiary @click="setExpiresInMonths(12)">1 年</n-button>
            </n-space>
            <n-date-picker
              v-if="!form.permanent"
              v-model:value="form.expiresAt"
              type="datetime"
              clearable
              :actions="['clear', 'confirm']"
              style="width: 100%"
              format="yyyy-MM-dd HH:mm:ss"
              placeholder="请选择过期时间"
            />
          </n-space>
        </n-form-item>
        <n-form-item v-if="isEdit" label="启用">
          <n-switch v-model:value="form.enabled" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button :disabled="formSubmitting" @click="showFormModal = false">取消</n-button>
          <n-button :loading="formSubmitting" @click="handleFormSubmit">
            {{ isEdit ? "保存" : "创建" }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 新建 / 轮换后展示完整密钥 -->
    <n-modal
      v-model:show="showCreatedKeyModal"
      preset="dialog"
      title="请保存您的 API Key"
      style="width: min(560px, 92vw)"
      :mask-closable="true"
    >
      <n-alert type="warning" :bordered="false" style="margin-bottom: 12px">
        请立即复制并妥善保存。轮换后旧密钥将失效。
      </n-alert>
      <InputCopyable v-model:value="createdKeyValue" readonly monospace />
      <template #action>
        <n-button @click="showCreatedKeyModal = false">我已保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<style lang="less" scoped>
.api-key-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 12px 32px;
}

.api-key-tip {
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.api-key-tip-icon {
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
}

:deep(.api-key-tip .n-alert-body) {
  background: transparent;
}

:deep(.api-key-tip .n-alert-content) {
  color: #374151;
}

.api-key-table {
  margin-top: 8px;
}

.api-key-form {
  margin-top: 4px;
}

:deep(.api-key-form .n-form-item) {
  margin-bottom: 8px;
}

:deep(.api-key-code) {
  font-family: Consolas, Monaco, Menlo, monospace;
  font-size: 12px;
}

.expires-hint {
  display: inline-block;
  font-size: 12px;
  color: #6b7280;
}

.expired-text {
  color: #d03050;
}

.expires-panel {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

:deep(.api-key-form-modal .n-card) {
  border-radius: 12px;
}

:deep(.api-key-form-modal .n-card-header) {
  padding: 14px 18px 8px;
}

:deep(.api-key-form-modal .n-card__content) {
  padding: 8px 18px 6px;
}

:deep(.api-key-form-modal .n-card__action) {
  padding: 10px 18px 14px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

/* 防止表格容器产生横向滚动条 */
:deep(.api-key-table .n-data-table-scroll-container),
:deep(.api-key-table) {
  overflow-x: hidden !important;
}
</style>
