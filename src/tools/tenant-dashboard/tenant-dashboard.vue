<template>
  <div class="tenant-dashboard" :class="{ 'is-fullscreen': isFullscreen }">
    <n-card>
      <div v-if="!isFullscreen" class="toolbar">
        <div class="search-row">
          <n-input v-model:value="searchKeyword" clearable size="large" class="search-input search-input-mac"
            placeholder="搜索：租户ID / 租户名称" />
          <div class="toolbar-actions">
            <n-dropdown trigger="click" :options="refreshMenuOptions" @select="handleRefreshMenuSelect">
              <n-button size="small" class="refresh-dropdown-btn">
                {{ refreshButtonLabel }}
              </n-button>
            </n-dropdown>
            <n-checkbox-group v-model:value="grayEnvFilters" class="gray-filter-group">
              <n-space :size="6">
                <n-checkbox value="prod">华为云(prod)</n-checkbox>
                <n-checkbox value="prod2">阿里云(prod2)</n-checkbox>
              </n-space>
            </n-checkbox-group>
          </div>
        </div>
      </div>

      <div v-if="!isFullscreen" class="meta">
        <span>租户总数 {{ filteredTenants.length }}</span>
        <span>灰度租户刷新时间：{{ lastGrayAtText }}</span>
      </div>

      <n-spin :show="initialLoading" class="board-spin" :content-style="spinContentStyle"
        description="首次加载所有租户较耗时，请稍候">
        <div class="board-spin-slot">
          <div class="panels">
            <div v-for="panel in panels" :key="panel.key" class="panel" :class="`panel-${panel.key}`">
              <div class="panel-header">
                <div class="panel-header-left">
                  <span class="panel-title">
                    {{ panel.title }}
                  </span>
                  <n-tag size="small" :bordered="false" type="default" class="panel-tenant-count-tag"
                    title="本组租户数">
                    <span class="panel-tenant-count-inner">
                      <n-icon :component="BuildingWarehouse" class="panel-tenant-count-icon" />
                      <span>{{ panel.items.length }}</span>
                    </span>
                  </n-tag>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <n-tag size="small" :bordered="false" type="default" class="panel-car-summary-tag"
                        title="本组昨日车辆合计，悬浮查看精确车辆数">
                        <span class="panel-car-summary-inner">
                          <n-icon :component="Bike" class="panel-car-summary-bike" />
                          <span class="panel-car-summary-num">{{ formatPanelCarShortLabel(panel.carSum) }}</span>
                        </span>
                      </n-tag>
                    </template>
                    <div class="panel-stats-tooltip">车辆数：{{ formatPanelCarExact(panel.carSum) }}</div>
                  </n-tooltip>
                </div>
                <div class="panel-header-right">
                  <n-select v-model:value="panelSortByKey[panel.key]" size="tiny" :options="panelSortOptions"
                    class="panel-sort-select" :consistent-menu-width="false" @click.stop />
                  <n-button size="tiny" circle quaternary type="primary" :disabled="panel.items.length === 0"
                    title="复制本组" @click.stop="copyPanelTenants(panel)">
                    <n-icon :component="Copy" />
                  </n-button>
                </div>
              </div>

              <div class="panel-body">
                <div class="panel-list">
                  <n-empty v-if="panel.items.length === 0" size="small" description="该组暂无租户" />
                  <div v-for="tenant in panelPageSlice(panel.items, panel.key)" :key="`${panel.key}-${tenant.tenantId}`"
                    class="tenant-row" @click="openTenantLink(tenant)">
                    <n-avatar :src="tenant.logo || undefined" :size="20" round />
                    <div class="tenant-main">
                      <div class="tenant-line">
                        <span class="tenant-id">
                          <span class="copyable" title="点击复制租户ID" @click.stop="copyText(tenant.tenantId, '租户ID')">
                            {{ tenant.tenantId }}
                          </span>
                        </span>
                        <span class="tenant-name">
                          <span class="copyable tenant-name-copy"
                            :title="`点击复制租户名称：${tenant.tenantName || '-'}`"
                            @click.stop="copyText(tenant.tenantName || '-', '租户名称')">
                            {{ tenant.tenantName || "-" }}
                          </span>
                        </span>
                        <n-tag size="small" :bordered="true" class="tenant-ebike-tag" title="昨日车辆数"
                          :color="ebikeCountTagColor">
                          <span class="tenant-ebike-tag-inner">
                            <n-icon :component="Bike" class="tenant-ebike-icon" />
                            <span class="tenant-ebike-num">{{ formatYesterdayCarTotal(tenant.carTotal) }}</span>
                          </span>
                        </n-tag>
                        <n-tag size="small" :bordered="true" class="tenant-env-tag" :color="envTagOf(tenant.env).color"
                          :title="envTagOf(tenant.env).cloud || undefined">
                          {{ envTagDisplayText(tenant.env, panel.key) }}
                        </n-tag>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="panel.items.length > PANEL_PAGE_SIZE" class="panel-pagination">
                  <n-pagination size="small" :page="panelPageByKey[panel.key]"
                    :page-count="panelPageCount(panel.items.length)"
                    @update:page="(p: number) => setPanelPage(panel.key, p)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="domainPickShow"
      preset="card"
      title="选择要打开的域名"
      :style="{ width: 'min(440px, 92vw)' }"
      :header-style="domainPickModalHeaderStyle"
      :content-style="domainPickModalContentStyle"
      :mask-closable="true"
      :closable="true"
      class="tenant-domain-pick-modal"
      @after-leave="resetDomainPick">
      <div v-if="domainPickTenantHint" class="domain-pick-hint">{{ domainPickTenantHint }}</div>
      <n-space vertical size="small" class="domain-pick-actions">
        <n-button
          v-for="(d, idx) in domainPickDomains"
          :key="`${idx}-${d}`"
          block
          secondary
          strong
          @click="pickDomainAndOpen(d)">
          {{ d }}
        </n-button>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "TenantDashboard" });

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Bike, BuildingWarehouse, Copy } from "@vicons/tabler";
import { tenant_all_api, tenant_gray_api } from "@/api/business";
import {
  normalizeGrayList,
  normalizeTenantList,
  resolveTenantEnvTag,
  type TenantGrayItem,
  type TenantItem,
} from "./tenant-dashboard.service";

