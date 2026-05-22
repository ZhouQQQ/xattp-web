<template>
  <div class="tenant-gray-plan">
    <n-card>
      <n-spin :show="initialLoading" class="plan-spin" description="正在加载租户与灰度数据…">
        <div class="plan-body">
          <div class="plan-split">
            <div class="plan-col plan-col-left">
                <div class="plan-col-head plan-col-head-with-actions">
                  <div class="plan-col-head-text">
                    <span class="plan-col-title">全部租户</span>
                    <span class="plan-col-meta">{{ filteredLeftTenantsSorted.length }} / {{ tenants.length }}</span>
                  </div>
                  <n-button size="small" quaternary :loading="loading" @click="reloadData">重新加载数据</n-button>
                </div>
                <div class="plan-left-search-sort-row">
                  <n-input
                    v-model:value="leftSearch"
                    clearable
                    size="small"
                    placeholder="按租户ID、租户名称模糊筛选"
                    class="plan-search-input" />
                  <div class="plan-left-sort-inline">
                    <!-- <span class="plan-left-sort-label">排序</span> -->
                    <n-select
                      v-model:value="leftListSortSpec"
                      size="small"
                      class="plan-left-sort-select"
                      :options="leftListSortOptions"
                      :consistent-menu-width="false" />
                  </div>
                </div>
                <div class="plan-left-list-shell">
                  <n-scrollbar class="plan-scroll plan-scroll--tenant-board">
                    <div class="td-mirror-panel">
                      <div class="panel-body">
                        <div class="panel-list">
                          <n-empty v-if="filteredLeftTenantsSorted.length === 0" size="small" description="无匹配租户" />
                          <div
                            v-for="t in filteredLeftTenantsPageSlice"
                            :key="t.tenantId"
                            class="tenant-row"
                            :class="{
                              'is-in-pending': pendingSet.has(t.tenantId),
                              'tenant-row--standalone': isStandaloneTenant(t),
                            }"
                            :title="isStandaloneTenant(t) ? '独立部署租户不可加入灰度计划' : undefined"
                            @click="togglePending(t)">
                            <n-avatar :src="t.logo || undefined" :size="18" round />
                            <div class="tenant-main">
                              <div class="tenant-line">
                                <span class="tenant-id">
                                  <span class="tenant-id-text">{{ t.tenantId }}</span>
                                </span>
                                <span class="tenant-name">
                                  <span class="tenant-name-copy" :title="t.tenantName || '-'">
                                    {{ t.tenantName || "-" }}
                                  </span>
                                </span>
                                <n-tag size="small" :bordered="true" class="tenant-ebike-tag" title="昨日车辆数"
                                  :color="ebikeCountTagColor">
                                  <span class="tenant-ebike-tag-inner">
                                    <n-icon :component="ScooterElectric" class="tenant-ebike-icon" />
                                    <span class="tenant-ebike-num">{{ formatYesterdayCarTotal(t.carTotal) }}</span>
                                  </span>
                                </n-tag>
                                <n-tag size="small" :bordered="true" class="tenant-env-tag" :color="envTagOf(t.env).color"
                                  :title="envTagOf(t.env).cloud || undefined">
                                  {{ envLabel(t) }}
                                </n-tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </n-scrollbar>
                  <div
                    v-if="filteredLeftTenantsSorted.length > LEFT_LIST_PAGE_SIZE"
                    class="plan-left-pagination">
                    <n-pagination
                      size="small"
                      :page="leftListPage"
                      :page-count="leftListPageCount"
                      @update:page="onLeftListPage" />
                  </div>
                </div>
                <div class="plan-foot-hint">单击行加入或移出右侧待灰度列表（独立部署租户除外）</div>
              </div>

              <div class="plan-col plan-col-right">
                <div class="plan-col-head plan-col-head-with-actions">
                  <div class="plan-col-head-text">
                    <span class="plan-col-title">待灰度计划</span>
                    <span class="plan-col-meta">{{ pendingTenantIds.length }} 户</span>
                  </div>
                  <n-space :size="6">
                    <n-button
                      size="small"
                      secondary
                      :disabled="pendingTenantIds.length === 0"
                      title="仅复制数据行（制表符分隔），不含表头"
                      @click="copyPlanTsv(false)">
                      复制（无表头）
                    </n-button>
                    <n-button
                      size="small"
                      secondary
                      :disabled="pendingTenantIds.length === 0"
                      title="首行为列名：租户ID、租户名称、车辆数、当前所在环境、计划灰度时间"
                      @click="copyPlanTsv(true)">
                      复制
                    </n-button>
                    <n-button size="small" secondary :disabled="pendingTenantIds.length === 0" @click="exportPlanCsv">
                      导出 CSV
                    </n-button>
                    <n-button size="small" secondary :disabled="tenants.length === 0" @click="openImportPlanModal">
                      导入
                    </n-button>
                    <n-button
                      size="small"
                      type="primary"
                      :disabled="!aiPlanButtonEnabled"
                      :loading="aiPlanLoading"
                      title="需有待灰度租户且至少填写一户计划时间；将当前「含表头」表格提交 AI 并回填时间"
                      @click="runAiGrayPlan">
                      AI计划
                    </n-button>
                    <n-button
                      size="small"
                      secondary
                      :disabled="!hasAnyPendingPlanTime"
                      title="清空待灰度列表中全部已选的计划灰度时间"
                      @click="clearAllPendingPlanTimes">
                      清除时间
                    </n-button>
                  </n-space>
                </div>
                <n-data-table
                  class="plan-pending-table"
                  size="small"
                  :columns="pendingColumns"
                  :data="pendingTableRows"
                  :row-class-name="pendingRowClassName"
                  :bordered="false"
                  :single-line="false"
                  :max-height="560"
                  @update:sorter="handlePendingTableSorterUpdate" />
              </div>
            </div>
          </div>
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="importPlanModalShow"
      preset="card"
      title="导入待灰度计划"
      :style="{ width: 'min(640px, 92vw)' }"
      :mask-closable="false"
      @after-leave="onImportPlanModalAfterLeave">
      <div class="plan-import-modal-body">
        <p class="plan-import-hint">
          粘贴与「复制」一致的数据：<strong>制表符</strong>分隔为 5 列（租户ID、租户名称、车辆数、当前所在环境、计划灰度时间）。时间支持
          <code>2026-05-01 10:38（周五上午）</code> 或仅 <code>2026-05-01 10:38</code>；可含表头行。仅会加入当前已加载租户列表中存在的租户。
        </p>
        <n-input v-model:value="importPlanDraft" type="textarea" :rows="14" size="small" placeholder="在此粘贴…" />
        <div class="plan-import-actions">
          <n-button size="small" secondary @click="pasteImportPlanFromClipboard">从剪贴板粘贴</n-button>
          <n-button size="small" type="primary" @click="confirmImportPlan">确认导入</n-button>
        </div>
        <n-alert
          v-if="importPlanLastParseErrors.length > 0"
          type="warning"
          title="以下行格式有误，已跳过"
          style="margin-top: 10px">
          <ul class="plan-import-error-list">
            <li v-for="e in importPlanLastParseErrors" :key="e.lineNo">第 {{ e.lineNo }} 行：{{ e.message }}</li>
          </ul>
        </n-alert>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "TenantGrayPlan" });

