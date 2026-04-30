<template>
  <div class="tenant-dashboard" :class="{ 'is-fullscreen': isFullscreen }">
    <n-card>
      <div v-if="!isFullscreen" class="toolbar">
        <div class="search-row">
          <n-input
            v-model:value="searchKeyword"
            clearable
            size="large"
            class="search-input search-input-mac"
            placeholder="搜索：租户ID / 租户名称"
          />
          <div class="toolbar-actions">
            <n-dropdown trigger="click" :options="refreshMenuOptions" @select="handleRefreshMenuSelect">
              <n-button size="small" class="refresh-dropdown-btn">
                {{ refreshButtonLabel }}
              </n-button>
            </n-dropdown>
            <n-checkbox-group v-model:value="grayEnvFilters" class="gray-filter-group">
              <n-space :size="6">
                <n-checkbox value="prod">prod</n-checkbox>
                <n-checkbox value="prod2">prod2</n-checkbox>
              </n-space>
            </n-checkbox-group>
          </div>
        </div>
      </div>

      <div v-if="!isFullscreen" class="meta">
        <span>租户总数 {{ filteredTenants.length }}</span>
        <span>灰度上次更新时间：{{ lastGrayAtText }}</span>
      </div>

      <n-spin :show="initialLoading" class="board-spin">
        <div class="panels">
          <div v-for="panel in panels" :key="panel.key" class="panel" :class="`panel-${panel.key}`">
            <div class="panel-header">
              <span class="panel-title">
                {{ panel.title }}
              </span>
              <div class="panel-header-actions">
                <n-tag size="small" :bordered="false" type="default">{{ panel.items.length }}</n-tag>
                <n-button
                  size="tiny"
                  circle
                  quaternary
                  type="primary"
                  :disabled="panel.items.length === 0"
                  title="复制本组"
                  @click.stop="copyPanelTenants(panel)"
                >
                  <n-icon :component="Copy" />
                </n-button>
              </div>
            </div>

            <div class="panel-list">
              <n-empty v-if="panel.items.length === 0" size="small" description="该组暂无租户" />
              <div
                v-for="tenant in panel.items"
                :key="`${panel.key}-${tenant.tenantId}`"
                class="tenant-row"
                @click="openTenantLink(tenant)"
              >
                <n-avatar :src="tenant.logo || undefined" :size="20" round />
                <div class="tenant-main">
                  <div class="tenant-line">
                    <span class="tenant-id">
                      <span class="copyable" title="点击复制租户ID" @click.stop="copyText(tenant.tenantId, '租户ID')">
                        {{ tenant.tenantId }}
                      </span>
                    </span>
                    <span
                      class="tenant-name"
                    >
                      <span
                        class="copyable tenant-name-copy"
                        :title="`点击复制租户名称：${tenant.tenantName || '-'}`"
                        @click.stop="copyText(tenant.tenantName || '-', '租户名称')"
                      >
                        {{ tenant.tenantName || "-" }}
                      </span>
                    </span>
                    <n-tag
                      size="small"
                      :bordered="true"
                      :color="envTagOf(tenant.env).color"
                      :title="envTagOf(tenant.env).cloud || undefined"
                    >
                      {{ envTagDisplayText(tenant.env, panel.key) }}
                    </n-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "TenantDashboard" });

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Copy } from "@vicons/tabler";
import { tenant_all_api, tenant_gray_api } from "@/api/business";
import {
  normalizeGrayList,
  normalizeTenantList,
  resolveTenantEnvTag,
  type TenantGrayItem,
  type TenantItem,
} from "./tenant-dashboard.service";

const { message } = createDiscreteApi(["message"]);

const pollOptions = [
  { label: "3 秒", value: 3 },
  { label: "10 秒", value: 10 },
  { label: "1 分钟", value: 60 },
] as const;

const pollSeconds = ref<number>(10);
const grayEnvFilters = ref<Array<"prod" | "prod2">>(["prod", "prod2"]);
const searchKeyword = ref("");
const isFullscreen = ref(false);
const tenants = ref<TenantItem[]>([]);
const grayList = ref<TenantGrayItem[]>([]);
const loadingTenants = ref(false);
const loadingGray = ref(false);
const initialLoading = ref(true);
const lastTenantAt = ref<number | null>(null);
const lastGrayAt = ref<number | null>(null);

let grayTimer: number | null = null;
let grayFetching = false;