const { message } = createDiscreteApi(["message"]);

const ebikeCountTagColor = {
  color: "#fafafa",
  textColor: "#52525b",
  borderColor: "#e4e4e7",
} as const;

/** 列表改分页后不再依赖固定高度链；保持纵向 flex 便于 Spin 遮罩对齐 */
const spinContentStyle = {
  display: "flex",
  flexDirection: "column" as const,
  width: "100%",
  overflow: "visible",
};

const PANEL_PAGE_SIZE = 100;

const panelPageByKey = reactive<Record<string, number>>({
  "gray-1": 1,
  "gray-2": 1,
  formal: 1,
});

function panelPageCount(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / PANEL_PAGE_SIZE));
}

function panelPageSlice(items: TenantItem[], panelKey: string): TenantItem[] {
  const page = panelPageByKey[panelKey] ?? 1;
  const start = (page - 1) * PANEL_PAGE_SIZE;
  return items.slice(start, start + PANEL_PAGE_SIZE);
}

function setPanelPage(panelKey: string, page: number) {
  panelPageByKey[panelKey] = page;
}

const pollOptions = [
  { label: "3 秒", value: 3 },
  { label: "10 秒", value: 10 },
  { label: "1 分钟", value: 60 },
] as const;

const pollSeconds = ref<number>(10);
const panelSortOptions: Array<{ label: string; value: string }> = [
  { label: "租户ID ↑", value: "tenantId|asc" },
  { label: "租户ID ↓", value: "tenantId|desc" },
  { label: "车辆数 ↑", value: "carTotal|asc" },
  { label: "车辆数 ↓", value: "carTotal|desc" },
];
const panelSortByKey = reactive<Record<string, string>>({
  "gray-1": "carTotal|desc",
  "gray-2": "carTotal|desc",
  formal: "carTotal|desc",
});
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
const nextGrayDeadlineMs = ref(0);
/** 按钮上展示的剩余秒数，由定时器每秒写入以保证界面必定刷新 */
const refreshCountdownShown = ref(10);

let grayTimer: number | null = null;
let countdownUiTimer: number | null = null;
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

function parsePanelSortSpec(spec: string): { key: "tenantId" | "carTotal"; order: "asc" | "desc" } {
  const [rawKey, rawOrder] = spec.split("|");
  const key = rawKey === "carTotal" ? "carTotal" : "tenantId";
  const order = rawOrder === "desc" ? "desc" : "asc";
  return { key, order };
}