import { computed, h, onMounted, reactive, ref, watch } from "vue";
import {
  createDiscreteApi,
  NAlert,
  NButton,
  NDatePicker,
  NInput,
  NModal,
  NSelect,
  NTag,
  type DataTableColumns,
  type DataTableSortState,
} from "naive-ui";
import { ScooterElectric } from "@vicons/tabler";
import { tenant_all_api, tenant_gray_ai_api, tenant_gray_api } from "@/api/business";
import {
  normalizeGrayList,
  normalizeTenantList,
  resolveTenantEnvTag,
  type TenantGrayItem,
  type TenantItem,
} from "../tenant-dashboard/tenant-dashboard.service";
import {
  compareCarTotalAsc,
  compareCarTotalDesc,
  dedupeImportedPlanLinesLastWins,
  filterTenantsFuzzy,
  formatPlanLocalDateTime,
  grayPanelKeyForTenant,
  envLabelForGrayPanel,
  isStandaloneTenant,
  parseImportedPlanTimeCell,
  parseImportedPlanTsvText,
  planRowsToCsv,
  planRowsToTsv,
  type PlanImportLineError,
  type PlanRow,
} from "./tenant-gray-plan.service";

const { message } = createDiscreteApi(["message"]);

const ebikeCountTagColor = {
  color: "#fafafa",
  textColor: "#52525b",
  borderColor: "#e4e4e7",
} as const;

const initialLoading = ref(true);
const loading = ref(false);
const tenants = ref<TenantItem[]>([]);
const grayList = ref<TenantGrayItem[]>([]);

const leftSearch = ref("");
/** 与租户看板单组列表一致：每页条数 */
const LEFT_LIST_PAGE_SIZE = 100;
const leftListPage = ref(1);

/** 全部租户列表排序：默认车辆数降序 */
type LeftListSortSpec = `${"carTotal" | "tenantId"}:${"ascend" | "descend"}`;
const leftListSortSpec = ref<LeftListSortSpec>("carTotal:descend");

const leftListSortOptions: { label: string; value: LeftListSortSpec }[] = [
  { label: "车辆数↓", value: "carTotal:descend" },
  { label: "车辆数↑", value: "carTotal:ascend" },
  { label: "租户ID↑", value: "tenantId:ascend" },
  { label: "租户ID↓", value: "tenantId:descend" },
];
const pendingTenantIds = ref<string[]>([]);
/** 各租户计划灰度时间（毫秒时间戳），未选则为 null */
const pendingTimeByTenant = reactive<Record<string, number | null>>({});

const importPlanModalShow = ref(false);
const importPlanDraft = ref("");
const importPlanLastParseErrors = ref<PlanImportLineError[]>([]);
const aiPlanLoading = ref(false);