const keywordTokens = computed(() =>
  searchKeyword.value
    .toLowerCase()
    .split(/[\s,，]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);
const grayMap = computed(() => {
  const map = new Map<string, TenantGrayItem>();
  grayList.value.forEach((item) => map.set(item.tenantId, item));
  return map;
});

const filteredTenants = computed(() => {
  const tokens = keywordTokens.value;
  if (tokens.length === 0) return tenants.value;
  return tenants.value.filter((tenant) => {
    const tenantId = String(tenant.tenantId ?? "").toLowerCase();
    const tenantName = String(tenant.tenantName ?? "").toLowerCase();
    return tokens.some((token) => {
      if (/^\d+$/.test(token)) {
        return tenantId === token;
      }
      return tenantId.includes(token) || tenantName.includes(token);
    });
  });
});

const panels = computed(() => {
  const gray1: TenantItem[] = [];
  const gray2: TenantItem[] = [];
  const formal: TenantItem[] = [];

  filteredTenants.value.forEach((tenant) => {
    const gray = grayMap.value.get(tenant.tenantId);
    const envTag = envTagOf(tenant.env).text as "prod" | "prod2" | "独立";
    const allowInGray = grayEnvFilters.value.includes(envTag as "prod" | "prod2");
    if (!allowInGray) return;
    if (gray?.grayGroup === 1) {
      gray1.push(tenant);
      return;
    }
    if (gray?.grayGroup === 2) {
      gray2.push(tenant);
      return;
    }
    formal.push(tenant);
  });

  return [
    { key: "gray-1", title: "灰度组1", items: gray1 },
    { key: "gray-2", title: "灰度组2", items: gray2 },
    { key: "formal", title: "正式", items: formal },
  ];
});

const lastGrayAtText = computed(() => (lastGrayAt.value ? new Date(lastGrayAt.value).toLocaleString() : "-"));
const refreshButtonLabel = computed(() => `刷新（${pollSeconds.value}s）`);
const refreshMenuOptions = computed(() => [
  { label: "立即刷新", key: "refresh-now" },
  { type: "divider", key: "divider-1" },
  ...pollOptions.map((item) => ({ label: item.label, key: `interval-${item.value}` })),
]);

function envTagOf(env?: string | number) {
  return resolveTenantEnvTag(env);
}

function envTagDisplayText(env: string | number | undefined, panelKey: string) {
  const base = envTagOf(env).text;
  if (panelKey === "gray-1") return `${base}-gray1`;
  if (panelKey === "gray-2") return `${base}-gray2`;
  return base;
}

async function copyPanelTenants(panel: { key: string; title: string; items: TenantItem[] }) {
  if (!panel.items || panel.items.length === 0) return;
  const text = panel.items
    .map((tenant) => `${tenant.tenantId} ${tenant.tenantName || "-"} ${envTagDisplayText(tenant.env, panel.key)}`)
    .join("\n");
  try {
    await navigator.clipboard.writeText(text);
    message.success(`已复制${panel.title}全部租户（${panel.items.length}条）`);
  } catch {
    message.error("复制失败，请手动复制");
  }
}

async function copyText(text: string, label: string) {
  const value = String(text ?? "").trim();
  if (!value || value === "-") return;
  try {
    await navigator.clipboard.writeText(value);
    message.success(`${label}已复制`);
  } catch {
    message.error("复制失败，请手动复制");
  }
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  } catch {
    // 忽略异常，状态以 fullscreenchange 事件为准
  }
}

async function refreshAll() {
  await Promise.all([fetchTenantList(), fetchGrayList()]);
}

async function handleRefreshMenuSelect(key: string) {
  if (key === "refresh-now") {
    await refreshAll();
    return;
  }
  if (key.startsWith("interval-")) {
    const next = Number(key.replace("interval-", ""));
    if (next === 3 || next === 10 || next === 60) {
      pollSeconds.value = next;
      await fetchGrayList();
    }
  }
}

function openTenantLink(tenant: TenantItem) {
  const raw = String(tenant.domainName ?? "").trim();
  if (!raw) return;
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

async function fetchTenantList() {
  loadingTenants.value = true;
  try {
    const res: any = await tenant_all_api();
    if (res != null && Number(res.code) !== 0) {
      throw new Error(res?.msg || "获取租户列表失败");
    }
    tenants.value = normalizeTenantList(res?.data);
    lastTenantAt.value = Date.now();
  } catch (error: any) {
    message.error(error?.message || String(error) || "获取租户列表失败");
  } finally {
    loadingTenants.value = false;
  }
}

async function fetchGrayList() {
  if (grayFetching) return;
  grayFetching = true;
  loadingGray.value = true;
  try {
    const res: any = await tenant_gray_api();
    if (res != null && Number(res.code) !== 0) {
      throw new Error(res?.msg || "获取灰度租户失败");
    }
    grayList.value = normalizeGrayList(res?.data);
    lastGrayAt.value = Date.now();
  } catch (error: any) {
    message.error(error?.message || String(error) || "获取灰度租户失败");
  } finally {
    loadingGray.value = false;
    grayFetching = false;
  }
}

function clearGrayPolling() {
  if (grayTimer != null) {
    window.clearInterval(grayTimer);
    grayTimer = null;
  }
}

function startGrayPolling() {
  clearGrayPolling();
  const ms = Math.max(1, Number(pollSeconds.value)) * 1000;
  grayTimer = window.setInterval(() => {
    void fetchGrayList();
  }, ms);
}

async function refreshTenantList() {
  await fetchTenantList();
}

async function refreshGrayList() {
  await fetchGrayList();
}

watch(pollSeconds, () => {
  startGrayPolling();
});

function handleFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement);
}