function compareTenantItemsByCarTotal(a: TenantItem, b: TenantItem, order: "asc" | "desc"): number {
  const aMiss = a.carTotal == null || !Number.isFinite(Number(a.carTotal));
  const bMiss = b.carTotal == null || !Number.isFinite(Number(b.carTotal));
  if (aMiss && bMiss) return 0;
  if (aMiss) return 1;
  if (bMiss) return -1;
  const c = Number(a.carTotal) - Number(b.carTotal);
  return order === "asc" ? c : -c;
}

function sortTenantPanelItems(items: TenantItem[], panelKey: string): TenantItem[] {
  const spec = panelSortByKey[panelKey] ?? "carTotal|desc";
  const { key, order } = parsePanelSortSpec(spec);
  const next = [...items];
  if (key === "tenantId") {
    next.sort((a, b) => {
      const c = a.tenantId.localeCompare(b.tenantId, "en", { numeric: true });
      return order === "asc" ? c : -c;
    });
  } else {
    next.sort((a, b) => compareTenantItemsByCarTotal(a, b, order));
  }
  return next;
}

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
    {
      key: "gray-1",
      title: "灰度组1",
      items: sortTenantPanelItems(gray1, "gray-1"),
      carSum: panelCarSum(gray1),
    },
    {
      key: "gray-2",
      title: "灰度组2",
      items: sortTenantPanelItems(gray2, "gray-2"),
      carSum: panelCarSum(gray2),
    },
    {
      key: "formal",
      title: "正式",
      items: sortTenantPanelItems(formal, "formal"),
      carSum: panelCarSum(formal),
    },
  ];
});

watch(
  panels,
  (list) => {
    for (const p of list) {
      const maxPage = panelPageCount(p.items.length);
      if ((panelPageByKey[p.key] ?? 1) > maxPage) {
        panelPageByKey[p.key] = maxPage;
      }
    }
  },
  { deep: true },
);

function resetAllPanelPages() {
  panelPageByKey["gray-1"] = 1;
  panelPageByKey["gray-2"] = 1;
  panelPageByKey.formal = 1;
}

watch(keywordTokens, resetAllPanelPages);

watch(grayEnvFilters, resetAllPanelPages, { deep: true });

watch(panelSortByKey, resetAllPanelPages, { deep: true });

const lastGrayAtText = computed(() => (lastGrayAt.value ? new Date(lastGrayAt.value).toLocaleString() : "-"));
const refreshButtonLabel = computed(() => `刷新灰度（${refreshCountdownShown.value}s）`);
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

function formatYesterdayCarTotal(value: TenantItem["carTotal"]): string {
  if (value === null || value === undefined) return "-";
  return String(value);
}

function panelCarSum(items: TenantItem[]): number {
  let sum = 0;
  for (const t of items) {
    const v = t.carTotal;
    if (v == null || !Number.isFinite(Number(v))) continue;
    sum += Number(v);
  }
  return sum;
}

/** 分组车辆合计的简短展示（万/亿）；与行内「昨日车辆」口径一致 */
function formatPanelCarTotalShort(sum: number): string {
  if (!Number.isFinite(sum)) return "—";
  if (sum === 0) return "0";
  if (sum >= 1e8) {
    const y = sum / 1e8;
    const d = y >= 100 ? 0 : y >= 10 ? 1 : 2;
    return `${parseFloat(y.toFixed(d))}亿`;
  }
  if (sum >= 1e4) {
    const w = sum / 1e4;
    const d = w >= 100 ? 0 : w >= 10 ? 1 : 2;
    return `${parseFloat(w.toFixed(d))}万`;
  }
  return sum.toLocaleString("zh-CN");
}

function formatPanelCarExact(sum: number): string {
  if (!Number.isFinite(sum)) return "—";
  return sum.toLocaleString("zh-CN");
}

/** 组内车辆简短标签（带「辆」） */
function formatPanelCarShortLabel(sum: number): string {
  const s = formatPanelCarTotalShort(sum);
  return s === "—" ? "—" : `${s}辆`;
}

async function copyPanelTenants(panel: { key: string; title: string; items: TenantItem[] }) {
  if (!panel.items || panel.items.length === 0) return;
  const text = panel.items
    .map(
      (tenant) =>
        `${tenant.tenantId} ${tenant.tenantName || "-"} 🚲 ${formatYesterdayCarTotal(tenant.carTotal)} ${envTagDisplayText(tenant.env, panel.key)}`,
    )
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
    startGrayPolling();
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

/** 支持英文逗号、中文逗号分隔的多域名 */
function parseTenantDomains(raw: unknown): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return [...new Set(s.split(/[,，]/).map((x) => x.trim()).filter(Boolean))];
}