/** 待灰度非空且至少一户已填计划时间（作为 AI 锚点） */
const aiPlanButtonEnabled = computed(() => {
  if (pendingTenantIds.value.length === 0) return false;
  return pendingTenantIds.value.some((id) => {
    const raw = pendingTimeByTenant[id];
    return raw != null && Number.isFinite(Number(raw));
  });
});

/** 至少一户已选计划时间时可清除 */
const hasAnyPendingPlanTime = computed(() => aiPlanButtonEnabled.value);

type PendingTableSortKey = "tenantId" | "carTotal" | "plannedAt";

const pendingSortKey = ref<PendingTableSortKey>("carTotal");
const pendingSortOrder = ref<"ascend" | "descend">("ascend");

function pendingPlannedTimeSortValue(tenantId: string): number {
  const raw = pendingTimeByTenant[tenantId];
  if (raw == null || !Number.isFinite(Number(raw))) return Number.POSITIVE_INFINITY;
  return Number(raw);
}

/** Naive DataTable 通过 @update:sorter 通知受控排序，列上的 onUpdateSortOrder 无效 */
function handlePendingTableSorterUpdate(sortState: DataTableSortState | DataTableSortState[] | null) {
  if (sortState == null) {
    pendingSortKey.value = "carTotal";
    pendingSortOrder.value = "ascend";
    return;
  }
  const s = Array.isArray(sortState) ? sortState[0] : sortState;
  if (!s?.columnKey || s.order === false) {
    pendingSortKey.value = "carTotal";
    pendingSortOrder.value = "ascend";
    return;
  }
  const k = s.columnKey;
  if (k === "tenantId" || k === "carTotal" || k === "plannedAt") {
    pendingSortKey.value = k;
    if (s.order === "ascend" || s.order === "descend") {
      pendingSortOrder.value = s.order;
    }
  }
}

/** 加入待灰度后：pendingTenantIds 按车辆数升序排列（与默认表格排序一致） */
function sortPendingIdsByCarTotalAsc(ids: readonly string[]): string[] {
  const withTenant: TenantItem[] = [];
  const without: string[] = [];
  for (const id of ids) {
    const t = tenantById.value.get(id);
    if (t) withTenant.push(t);
    else without.push(id);
  }
  withTenant.sort((a, b) => compareCarTotalAsc(a, b));
  return [...withTenant.map((x) => x.tenantId), ...without];
}

const grayMap = computed(() => {
  const m = new Map<string, TenantGrayItem>();
  for (const g of grayList.value) {
    m.set(g.tenantId, g);
  }
  return m;
});

const tenantById = computed(() => {
  const m = new Map<string, TenantItem>();
  for (const t of tenants.value) {
    m.set(t.tenantId, t);
  }
  return m;
});

const pendingSet = computed(() => new Set(pendingTenantIds.value));

const filteredLeftTenantsSorted = computed(() => {
  const list = filterTenantsFuzzy(tenants.value, leftSearch.value);
  const spec = leftListSortSpec.value;
  const sep = spec.indexOf(":");
  const key = spec.slice(0, sep) as "carTotal" | "tenantId";
  const ord = spec.slice(sep + 1) as "ascend" | "descend";
  return [...list].sort((a, b) => {
    if (key === "tenantId") {
      const c = a.tenantId.localeCompare(b.tenantId, "en", { numeric: true });
      return ord === "ascend" ? c : -c;
    }
    return ord === "descend" ? compareCarTotalDesc(a, b) : compareCarTotalAsc(a, b);
  });
});

const leftListPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredLeftTenantsSorted.value.length / LEFT_LIST_PAGE_SIZE)),
);

const filteredLeftTenantsPageSlice = computed(() => {
  const list = filteredLeftTenantsSorted.value;
  const start = (leftListPage.value - 1) * LEFT_LIST_PAGE_SIZE;
  return list.slice(start, start + LEFT_LIST_PAGE_SIZE);
});

watch(leftListSortSpec, () => {
  leftListPage.value = 1;
});

watch(
  () => filteredLeftTenantsSorted.value.length,
  () => {
    leftListPage.value = 1;
  },
);

watch(leftListPageCount, (max) => {
  if (leftListPage.value > max) leftListPage.value = max;
});

function onLeftListPage(p: number) {
  leftListPage.value = p;
}

const pendingTenantsSorted = computed(() => {
  void pendingTenantIds.value;
  for (const id of pendingTenantIds.value) {
    void pendingTimeByTenant[id];
  }
  void pendingSortKey.value;
  void pendingSortOrder.value;
  const list = pendingTenantIds.value
    .map((id) => tenantById.value.get(id))
    .filter((t): t is TenantItem => t != null);
  const next = [...list];
  const key = pendingSortKey.value;
  const desc = pendingSortOrder.value === "descend";
  if (key === "tenantId") {
    next.sort((a, b) => {
      const c = a.tenantId.localeCompare(b.tenantId, "en", { numeric: true });
      return desc ? -c : c;
    });
  } else if (key === "carTotal") {
    next.sort(desc ? compareCarTotalDesc : compareCarTotalAsc);
  } else {
    next.sort((a, b) => {
      const c = pendingPlannedTimeSortValue(a.tenantId) - pendingPlannedTimeSortValue(b.tenantId);
      return desc ? -c : c;
    });
  }
  return next;
});