let bootstrapped = false;
async function bootstrapDashboard() {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    await Promise.all([fetchTenantList(), fetchGrayList()]);
  } finally {
    initialLoading.value = false;
  }
  startGrayPolling();
}

onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  handleFullscreenChange();
  void bootstrapDashboard();
});

// setup 阶段也触发一次，确保首次进入就发起请求
void bootstrapDashboard();

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  clearGrayPolling();
});
</script>

<style lang="less" scoped>
.tenant-dashboard {
  width: min(1650px, 100%);
  height: 760px;
  min-height: 760px;
  max-height: 760px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
}

.tenant-dashboard.is-fullscreen {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.tenant-dashboard :deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 40px rgb(15 23 42 / 6%);
}

.tenant-dashboard :deep(.n-card__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 12px;
  padding: 2px 2px 12px;
  border-bottom: 1px solid #eef2f7;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px;
}

.search-input {
  flex: 1;
}

.search-input-mac {
  :deep(.n-input-wrapper) {
    border-radius: 10px;
    border: 1px solid #d9e1ec;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow:
      0 1px 2px rgb(15 23 42 / 4%),
      inset 0 1px 0 rgb(255 255 255 / 70%);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  :deep(.n-input__input-el) {
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.n-input-wrapper.n-input-wrapper--focus) {
    border-color: #5b8def;
    box-shadow:
      0 0 0 4px rgb(91 141 239 / 18%),
      0 8px 20px rgb(15 23 42 / 10%);
    transform: translateY(-1px);
  }
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  margin-left: auto;
}

.poll-select {
  width: 140px;
}

.refresh-dropdown-btn {
  min-width: 132px;
  height: 34px;
  font-size: 13px;
  border-radius: 8px;
}

.refresh-dropdown-btn:deep(.n-button__content) {
  font-weight: 600;
}

.gray-filter-group {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  font-size: 13px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.gray-filter-group :deep(.n-checkbox) {
  --n-size: 14px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: #6b7280;
  padding: 0 2px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  gap: 10px;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.panel {
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  padding: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  height: 100%;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.panel:hover {
  border-color: #d7e0ee;
  box-shadow: 0 6px 18px rgb(15 23 42 / 6%);
}

.panel-gray-1 {
  border-color: #9ca3af;
}

.panel-gray-2 {
  border-color: #9ca3af;
}

.panel-formal {
  border-color: #22c55e;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 2px 8px;
  border-bottom: 1px solid #edf2f7;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.panel-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.panel-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #0f172a;
}

.panel-header :deep(.n-tag) {
  font-size: 13px;
  font-weight: 700;
  min-width: 34px;
  text-align: center;
  border-radius: 999px;
  padding: 0 10px;
  background: #eef2ff;
  color: #374151;
}

.panel-list {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  padding-right: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.tenant-dashboard.is-fullscreen .panel-list {
  min-height: 0;
}

.board-spin {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-spin :deep(.n-spin-container) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-spin :deep(.n-spin-content) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-list::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.panel-list::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 999px;
}

.panel-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.panel-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.tenant-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
  border-bottom: 1px dashed #edf2f7;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  margin-bottom: 0;
}

.tenant-row:hover {
  background-color: #f8fbff;
}

.tenant-main {
  min-width: 0;
  flex: 1;
}

.tenant-line {
  display: flex;
  align-items: baseline;
  gap: 3px;
  font-size: 11px;
  line-height: 1;
  width: 100%;
  margin-bottom: 0;
  white-space: nowrap;
}

.tenant-id {
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}

.tenant-name {
  min-width: 0;
  flex: 1 1 auto;
  line-height: 1;
}

.tenant-name-copy {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  line-height: 1;
}

.tenant-line :deep(.n-tag) {
  margin-left: auto;
  flex-shrink: 0;
  height: 18px;
  font-size: 11px;
  line-height: 16px;
  padding: 0 6px;
}

.copyable {
  cursor: copy;
  transition: color 0.15s ease;
}

.copyable:hover {
  color: #2563eb;
  text-decoration: underline;
}

</style>