function hrefFromDomainPiece(domain: string): string {
  const raw = domain.trim();
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** Card 弹窗强制浅色实底，避免暗色主题下半透明叠在遮罩上看不清 */
const domainPickModalHeaderStyle = {
  backgroundColor: "#ffffff",
  padding: "18px 22px 14px",
  borderBottom: "1px solid #f1f5f9",
} as const;

const domainPickModalContentStyle = {
  backgroundColor: "#ffffff",
  padding: "14px 22px 22px",
} as const;

const domainPickShow = ref(false);
const domainPickDomains = ref<string[]>([]);
const domainPickTenantHint = ref("");

function resetDomainPick() {
  domainPickDomains.value = [];
  domainPickTenantHint.value = "";
}

function pickDomainAndOpen(d: string) {
  const href = hrefFromDomainPiece(d);
  domainPickShow.value = false;
  if (href) window.open(href, "_blank", "noopener,noreferrer");
}

function openTenantLink(tenant: TenantItem) {
  const domains = parseTenantDomains(tenant.domainName);
  if (domains.length === 0) {
    message.warning("该租户未配置域名");
    return;
  }
  if (domains.length === 1) {
    const href = hrefFromDomainPiece(domains[0]);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  domainPickDomains.value = domains;
  domainPickTenantHint.value = [tenant.tenantId, tenant.tenantName].filter(Boolean).join(" · ");
  domainPickShow.value = true;
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

function syncRefreshCountdown() {
  const intervalSec = Math.max(1, Number(pollSeconds.value));
  const deadline = nextGrayDeadlineMs.value;
  if (!deadline) {
    refreshCountdownShown.value = intervalSec;
    return;
  }
  refreshCountdownShown.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function startCountdownTicker() {
  if (countdownUiTimer != null) return;
  syncRefreshCountdown();
  countdownUiTimer = window.setInterval(() => {
    syncRefreshCountdown();
  }, 1000);
}

function stopCountdownTicker() {
  if (countdownUiTimer != null) {
    window.clearInterval(countdownUiTimer);
    countdownUiTimer = null;
  }
}

function startGrayPolling() {
  clearGrayPolling();
  const ms = Math.max(1, Number(pollSeconds.value)) * 1000;
  nextGrayDeadlineMs.value = Date.now() + ms;
  syncRefreshCountdown();
  grayTimer = window.setInterval(() => {
    nextGrayDeadlineMs.value = Date.now() + ms;
    syncRefreshCountdown();
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
  initialLoading.value = true;
  try {
    await Promise.all([fetchTenantList(), fetchGrayList()]);
  } catch {
    /* 错误已在各 fetch 内 toast */
  } finally {
    initialLoading.value = false;
  }
  startGrayPolling();
}

onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  handleFullscreenChange();
  startCountdownTicker();
  void bootstrapDashboard();
});

// setup 阶段也触发一次，确保首次进入就发起请求
void bootstrapDashboard();

onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  clearGrayPolling();
  stopCountdownTicker();
});
</script>

<style lang="less" scoped>
.tenant-dashboard {
  width: min(1650px, 100%);
  box-sizing: border-box;
  min-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border-radius: 12px;
}

.tenant-dashboard.is-fullscreen {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  min-height: 400px;
  overflow-x: hidden;
  overflow-y: auto;
}

@supports (height: 100dvh) {
  .tenant-dashboard.is-fullscreen {
    height: 100dvh;
    max-height: 100dvh;
  }
}

.tenant-dashboard :deep(.n-card) {
  flex: 1 1 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.tenant-dashboard :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  overflow: visible;
  flex: 1 1 auto;
}

/* Spin 根节点带 .board-spin */
.tenant-dashboard :deep(.board-spin) {
  display: flex;
  flex-direction: column;
  overflow: visible;
  align-self: stretch;
  flex: 1 1 auto;
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-shrink: 0;
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
    border: 1px solid #e5e7eb;
    background: #ffffff;
    box-shadow: none;
    transition: border-color 0.2s ease;
  }

  :deep(.n-input__input-el) {
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.n-input-wrapper.n-input-wrapper--focus) {
    border-color: #a3a3a3;
    box-shadow: 0 0 0 3px rgb(163 163 163 / 18%);
    transform: none;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  font-size: 13px;
}

.gray-filter-group :deep(.n-checkbox) {
  --n-size: 14px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  padding: 0 2px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.panel {
  min-width: 0;
  align-self: stretch;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: visible;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.panel:hover {
  border-color: #d4d4d8;
  box-shadow: 0 6px 16px rgb(15 23 42 / 6%);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 8px;
  padding: 8px 4px 12px;
  border-bottom: 1px solid #f1f5f9;
  background: transparent;
}

.panel-header-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
  flex: 1 1 auto;
}

.panel-header-right {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.panel-sort-select {
  width: 86px;
  max-width: 86px;
}

.panel-sort-select:deep(.n-base-selection) {
  font-size: 12px;
}

.panel-sort-select:deep(.n-base-selection-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.35;
  color: #0f172a;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-tenant-count-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.panel-tenant-count-icon {
  font-size: 14px;
  flex-shrink: 0;
  color: inherit;
}

.panel-tenant-count-tag,
.panel-car-summary-tag {
  cursor: default;
  flex-shrink: 0;
  align-self: center;
  font-variant-numeric: tabular-nums;
}

.panel-car-summary-tag {
  max-width: min(140px, 100%);
}

.panel-header :deep(.panel-tenant-count-tag),
.panel-header :deep(.panel-car-summary-tag) {
  --n-height: auto !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  color: #475569 !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
  padding: 0 8px !important;
  min-height: 22px !important;
  box-shadow: none !important;
}

.panel-car-summary-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
}

.panel-car-summary-bike {
  font-size: 14px;
  flex-shrink: 0;
  color: inherit;
}

.panel-car-summary-num {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.panel-stats-tooltip {
  font-size: 12px;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

.panel-list {
  padding-right: 2px;
  overflow: visible;
}

.panel-pagination {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 4px;
  flex-shrink: 0;
}

.board-spin-slot {
  display: flex;
  flex-direction: column;
  overflow: visible;
  flex: 1 1 auto;
  width: 100%;
}

.board-spin :deep(.n-spin-content) {
  display: flex !important;
  flex-direction: column;
  overflow: visible;
  flex: 1 1 auto;
  width: 100%;
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
  background-color: #f4f4f5;
}

.tenant-main {
  min-width: 0;
  flex: 1;
}

.tenant-line {
  display: grid;
  /* 第一列固定约 4 位数字宽（ch = 「0」字宽，tabular-nums 下对齐） */
  grid-template-columns: var(--tenant-col-id, 5ch) minmax(0, 1fr) var(--tenant-col-ebike, 60px)
    var(--tenant-col-env, 86px);
  align-items: center;
  column-gap: 4px;
  font-size: 11px;
  line-height: 1;
  width: 100%;
  margin-bottom: 0;
  white-space: nowrap;
}

.tenant-id {
  font-weight: 500;
  color: #111827;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.tenant-id .copyable {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-name {
  min-width: 0;
  max-width: 100%;
  justify-self: start;
  line-height: 1;
}

.tenant-name-copy {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  color: #334155;
  line-height: 1;
}

.tenant-line :deep(.tenant-ebike-tag) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  margin-left: 0;
  height: 18px;
  font-size: 11px;
  line-height: 16px;
  padding: 0 4px;
}

.tenant-line :deep(.tenant-ebike-tag .n-tag__content) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.tenant-ebike-tag-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.tenant-ebike-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.92;
}

.tenant-ebike-num {
  flex-shrink: 0;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.tenant-line :deep(.tenant-env-tag) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  justify-content: center;
  margin-left: 0;
  height: 18px;
  font-size: 11px;
  line-height: 16px;
  padding: 0 6px;
}

.tenant-line :deep(.tenant-env-tag .n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.copyable {
  cursor: copy;
  transition: color 0.15s ease;
}

.copyable:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 域名选择弹窗：遮罩对比 + card 整体浅色实底（兼容暗色 naive 变量） */
.tenant-domain-pick-modal {
  --n-color-modal: #ffffff;
}

.tenant-domain-pick-modal :deep(.n-modal-mask) {
  background-color: rgb(15 23 42 / 55%) !important;
}

.tenant-domain-pick-modal :deep(.n-card) {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border: 1px solid rgb(226 232 240 / 95%) !important;
  box-shadow:
    0 25px 50px -12px rgb(15 23 42 / 28%),
    0 0 0 1px rgb(15 23 42 / 5%) !important;
}

.tenant-domain-pick-modal :deep(.n-card-header),
.tenant-domain-pick-modal :deep(.n-card__content),
.tenant-domain-pick-modal :deep(.n-card-header__main) {
  color: #0f172a !important;
}

.domain-pick-hint {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  line-height: 1.45;
  word-break: break-all;
}

.domain-pick-actions {
  width: 100%;
}
</style>