function envLabel(t: TenantItem): string {
  const pk = grayPanelKeyForTenant(t.tenantId, grayMap.value);
  return envLabelForGrayPanel(t.env, pk);
}

function envTagOf(env?: string | number) {
  return resolveTenantEnvTag(env);
}

function formatYesterdayCarTotal(value: TenantItem["carTotal"]): string {
  if (value === null || value === undefined) return "-";
  return String(value);
}

function formatCar(v: TenantItem["carTotal"]): string {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return String(v);
}

const pendingTableRows = computed(() => {
  for (const id of pendingTenantIds.value) {
    void pendingTimeByTenant[id];
  }
  return pendingTenantsSorted.value.map((t) => ({
    tenantId: t.tenantId,
    tenantName: t.tenantName || "—",
    carTotal: formatCar(t.carTotal),
    currentEnv: envLabel(t),
  }));
});

/** 相同计划时间共用同一套行背景色；未选择时间的不着色 */
const PENDING_TIME_GROUP_MOD = 8;

const pendingRowTimeGroupClass = computed(() => {
  void pendingTenantIds.value;
  const rows = pendingTenantsSorted.value;
  const entries = rows.map((t) => {
    const raw = pendingTimeByTenant[t.tenantId];
    const key =
      raw == null || !Number.isFinite(Number(raw)) ? "__unset__" : String(Math.floor(Number(raw)));
    return { tenantId: t.tenantId, key };
  });
  const distinctKeys = [...new Set(entries.map((e) => e.key))]
    .filter((k) => k !== "__unset__")
    .sort((a, b) => Number(a) - Number(b));
  const keyToPalette = new Map<string, number>();
  distinctKeys.forEach((k, i) => {
    keyToPalette.set(k, i % PENDING_TIME_GROUP_MOD);
  });
  const idToClass = new Map<string, string>();
  for (const e of entries) {
    if (e.key === "__unset__") {
      idToClass.set(e.tenantId, "");
      continue;
    }
    const pi = keyToPalette.get(e.key) ?? 0;
    idToClass.set(e.tenantId, `plan-pending-time-g${pi}`);
  }
  return idToClass;
});

function pendingRowClassName(row: { tenantId: string }) {
  return pendingRowTimeGroupClass.value.get(row.tenantId) ?? "";
}

const planRows = computed<PlanRow[]>(() =>
  pendingTenantsSorted.value.map((tenant) => {
    const ms = pendingTimeByTenant[tenant.tenantId];
    const car =
      tenant.carTotal != null && Number.isFinite(Number(tenant.carTotal)) ? String(tenant.carTotal) : "-";
    return {
      tenantId: tenant.tenantId,
      customerName: tenant.tenantName?.trim() || "-",
      carTotalDisplay: car,
      currentEnv: envLabel(tenant),
      plannedGrayAt:
        ms != null && Number.isFinite(ms)
          ? formatPlanLocalDateTime(floorTimestampToLocalMinute(Number(ms)))
          : "-",
    };
  }),
);

function removePending(id: string) {
  pendingTenantIds.value = pendingTenantIds.value.filter((x) => x !== id);
  delete pendingTimeByTenant[id];
}

/** 本地日历下将秒、毫秒归零，与仅选择到「分钟」一致 */
function floorTimestampToLocalMinute(ms: number): number {
  const d = new Date(ms);
  d.setSeconds(0, 0);
  return d.getTime();
}

/** 表格展示顺序（pendingTenantsSorted）中紧邻上一行已选计划时间，供「同上」使用 */
function sameAsAbovePlanTimeForRow(tenantId: string): { ms: number; aboveTenantId: string } | null {
  const rows = pendingTenantsSorted.value;
  const idx = rows.findIndex((t) => t.tenantId === tenantId);
  if (idx <= 0) return null;
  const above = rows[idx - 1];
  const raw = pendingTimeByTenant[above.tenantId];
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  return { ms: floorTimestampToLocalMinute(Number(raw)), aboveTenantId: above.tenantId };
}

const pendingColumns = computed<DataTableColumns<{
  tenantId: string;
  tenantName: string;
  carTotal: string;
  currentEnv: string;
}>>(() => [
  {
    title: "租户ID",
    key: "tenantId",
    width: 56,
    ellipsis: { tooltip: true },
    sorter: (r1, r2) => r1.tenantId.localeCompare(r2.tenantId, "en", { numeric: true }),
    sortOrder: pendingSortKey.value === "tenantId" ? pendingSortOrder.value : false,
  },
  { title: "租户名称", key: "tenantName", width: 92, ellipsis: { tooltip: true } },
  {
    title: "车辆数",
    key: "carTotal",
    width: 40,
    className: "plan-pending-car-total-col",
    titleClassName: "plan-pending-car-total-th",
    sorter: (r1, r2) => {
      const a = tenantById.value.get(r1.tenantId);
      const b = tenantById.value.get(r2.tenantId);
      if (!a || !b) return 0;
      return compareCarTotalAsc(a, b);
    },
    sortOrder: pendingSortKey.value === "carTotal" ? pendingSortOrder.value : false,
  },
  {
    title: "当前所在环境",
    key: "currentEnv",
    width: 66,
    render(row) {
      const t = tenantById.value.get(row.tenantId);
      if (!t) {
        return h("span", { class: "plan-pending-env-fallback" }, row.currentEnv);
      }
      const meta = envTagOf(t.env);
      return h(
        NTag,
        {
          size: "small",
          bordered: true,
          class: "tenant-env-tag",
          color: meta.color,
          title: meta.cloud || undefined,
        },
        { default: () => envLabel(t) },
      );
    },
  },
  {
    title: "计划灰度时间",
    key: "plannedAt",
    width: 130,
    className: "plan-pending-time-col",
    sorter: (r1, r2) => pendingPlannedTimeSortValue(r1.tenantId) - pendingPlannedTimeSortValue(r2.tenantId),
    sortOrder: pendingSortKey.value === "plannedAt" ? pendingSortOrder.value : false,
    render(row) {
      const snap = sameAsAbovePlanTimeForRow(row.tenantId);
      return h("div", { class: "plan-pending-time-cell" }, [
        h(
          "div",
          { class: "plan-pending-time-picker-wrap" },
          [
            h(NDatePicker, {
              type: "datetime",
              size: "small",
              format: "yyyy-MM-dd HH:mm",
              timePickerFormat: "HH:mm",
              value: pendingTimeByTenant[row.tenantId] ?? null,
              clearable: true,
              updateValueOnInput: true,
              onUpdateValue: (v: number | null) => {
                if (v == null || !Number.isFinite(Number(v))) {
                  pendingTimeByTenant[row.tenantId] = v;
                  return;
                }
                pendingTimeByTenant[row.tenantId] = floorTimestampToLocalMinute(Number(v));
              },
            }),
          ],
        ),
        h(
          NButton,
          {
            size: "small",
            text: true,
            type: "primary",
            class: "plan-pending-same-as-above-btn",
            disabled: snap == null,
            title:
              snap != null
                ? `与上一行（租户 ${snap.aboveTenantId}）的计划时间相同`
                : "无上一行或上一行未选择时间",
            onClick: () => {
              if (snap == null) return;
              pendingTimeByTenant[row.tenantId] = snap.ms;
            },
          },
          { default: () => "同上" },
        ),
      ]);
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 36,
    render(row) {
      return h(
        NButton,
        {
          size: "small",
          quaternary: true,
          type: "error",
          onClick: () => removePending(row.tenantId),
        },
        { default: () => "移除" },
      );
    },
  },
]);

function togglePending(t: TenantItem) {
  const id = t.tenantId;
  const idx = pendingTenantIds.value.indexOf(id);
  if (idx >= 0) {
    pendingTenantIds.value = pendingTenantIds.value.filter((x) => x !== id);
    delete pendingTimeByTenant[id];
  } else {
    if (isStandaloneTenant(t)) {
      message.warning("独立部署租户不允许加入灰度计划");
      return;
    }
    pendingTenantIds.value = sortPendingIdsByCarTotalAsc([...pendingTenantIds.value, id]);
    pendingTimeByTenant[id] = null;
  }
}

/** 数据刷新后：不在列表中或属独立部署的项从待灰度中移除 */
watch(tenants, (list) => {
  const removeIds = pendingTenantIds.value.filter((id) => {
    const row = list.find((x) => x.tenantId === id);
    return !row || isStandaloneTenant(row);
  });
  if (removeIds.length === 0) return;
  for (const id of removeIds) {
    delete pendingTimeByTenant[id];
  }
  pendingTenantIds.value = pendingTenantIds.value.filter((id) => !removeIds.includes(id));
});

async function fetchTenantList() {
  const res: any = await tenant_all_api();
  if (res != null && Number(res.code) !== 0) {
    throw new Error(res?.msg || "获取租户列表失败");
  }
  tenants.value = normalizeTenantList(res?.data);
}

async function fetchGrayList() {
  const res: any = await tenant_gray_api();
  if (res != null && Number(res.code) !== 0) {
    throw new Error(res?.msg || "获取灰度租户失败");
  }
  grayList.value = normalizeGrayList(res?.data);
}

async function loadAll(options?: { silent?: boolean }) {
  const silent = options?.silent === true;
  if (!silent) loading.value = true;
  try {
    await Promise.all([fetchTenantList(), fetchGrayList()]);
  } catch (e: any) {
    message.error(e?.message || String(e) || "加载失败");
  } finally {
    if (!silent) loading.value = false;
  }
}

async function reloadData() {
  await loadAll({ silent: false });
  message.success("已刷新");
}

let bootstrapped = false;

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  initialLoading.value = true;
  try {
    await loadAll({ silent: true });
  } finally {
    initialLoading.value = false;
  }
}

onMounted(() => {
  void bootstrap();
});

// 与租户灰度看板一致：setup 阶段也拉一次，避免仅依赖 onMounted 时请求未发出
void bootstrap();

async function copyPlanTsv(includeHeader: boolean) {
  const text = planRowsToTsv(planRows.value, { includeHeader });
  try {
    await navigator.clipboard.writeText(text);
    message.success(includeHeader ? "已复制（含表头）" : "已复制");
  } catch {
    message.error("复制失败，请手动选择表格复制");
  }
}

function exportPlanCsv() {
  const csv = planRowsToCsv(planRows.value);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tenant-gray-plan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("已导出 CSV");
}

function openImportPlanModal() {
  importPlanLastParseErrors.value = [];
  importPlanModalShow.value = true;
}

function onImportPlanModalAfterLeave() {
  importPlanDraft.value = "";
  importPlanLastParseErrors.value = [];
}

async function pasteImportPlanFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    importPlanDraft.value = text ?? "";
    if (!importPlanDraft.value.trim()) {
      message.warning("剪贴板为空");
    } else {
      message.success("已粘贴");
    }
  } catch {
    message.error("读取剪贴板失败，请手动粘贴到文本框");
  }
}

function confirmImportPlan() {
  const draft = importPlanDraft.value.trim();
  if (!draft) {
    message.warning("请先粘贴数据");
    return;
  }
  const { rows, lineErrors } = parseImportedPlanTsvText(draft);
  importPlanLastParseErrors.value = lineErrors;
  const merged = dedupeImportedPlanLinesLastWins(rows);
  const unknown: string[] = [];
  const standalone: string[] = [];
  const timeUnparsed: string[] = [];
  const toApply: Array<{ id: string; ms: number | null }> = [];
  for (const r of merged) {
    const t = tenantById.value.get(r.tenantId);
    if (!t) {
      unknown.push(r.tenantId);
      continue;
    }
    if (isStandaloneTenant(t)) {
      standalone.push(r.tenantId);
      continue;
    }
    if (r.plannedGrayAtRaw.trim() && r.plannedAtMs == null) {
      timeUnparsed.push(r.tenantId);
    }
    toApply.push({ id: r.tenantId, ms: r.plannedAtMs });
  }
  if (toApply.length === 0) {
    message.warning("没有可导入的租户（需在已加载列表中且非独立部署）");
    return;
  }
  const prevIds = new Set(pendingTenantIds.value);
  const newIdSet = new Set([...pendingTenantIds.value, ...toApply.map((x) => x.id)]);
  pendingTenantIds.value = sortPendingIdsByCarTotalAsc([...newIdSet]);
  for (const { id, ms } of toApply) {
    if (ms != null) {
      pendingTimeByTenant[id] = floorTimestampToLocalMinute(ms);
    } else if (!prevIds.has(id)) {
      pendingTimeByTenant[id] = null;
    }
  }
  importPlanModalShow.value = false;
  importPlanDraft.value = "";
  importPlanLastParseErrors.value = [];
  const parts = [`已导入 ${toApply.length} 户`];
  if (lineErrors.length) parts.push(`格式错误跳过 ${lineErrors.length} 行`);
  if (unknown.length) parts.push(`未找到租户 ${unknown.length} 个`);
  if (standalone.length) parts.push(`独立部署跳过 ${standalone.length} 个`);
  if (timeUnparsed.length) parts.push(`${timeUnparsed.length} 户时间未解析（已保留原时间或未选）`);
  message.success(parts.join("；"));
}

interface TenantGrayAiItem {
  tenant_id?: number | string;
  tenant_name?: string;
  car_total?: number;
  gray_time?: string;
}

function normalizeAiTenantId(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim();
}

function applyPlanAiGrayTimeItems(items: readonly TenantGrayAiItem[]) {
  const pendingSet = new Set(pendingTenantIds.value);
  let filled = 0;
  let skippedUnknown = 0;
  let skippedTime = 0;
  for (const item of items) {
    const id = normalizeAiTenantId(item.tenant_id);
    if (!id || !pendingSet.has(id)) {
      skippedUnknown += 1;
      continue;
    }
    const ms = parseImportedPlanTimeCell(String(item.gray_time ?? ""));
    if (ms == null) {
      skippedTime += 1;
      continue;
    }
    pendingTimeByTenant[id] = floorTimestampToLocalMinute(ms);
    filled += 1;
  }
  return { filled, skippedUnknown, skippedTime };
}

function clearAllPendingPlanTimes() {
  for (const id of pendingTenantIds.value) {
    pendingTimeByTenant[id] = null;
  }
  message.success("已清空全部计划灰度时间");
}

async function runAiGrayPlan() {
  if (!aiPlanButtonEnabled.value) {
    message.warning("请先为至少一户填写计划灰度时间");
    return;
  }
  const gray_tenant_list = planRowsToTsv(planRows.value, { includeHeader: true });
  aiPlanLoading.value = true;
  try {
    const res: any = await tenant_gray_ai_api({ gray_tenant_list });
    if (res != null && Number(res.code) !== 0) {
      throw new Error(res?.msg || "AI 计划失败");
    }
    const raw = res?.data;
    const list: TenantGrayAiItem[] = Array.isArray(raw) ? raw : [];
    if (list.length === 0) {
      message.warning("AI 未返回计划数据");
      return;
    }
    const { filled, skippedUnknown, skippedTime } = applyPlanAiGrayTimeItems(list);
    if (filled === 0) {
      message.warning("未能回填任何计划时间，请检查返回租户是否在待灰度列表中");
      return;
    }
    const parts = [`已回填 ${filled} 户计划时间`];
    if (skippedUnknown) parts.push(`跳过非待灰度 ${skippedUnknown} 条`);
    if (skippedTime) parts.push(`时间无效 ${skippedTime} 条`);
    message.success(parts.join("；"));
  } catch (e: any) {
    message.error(e?.message || String(e) || "AI 计划失败");
  } finally {
    aiPlanLoading.value = false;
  }
}
</script>

<style lang="less" scoped>
.tenant-gray-plan {
  width: min(1200px, 100%);
  box-sizing: border-box;
}

.tenant-gray-plan :deep(.n-card) {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.plan-spin {
  min-height: 280px;
}

.plan-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-split {
  display: grid;
  grid-template-columns: minmax(0, 0.32fr) minmax(0, 0.68fr);
  gap: 2px;
  align-items: stretch;
}

@media (max-width: 860px) {
  .plan-split {
    grid-template-columns: 1fr;
  }
}

.plan-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  padding: 12px;
}

.plan-col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.plan-col-head-with-actions {
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.plan-col-head-text {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.plan-col-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.plan-col-meta {
  font-size: 12px;
  color: #64748b;
}

.plan-left-search-sort-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}

.plan-search-input {
  flex: 1 1 auto;
  min-width: 0;
}

.plan-left-sort-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.plan-left-sort-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.plan-left-sort-select {
  width: 148px;
}

.plan-left-list-shell {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 560px;
  flex-shrink: 0;
}

.plan-left-pagination {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.plan-scroll.plan-scroll--tenant-board {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
  border: none;
  border-radius: 10px;
}

.plan-scroll.plan-scroll--tenant-board :deep(.n-scrollbar-content) {
  box-sizing: border-box;
}

/* 与 tenant-dashboard 单组 .panel 内列表（灰度组1 等同布局）一致：白底、8px 内边距、紧凑一行 grid */
.td-mirror-panel {
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

.td-mirror-panel:hover {
  border-color: #d4d4d8;
  box-shadow: 0 6px 16px rgb(15 23 42 / 6%);
}

.td-mirror-panel .panel-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.td-mirror-panel .panel-list {
  padding-right: 2px;
  overflow: visible;
}

.td-mirror-panel .tenant-row {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 2px;
  border-bottom: 1px dashed #edf2f7;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  margin-bottom: 0;
}

.td-mirror-panel .tenant-row:hover {
  background-color: #f4f4f5;
}

.td-mirror-panel .tenant-row.is-in-pending {
  background-color: #eff6ff;
}

.td-mirror-panel .tenant-row.tenant-row--standalone:not(.is-in-pending) {
  cursor: not-allowed;
  opacity: 0.82;
}

.td-mirror-panel .tenant-row.tenant-row--standalone:not(.is-in-pending):hover {
  background-color: #fafafa;
}

.td-mirror-panel .tenant-main {
  min-width: 0;
  flex: 1;
}

.td-mirror-panel .tenant-line {
  display: grid;
  grid-template-columns: var(--tenant-col-id, 5ch) minmax(0, 1fr) var(--tenant-col-ebike, 58px)
    var(--tenant-col-env, 84px);
  align-items: center;
  column-gap: 3px;
  font-size: 11px;
  line-height: 1;
  width: 100%;
  margin-bottom: 0;
  white-space: nowrap;
}

.td-mirror-panel .tenant-id {
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

.td-mirror-panel .tenant-id .tenant-id-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-mirror-panel .tenant-name {
  min-width: 0;
  max-width: 100%;
  justify-self: start;
  line-height: 1;
}

.td-mirror-panel .tenant-name-copy {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  color: #334155;
  line-height: 1;
}

.td-mirror-panel .tenant-line :deep(.tenant-ebike-tag) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  margin-left: 0;
  height: 17px;
  font-size: 11px;
  line-height: 15px;
  padding: 0 3px;
}

.td-mirror-panel .tenant-line :deep(.tenant-ebike-tag .n-tag__content) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.td-mirror-panel .tenant-ebike-tag-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.td-mirror-panel .tenant-ebike-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.92;
}

.td-mirror-panel .tenant-ebike-num {
  flex-shrink: 0;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.td-mirror-panel .tenant-line :deep(.tenant-env-tag) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  justify-content: center;
  margin-left: 0;
  height: 17px;
  font-size: 11px;
  line-height: 15px;
  padding: 0 0px;
}

.td-mirror-panel .tenant-line :deep(.tenant-env-tag .n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-foot-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.plan-pending-table {
  flex: 1 1 auto;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
}

/* 与左侧 .td-mirror-panel .tenant-line 一致：11px 字号与紧凑行高 */
.plan-pending-table :deep(.n-data-table-th) {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 2px 5px;
}

.plan-pending-table :deep(.n-data-table-td) {
  font-size: 11px;
  line-height: 1;
  padding: 2px 5px;
}

.plan-pending-table :deep(.n-data-table-tr:not(.n-data-table-tr--summary)) {
  border-bottom: 1px dashed #edf2f7;
}

.plan-pending-table :deep(.n-button) {
  font-size: 11px;
}

.plan-pending-table :deep(.n-date-picker),
.plan-pending-table :deep(.n-date-picker .n-input),
.plan-pending-table :deep(.n-date-picker .n-input__input-el) {
  font-size: 11px;
}

.plan-pending-table :deep(.n-date-picker .n-input) {
  --n-height: 22px;
  min-height: 22px;
}

.plan-pending-table :deep(.n-date-picker .n-input__input-el) {
  line-height: 1.1;
}

.plan-pending-table :deep(td.plan-pending-time-col) {
  white-space: nowrap;
  vertical-align: middle;
}

.plan-pending-table :deep(td.plan-pending-time-col .plan-pending-time-cell) {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  width: 100%;
  min-width: 0;
}

.plan-pending-time-picker-wrap {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 118px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.plan-pending-time-picker-wrap :deep(.n-date-picker) {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
}

.plan-pending-time-picker-wrap :deep(.n-date-picker .n-input) {
  max-width: 100%;
  --n-padding-left: 5px;
  --n-padding-right: 5px;
}

.plan-pending-time-cell :deep(.plan-pending-same-as-above-btn) {
  flex: 0 0 auto;
  height: auto;
  min-height: 0;
  padding: 0 2px;
  font-size: 11px;
  font-weight: 400;
}

/* 车辆数列排序激活时表头不要底色 */
.plan-pending-table :deep(th.plan-pending-car-total-th),
.plan-pending-table :deep(th.plan-pending-car-total-th.n-data-table-th--sorting),
.plan-pending-table :deep(th.plan-pending-car-total-th.n-data-table-th--sorted),
.plan-pending-table :deep(th.plan-pending-car-total-th:hover) {
  background-color: transparent !important;
}

.plan-pending-table :deep(th.plan-pending-car-total-th .n-data-table-th__title-wrapper),
.plan-pending-table :deep(th.plan-pending-car-total-th .n-data-table-sorter) {
  background-color: transparent !important;
}

.plan-pending-table :deep(.tenant-env-tag) {
  width: 80%;
  max-width: 100%;
  box-sizing: border-box;
  justify-content: center;
  margin-left: 0;
  height: 17px;
  font-size: 11px;
  line-height: 15px;
  padding: 0 3px;
}

.plan-pending-table :deep(.tenant-env-tag .n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-pending-env-fallback {
  font-size: 11px;
  line-height: 1;
  color: #64748b;
}

.plan-pending-table :deep(tr.plan-pending-time-g0 .n-data-table-td) {
  background-color: #eff6ff !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g0:hover .n-data-table-td) {
  background-color: #dbeafe !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g1 .n-data-table-td) {
  background-color: #f0fdf4 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g1:hover .n-data-table-td) {
  background-color: #dcfce7 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g2 .n-data-table-td) {
  background-color: #fefce8 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g2:hover .n-data-table-td) {
  background-color: #fef9c3 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g3 .n-data-table-td) {
  background-color: #fdf2f8 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g3:hover .n-data-table-td) {
  background-color: #fce7f3 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g4 .n-data-table-td) {
  background-color: #f5f3ff !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g4:hover .n-data-table-td) {
  background-color: #ede9fe !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g5 .n-data-table-td) {
  background-color: #ecfeff !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g5:hover .n-data-table-td) {
  background-color: #cffafe !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g6 .n-data-table-td) {
  background-color: #fff7ed !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g6:hover .n-data-table-td) {
  background-color: #ffedd5 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g7 .n-data-table-td) {
  background-color: #f4f4f5 !important;
}

.plan-pending-table :deep(tr.plan-pending-time-g7:hover .n-data-table-td) {
  background-color: #e4e4e7 !important;
}

.plan-import-modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-import-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.plan-import-hint code {
  font-size: 11px;
  padding: 0 4px;
  border-radius: 4px;
  background: #f4f4f5;
}

.plan-import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.plan-import-error-list {
  margin: 6px 0 0;
  padding-left: 1.2em;
  font-size: 12px;
}
</style>
