<template>
  <div class="ssb" :class="{ 'is-fullscreen': isFullscreen }">
    <header class="ssb-top">
      <div class="ssb-top-actions">
        <span v-if="lastRefreshText" class="ssb-refresh-text">上次刷新 {{ lastRefreshText }}</span>
        <button type="button" class="ssb-btn" :disabled="loading" @click="refreshAll">
          {{ loading ? '刷新中' : '刷新' }}
        </button>
        <button type="button" class="ssb-btn ghost" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </header>

    <n-spin :show="loading && !hasAnyData" class="ssb-spin">
      <div class="ssb-body">
        <section v-for="group in cloudGroups" :key="group.key" class="ssb-cloud">
          <div class="ssb-cloud-grid">
            <article
              v-for="panel in group.panels"
              :key="panel.env"
              class="ssb-card"
            >
              <div class="ssb-card-head">
                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <div class="ssb-card-title-wrap">
                      <n-icon
                        class="ssb-card-status"
                        :class="panelToneClass(panel)"
                        :component="panelStatusIcon(panel)"
                        :size="16"
                      />
                      <h3 class="ssb-card-title">
                        <span class="ssb-card-cloud">{{ group.label }}</span>
                        <span>{{ panel.shortLabel }}</span>
                      </h3>
                      <n-tag size="tiny" round :bordered="false" class="ssb-env-tag">
                        {{ panel.env }}
                      </n-tag>
                    </div>
                  </template>
                  <div class="ssb-tip">
                    <div>{{ panel.label }}</div>
                    <div>状态：{{ panelStatusLabel(panel) }}</div>
                    <div v-if="absoluteTime(panel)">巡检时间：{{ absoluteTime(panel) }}</div>
                    <div v-if="panel.report?.tenant_id">租户：{{ panel.report.tenant_id }}</div>
                    <div v-if="panel.report?.report_id">报告：{{ panel.report.report_id }}</div>
                    <div v-if="panel.report?.error_msg" class="tip-err">{{ panel.report.error_msg }}</div>
                  </div>
                </n-tooltip>
                <div class="ssb-card-actions">
                  <n-tooltip v-if="relativeTime(panel)" trigger="hover" placement="top">
                    <template #trigger>
                      <span class="ssb-card-time">{{ relativeTime(panel) }}</span>
                    </template>
                    {{ absoluteTime(panel) }}
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button
                        type="button"
                        class="ssb-card-refresh"
                        :disabled="isEnvRefreshing(panel.env)"
                        :class="{ 'is-loading': isEnvRefreshing(panel.env) }"
                        @click.stop="refreshEnv(panel.env)"
                      >
                        <n-icon :component="Refresh" :size="14" />
                      </button>
                    </template>
                    拉取最新一次巡检结果（不触发）
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button
                        type="button"
                        class="ssb-card-refresh"
                        :disabled="isEnvRunning(panel.env)"
                        :class="{ 'is-loading': isEnvRunning(panel.env) }"
                        @click.stop="runEnv(panel.env)"
                      >
                        <n-icon :component="PlayerPlay" :size="14" />
                      </button>
                    </template>
                    触发巡检
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button
                        type="button"
                        class="ssb-card-refresh"
                        @click.stop="openExpand(panel.env)"
                      >
                        <n-icon :component="ArrowsMaximize" :size="14" />
                      </button>
                    </template>
                    展开详情
                  </n-tooltip>
                </div>
              </div>

              <div v-if="panel.error" class="ssb-card-empty err">
                <n-icon :component="AlertCircle" :size="28" class="ssb-empty-icon" />
                <div>拉取失败</div>
              </div>

              <div
                v-else-if="!panel.report || isEmptyInspection(panel.report)"
                class="ssb-card-empty"
                :class="{ warn: Boolean(String(panel.report?.error_msg || '').trim()) }"
              >
                <div class="ssb-empty-inner">
                  <n-icon
                    :component="String(panel.report?.error_msg || '').trim() ? AlertTriangle : MoodEmpty"
                    :size="32"
                    class="ssb-empty-icon"
                  />
                  <div>{{ emptyInspectionText(panel.report) }}</div>
                </div>
              </div>

              <div v-else class="ssb-cols">
                <div
                  v-for="client in panel.clients"
                  :key="client.key"
                  class="ssb-col"
                  :class="clientToneClass(client)"
                >
                  <div class="ssb-col-title">
                    <n-icon
                      class="ssb-col-status"
                      :class="clientToneClass(client)"
                      :component="clientStatusIcon(client)"
                      :size="13"
                    />
                    <span>{{ client.label }}</span>
                  </div>
                  <div class="ssb-col-list">
                    <template v-if="client.steps.length === 0">
                      <div class="ssb-col-empty">—</div>
                    </template>
                    <template v-else>
                      <div
                        v-for="(step, idx) in client.steps"
                        :key="`${step.step_name}-${idx}`"
                        class="ssb-scene"
                        :class="statusClass(step.step_status)"
                      >
                        <n-tooltip
                          trigger="hover"
                          placement="top"
                          :disabled="!step.api_path"
                        >
                          <template #trigger>
                            <span class="ssb-scene-name">{{ step.step_name || '未命名步骤' }}</span>
                          </template>
                          <div class="ssb-tip">{{ step.api_path }}</div>
                        </n-tooltip>
                        <n-tooltip
                          trigger="hover"
                          placement="top"
                          :disabled="!(isFailOrAbnormal(step) && step.errormsg)"
                        >
                          <template #trigger>
                            <n-tag
                              size="small"
                              round
                              :bordered="false"
                              :type="stepTagType(step.step_status)"
                              class="ssb-status-tag"
                              :class="statusClass(step.step_status)"
                            >
                              <i class="ssb-status-dot" aria-hidden="true" />
                              {{ statusLabel(step.step_status) }}
                            </n-tag>
                          </template>
                          <div class="ssb-tip tip-err">{{ step.errormsg }}</div>
                        </n-tooltip>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </n-spin>

    <n-modal
      v-model:show="expandVisible"
      preset="card"
      :bordered="false"
      :closable="true"
      :mask-closable="true"
      class="ssb-expand-modal"
      style="width: min(96vw, 1600px)"
      :segmented="{ content: 'soft' }"
    >
      <template #header>
        <div v-if="expandedPanel" class="ssb-expand-head">
          <div class="ssb-expand-title">
            <span>{{ expandedPanel.label }}</span>
            <span class="ssb-expand-env">{{ expandedPanel.env }}</span>
          </div>
          <div class="ssb-expand-actions">
            <span v-if="relativeTime(expandedPanel)" class="ssb-card-time">
              {{ relativeTime(expandedPanel) }}
            </span>
            <button
              type="button"
              class="ssb-card-refresh"
              :disabled="isEnvRefreshing(expandedPanel.env)"
              :class="{ 'is-loading': isEnvRefreshing(expandedPanel.env) }"
              @click="refreshEnv(expandedPanel.env)"
            >
              <n-icon :component="Refresh" :size="16" />
            </button>
          </div>
        </div>
      </template>

      <div v-if="expandedPanel" class="ssb-expand">
        <div class="ssb-expand-meta">
          <div class="ssb-expand-meta-info">
            <span v-if="absoluteTime(expandedPanel)" class="ssb-expand-chip">
              <n-icon :component="Clock" :size="13" />
              <span>{{ absoluteTime(expandedPanel) }}</span>
            </span>
            <span v-if="expandedPanel.report?.tenant_id" class="ssb-expand-chip">
              <n-icon :component="Building" :size="13" />
              <span>租户 {{ expandedPanel.report.tenant_id }}</span>
            </span>
            <span v-if="expandedPanel.report?.report_id" class="ssb-expand-chip muted">
              <n-icon :component="FileText" :size="13" />
              <span>{{ expandedPanel.report.report_id }}</span>
            </span>
          </div>
          <div v-if="expandedPanel.report" class="ssb-expand-metrics">
            <div class="ssb-expand-metric is-ok">
              <span class="ssb-expand-metric-num">{{ expandedPanel.report.success_count ?? 0 }}</span>
              <span class="ssb-expand-metric-label">
                <i class="ssb-status-dot" aria-hidden="true" />
                正常
              </span>
            </div>
            <div class="ssb-expand-metric is-fail">
              <span class="ssb-expand-metric-num">{{ expandedPanel.report.fail_count ?? 0 }}</span>
              <span class="ssb-expand-metric-label">
                <i class="ssb-status-dot" aria-hidden="true" />
                失败
              </span>
            </div>
            <div class="ssb-expand-metric is-skip">
              <span class="ssb-expand-metric-num">{{ expandedPanel.report.skip_count ?? 0 }}</span>
              <span class="ssb-expand-metric-label">
                <i class="ssb-status-dot" aria-hidden="true" />
                跳过
              </span>
            </div>
            <div class="ssb-expand-metric is-unk">
              <span class="ssb-expand-metric-num">{{ expandedPanel.report.unknown_count ?? 0 }}</span>
              <span class="ssb-expand-metric-label">
                <i class="ssb-status-dot" aria-hidden="true" />
                未知
              </span>
            </div>
            <div class="ssb-expand-metric is-total">
              <span class="ssb-expand-metric-num">{{ expandedPanel.report.total_count ?? 0 }}</span>
              <span class="ssb-expand-metric-label">合计</span>
            </div>
          </div>
        </div>

        <div v-if="expandedPanel.error" class="ssb-card-empty err">
          <n-icon :component="AlertCircle" :size="28" class="ssb-empty-icon" />
          <div>拉取失败：{{ expandedPanel.error }}</div>
        </div>

        <div
          v-else-if="!expandedPanel.report || isEmptyInspection(expandedPanel.report)"
          class="ssb-card-empty"
          :class="{ warn: Boolean(String(expandedPanel.report?.error_msg || '').trim()) }"
        >
          <div class="ssb-empty-inner">
            <n-icon
              :component="String(expandedPanel.report?.error_msg || '').trim() ? AlertTriangle : MoodEmpty"
              :size="36"
              class="ssb-empty-icon"
            />
            <div>{{ emptyInspectionText(expandedPanel.report) }}</div>
          </div>
        </div>

        <div v-else class="ssb-cols ssb-expand-cols">
          <div
            v-for="client in expandedPanel.clients"
            :key="client.key"
            class="ssb-col ssb-expand-col"
            :class="clientToneClass(client)"
          >
            <div class="ssb-expand-col-title">
              <span class="ssb-expand-col-label">
                <n-icon
                  class="ssb-col-status"
                  :class="clientToneClass(client)"
                  :component="clientStatusIcon(client)"
                  :size="14"
                />
                {{ client.label }}
              </span>
              <span class="ssb-expand-col-stat">
                <em class="is-ok">{{ client.passed }}</em>/<em>{{ client.total }}</em>
              </span>
            </div>
            <div class="ssb-col-list">
              <template v-if="client.scenes.length === 0">
                <div class="ssb-col-empty">—</div>
              </template>
              <template v-else>
                <div
                  v-for="scene in client.scenes"
                  :key="scene.name"
                  class="ssb-expand-scene"
                  :class="sceneToneClass(scene)"
                >
                  <div class="ssb-expand-scene-head">
                    <span class="ssb-expand-scene-label">
                      <n-icon
                        class="ssb-expand-scene-icon"
                        :component="sceneStatusIcon(scene)"
                        :size="13"
                      />
                      <span class="ssb-expand-scene-name">{{ scene.name }}</span>
                      <span class="ssb-expand-scene-count">{{ scene.passed }}/{{ scene.total }}</span>
                    </span>
                    <n-tag
                      size="tiny"
                      round
                      :bordered="false"
                      :type="sceneTagType(scene)"
                      class="ssb-status-tag"
                      :class="sceneToneClass(scene)"
                    >
                      <i class="ssb-status-dot" aria-hidden="true" />
                      {{ sceneStatusLabel(scene) }}
                    </n-tag>
                  </div>
                  <div class="ssb-expand-scene-steps">
                    <div
                      v-for="(step, idx) in scene.steps"
                      :key="`${step.step_name}-${idx}`"
                      class="ssb-expand-step"
                      :class="statusClass(step.step_status)"
                    >
                      <div class="ssb-expand-step-top">
                        <span class="ssb-expand-step-name">{{ step.step_name || '未命名步骤' }}</span>
                        <n-tag
                          size="tiny"
                          round
                          :bordered="false"
                          :type="stepTagType(step.step_status)"
                          class="ssb-status-tag"
                          :class="statusClass(step.step_status)"
                        >
                          <i class="ssb-status-dot" aria-hidden="true" />
                          {{ statusLabel(step.step_status) }}
                        </n-tag>
                      </div>
                      <div
                        v-if="step.api_path || step.start_time"
                        class="ssb-expand-step-sub"
                      >
                        <span v-if="step.api_path" class="ssb-expand-step-api">{{ step.api_path }}</span>
                        <span v-if="step.start_time" class="ssb-expand-step-time">{{ step.start_time }}</span>
                      </div>
                      <div
                        v-if="isFailOrAbnormal(step) && step.errormsg"
                        class="ssb-expand-step-err"
                      >
                        <n-icon :component="AlertCircle" :size="13" class="ssb-expand-step-err-icon" />
                        <div class="ssb-expand-step-err-text">{{ step.errormsg }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useThemeVars, useMessage } from 'naive-ui';
import { Refresh, MoodEmpty, AlertCircle, ArrowsMaximize, CircleCheck, AlertTriangle, CircleDashed, Clock, Building, FileText, PlayerPlay } from '@vicons/tabler';
import {
  service_status_list_api,
  service_status_run_api,
  type ServiceStatusReport,
  type ServiceStatusStep,
} from '@/api/service-status';
import { useAppTheme } from '@/ui/theme/themes';

const themeVars = useThemeVars();
const appTheme = useAppTheme();
const message = useMessage();

const ssbBg = computed(() => themeVars.value.bodyColor);
const ssbCard = computed(() => themeVars.value.cardColor);
const ssbText = computed(() => themeVars.value.textColorBase);
const ssbMuted = computed(() => themeVars.value.textColor3);
const ssbLine = computed(() => themeVars.value.borderColor);
const ssbPrimary = computed(() => themeVars.value.primaryColor);
const ssbOk = computed(() => appTheme.value.success.color);
const ssbOkFaded = computed(() => appTheme.value.success.colorFaded);
const ssbFail = computed(() => appTheme.value.error.color);
const ssbFailFaded = computed(() => appTheme.value.error.colorFaded);
const ssbWarn = computed(() => appTheme.value.warning.color);
const ssbWarnFaded = computed(() => appTheme.value.warning.colorFaded);
const ssbHover = computed(() => appTheme.value.default.colorHover);
const ssbPressed = computed(() => appTheme.value.default.color);

const BUSINESS_NAME = '共享';
const LATEST = 1;
const POLL_MS = 60_000;
const TICK_MS = 30_000;

type EnvDef = {
  env: string;
  label: string;
  shortLabel: string;
  cloud: 'aliyun' | 'huawei';
};

const ENV_DEFS: EnvDef[] = [
  { env: 'prod2', label: '阿里云正式', shortLabel: '正式', cloud: 'aliyun' },
  { env: 'prod2-gray', label: '阿里云灰度组1', shortLabel: '灰度组1', cloud: 'aliyun' },
  { env: 'prod2-gray2', label: '阿里云灰度组2', shortLabel: '灰度组2', cloud: 'aliyun' },
  { env: 'prod', label: '华为云正式', shortLabel: '正式', cloud: 'huawei' },
  { env: 'prod-gray', label: '华为云灰度组1', shortLabel: '灰度组1', cloud: 'huawei' },
  { env: 'prod-gray2', label: '华为云灰度组2', shortLabel: '灰度组2', cloud: 'huawei' },
];

const CLIENT_ORDER = [
  { key: 'c_mp', label: '用户端', aliases: ['c_mp', '用户端'] },
  { key: 'b_platform', label: '平台端', aliases: ['b_platform', '平台端'] },
  { key: 'b_app', label: '商家端', aliases: ['b_app', '商家端'] },
] as const;

type SceneGroup = {
  name: string;
  steps: ServiceStatusStep[];
  passed: number;
  failed: number;
  skipped: number;
  unknown: number;
  total: number;
};

type ClientGroup = {
  key: string;
  label: string;
  steps: ServiceStatusStep[];
  scenes: SceneGroup[];
  passed: number;
  failed: number;
  skipped: number;
  unknown: number;
  total: number;
};

type PanelState = EnvDef & {
  report: ServiceStatusReport | null;
  clients: ClientGroup[];
  error: string;
};

const loading = ref(false);
const isFullscreen = ref(false);
const nowTick = ref(Date.now());
const lastRefreshText = ref('');
const refreshingEnvs = ref<Record<string, boolean>>({});
const runningEnvs = ref<Record<string, boolean>>({});
const expandVisible = ref(false);
const expandedEnv = ref<string | null>(null);

const panelMap = ref<Record<string, PanelState>>(
  Object.fromEntries(
    ENV_DEFS.map((item) => [
      item.env,
      {
        ...item,
        report: null,
        clients: emptyClients(),
        error: '',
      } satisfies PanelState,
    ]),
  ),
);

const cloudGroups = computed(() => [
  {
    key: 'aliyun',
    label: '阿里云',
    panels: ENV_DEFS.filter((e) => e.cloud === 'aliyun').map((e) => panelMap.value[e.env]),
  },
  {
    key: 'huawei',
    label: '华为云',
    panels: ENV_DEFS.filter((e) => e.cloud === 'huawei').map((e) => panelMap.value[e.env]),
  },
]);

const hasAnyData = computed(() =>
  ENV_DEFS.some((e) => {
    const p = panelMap.value[e.env];
    return p.report != null || Boolean(p.error);
  }),
);

const expandedPanel = computed(() => {
  if (!expandedEnv.value) return null;
  return panelMap.value[expandedEnv.value] || null;
});

let pollTimer: ReturnType<typeof setInterval> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function emptyClients(): ClientGroup[] {
  return CLIENT_ORDER.map((c) => ({
    key: c.key,
    label: c.label,
    steps: [],
    scenes: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    unknown: 0,
    total: 0,
  }));
}

function isEmptyInspection(report: ServiceStatusReport) {
  // 报告级异常时步骤 list 无意义，按空报告展示 error_msg
  if (String(report.error_msg || '').trim()) return true;
  return (report.list || []).length === 0;
}

function emptyInspectionText(report: ServiceStatusReport | null | undefined) {
  const msg = String(report?.error_msg || '').trim();
  return msg || '暂无';
}

function reportTime(report: ServiceStatusReport | null | undefined) {
  if (!report) return '';
  return String(report.end_time || report.start_time || '').trim();
}

function parseReportDate(timeStr: string) {
  const text = timeStr.trim();
  if (!text) return null;
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatRelativeFrom(timeStr: string, nowMs: number) {
  const d = parseReportDate(timeStr);
  if (!d) return '';
  const diffSec = Math.max(0, Math.floor((nowMs - d.getTime()) / 1000));
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
  const days = Math.floor(diffSec / 86400);
  if (days < 30) return `${days}天前`;
  return timeStr;
}

function relativeTime(panel: PanelState) {
  void nowTick.value;
  const t = reportTime(panel.report);
  if (!t) return '';
  return formatRelativeFrom(t, nowTick.value);
}

function absoluteTime(panel: PanelState) {
  return reportTime(panel.report);
}

function formatClock(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeClientKey(raw: string | null | undefined) {
  const text = String(raw || '').trim();
  for (const client of CLIENT_ORDER) {
    if (client.aliases.includes(text) || client.key === text) return client.key;
  }
  return text || 'unknown';
}

function stepSeverity(status: number | null | undefined) {
  // 越小越靠前：失败 > 未知 > 跳过 > 通过
  if (status === 2) return 0;
  if (status == null) return 1;
  if (status === 0) return 2;
  if (status === 1) return 3;
  return 1;
}

function stepTimeMs(step: ServiceStatusStep) {
  const d = parseReportDate(String(step.start_time || '').trim());
  return d ? d.getTime() : Number.POSITIVE_INFINITY;
}

function sortSteps(steps: ServiceStatusStep[]) {
  return [...steps].sort((a, b) => {
    const severityDiff = stepSeverity(a.step_status) - stepSeverity(b.step_status);
    if (severityDiff !== 0) return severityDiff;
    const timeDiff = stepTimeMs(a) - stepTimeMs(b);
    if (timeDiff !== 0) return timeDiff;
    return String(a.step_name || '').localeCompare(String(b.step_name || ''), 'zh');
  });
}

function sceneSeverity(scene: SceneGroup) {
  if (scene.failed > 0) return 0;
  if (scene.unknown > 0) return 1;
  if (scene.skipped > 0 && scene.passed < scene.total) return 2;
  if (scene.total > 0 && scene.passed === scene.total) return 3;
  return 2;
}

function sceneEarliestTime(scene: SceneGroup) {
  let min = Number.POSITIVE_INFINITY;
  for (const step of scene.steps) {
    const t = stepTimeMs(step);
    if (t < min) min = t;
  }
  return min;
}

function sortScenes(scenes: SceneGroup[]) {
  return [...scenes].sort((a, b) => {
    const severityDiff = sceneSeverity(a) - sceneSeverity(b);
    if (severityDiff !== 0) return severityDiff;
    const timeDiff = sceneEarliestTime(a) - sceneEarliestTime(b);
    if (timeDiff !== 0) return timeDiff;
    return a.name.localeCompare(b.name, 'zh');
  });
}

function buildSceneGroup(name: string, steps: ServiceStatusStep[]): SceneGroup {
  const ordered = sortSteps(steps);
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let unknown = 0;
  for (const step of ordered) {
    if (step.step_status === 1) passed += 1;
    else if (step.step_status === 2) failed += 1;
    else if (step.step_status === 0) skipped += 1;
    else unknown += 1;
  }
  return {
    name,
    steps: ordered,
    passed,
    failed,
    skipped,
    unknown,
    total: ordered.length,
  };
}

function buildClientGroup(key: string, label: string, steps: ServiceStatusStep[]): ClientGroup {
  const ordered = sortSteps(steps);
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let unknown = 0;
  for (const step of ordered) {
    if (step.step_status === 1) passed += 1;
    else if (step.step_status === 2) failed += 1;
    else if (step.step_status === 0) skipped += 1;
    else unknown += 1;
  }

  const sceneMap = new Map<string, ServiceStatusStep[]>();
  for (const step of steps) {
    const scene = String(step.scene_name || '未命名场景').trim() || '未命名场景';
    if (!sceneMap.has(scene)) sceneMap.set(scene, []);
    sceneMap.get(scene)!.push(step);
  }
  const scenes = sortScenes(
    [...sceneMap.entries()].map(([name, sceneSteps]) => buildSceneGroup(name, sceneSteps)),
  );

  return {
    key,
    label,
    steps: ordered,
    scenes,
    passed,
    failed,
    skipped,
    unknown,
    total: ordered.length,
  };
}

function groupByClient(list: ServiceStatusStep[]): ClientGroup[] {
  const buckets = new Map<string, ServiceStatusStep[]>();
  for (const step of list) {
    const key = normalizeClientKey(step.client_name);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(step);
  }

  return CLIENT_ORDER.map((client) =>
    buildClientGroup(client.key, client.label, buckets.get(client.key) || []),
  );
}

function statusLabel(status: number | null | undefined) {
  if (status === 1) return '正常';
  if (status === 2) return '失败';
  if (status === 0) return '跳过';
  return '未知';
}

function statusClass(status: number | null | undefined) {
  if (status === 1) return 'is-ok';
  if (status === 2) return 'is-fail';
  if (status === 0) return 'is-skip';
  return 'is-unk';
}

function isFailOrAbnormal(step: ServiceStatusStep) {
  return step.step_status === 2 || step.step_status == null;
}

function clientToneClass(client: ClientGroup) {
  if (client.total <= 0) return 'is-muted';
  if (client.failed > 0) return 'is-fail';
  if (client.unknown > 0) return 'is-unk';
  if (client.passed === client.total) return 'is-ok';
  if (client.skipped > 0) return 'is-skip';
  return 'is-muted';
}

function sceneToneClass(scene: SceneGroup) {
  if (scene.failed > 0) return 'is-fail';
  if (scene.unknown > 0) return 'is-unk';
  if (scene.total > 0 && scene.passed === scene.total) return 'is-ok';
  if (scene.skipped > 0) return 'is-skip';
  return 'is-muted';
}

function sceneStatusLabel(scene: SceneGroup) {
  if (scene.failed > 0) return '失败';
  if (scene.unknown > 0) return '未知';
  if (scene.total > 0 && scene.passed === scene.total) return '正常';
  if (scene.skipped > 0 && scene.passed === 0) return '跳过';
  return '正常';
}

function sceneTagType(scene: SceneGroup): 'success' | 'error' | 'warning' | 'default' {
  if (scene.failed > 0) return 'error';
  if (scene.unknown > 0) return 'warning';
  if (scene.total > 0 && scene.passed === scene.total) return 'success';
  return 'default';
}

function sceneStatusIcon(scene: SceneGroup) {
  const tone = sceneToneClass(scene);
  if (tone === 'is-ok') return CircleCheck;
  if (tone === 'is-fail') return AlertCircle;
  if (tone === 'is-unk') return AlertTriangle;
  return CircleDashed;
}

function stepTagType(status: number | null | undefined): 'success' | 'error' | 'warning' | 'default' {
  if (status === 1) return 'success';
  if (status === 2) return 'error';
  if (status === 0) return 'default';
  return 'warning';
}

function panelToneClass(panel: PanelState) {
  if (panel.error) return 'is-fail';
  const report = panel.report;
  // 无租户 / 无步骤数据 → 灰色
  if (!report || isEmptyInspection(report)) return 'is-muted';
  // 有失败或报告级异常 → 红色
  if (report.error_msg || (report.fail_count ?? 0) > 0) return 'is-fail';
  const total = report.total_count ?? 0;
  const success = report.success_count ?? 0;
  const unknown = report.unknown_count ?? 0;
  const skip = report.skip_count ?? 0;
  // 有未知 → 黄色
  if (unknown > 0) return 'is-unk';
  // 全通过 → 绿色
  if (total > 0 && success === total) return 'is-ok';
  // 仅跳过 / 其它 → 灰色
  if (skip > 0 && success + skip === total) return 'is-muted';
  return 'is-muted';
}

function panelStatusLabel(panel: PanelState) {
  const tone = panelToneClass(panel);
  if (tone === 'is-ok') return '正常';
  if (tone === 'is-fail') return '失败';
  if (tone === 'is-unk') return '未知';
  return '暂无 / 跳过';
}

function panelStatusIcon(panel: PanelState) {
  const tone = panelToneClass(panel);
  if (tone === 'is-ok') return CircleCheck;
  if (tone === 'is-fail') return AlertCircle;
  if (tone === 'is-unk') return AlertTriangle;
  return CircleDashed;
}

function clientStatusIcon(client: ClientGroup) {
  const tone = clientToneClass(client);
  if (tone === 'is-ok') return CircleCheck;
  if (tone === 'is-fail') return AlertCircle;
  if (tone === 'is-unk') return AlertTriangle;
  return CircleDashed;
}

function isEnvRefreshing(env: string) {
  return Boolean(refreshingEnvs.value[env]);
}

function isEnvRunning(env: string) {
  return Boolean(runningEnvs.value[env]);
}

function openExpand(env: string) {
  expandedEnv.value = env;
  expandVisible.value = true;
}

async function runEnv(env: string) {
  if (runningEnvs.value[env]) return;
  runningEnvs.value = { ...runningEnvs.value, [env]: true };
  try {
    const resp: any = await service_status_run_api({ env });
    if (resp?.code !== 0 && resp?.code !== '0') {
      message.error(resp?.msg || `触发 ${env} 巡检失败`);
      return;
    }
    message.success(`已触发 ${env} 巡检`);
  } catch (e: any) {
    message.error(e?.message || `触发 ${env} 巡检失败`);
  } finally {
    runningEnvs.value = { ...runningEnvs.value, [env]: false };
  }
}

async function fetchEnv(env: string) {
  try {
    const resp: any = await service_status_list_api({
      business_name: BUSINESS_NAME,
      env,
      latest: LATEST,
    });
    if (resp?.code !== 0 && resp?.code !== '0') {
      panelMap.value[env] = {
        ...panelMap.value[env],
        report: null,
        clients: emptyClients(),
        error: resp?.msg || '接口返回异常',
      };
      return;
    }
    const report = (resp?.data || null) as ServiceStatusReport | null;
    panelMap.value[env] = {
      ...panelMap.value[env],
      report,
      clients: groupByClient(report?.list || []),
      error: '',
    };
  } catch (e: any) {
    panelMap.value[env] = {
      ...panelMap.value[env],
      report: null,
      clients: emptyClients(),
      error: e?.message || '网络异常',
    };
  }
}

async function refreshEnv(env: string) {
  if (refreshingEnvs.value[env]) return;
  refreshingEnvs.value = { ...refreshingEnvs.value, [env]: true };
  try {
    await fetchEnv(env);
    nowTick.value = Date.now();
    lastRefreshText.value = formatClock();
  } finally {
    refreshingEnvs.value = { ...refreshingEnvs.value, [env]: false };
  }
}

async function refreshAll() {
  loading.value = true;
  try {
    await Promise.all(ENV_DEFS.map((item) => fetchEnv(item.env)));
    nowTick.value = Date.now();
    lastRefreshText.value = formatClock();
  } finally {
    loading.value = false;
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

onMounted(() => {
  refreshAll();
  pollTimer = setInterval(refreshAll, POLL_MS);
  tickTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, TICK_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (tickTimer) clearInterval(tickTimer);
  pollTimer = null;
  tickTimer = null;
});
</script>

<style scoped lang="less">
.ssb {
  --bg: v-bind(ssbBg);
  --card: v-bind(ssbCard);
  --text: v-bind(ssbText);
  --muted: v-bind(ssbMuted);
  --line: v-bind(ssbLine);
  --primary: v-bind(ssbPrimary);
  --ok: v-bind(ssbOk);
  --ok-bg: v-bind(ssbOkFaded);
  --fail: v-bind(ssbFail);
  --fail-bg: v-bind(ssbFailFaded);
  --unk: v-bind(ssbWarn);
  --unk-bg: v-bind(ssbWarnFaded);
  --hover: v-bind(ssbHover);
  --soft: v-bind(ssbPressed);

  width: 100% !important;
  max-width: 100% !important;
  flex: 1 1 98% !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 200px);
  min-height: calc(100dvh - 200px);
  max-height: calc(100dvh - 200px);
  padding: 0;
  color: var(--text);
  background: transparent;
  border-radius: 0;
  overflow: hidden;
}

.ssb.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
  border-radius: 0;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  padding: 12px 16px 16px;
  background: var(--bg);
}

.ssb-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0;
}

.ssb-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ssb-refresh-text {
  font-size: 12px;
  color: var(--muted);
}

.ssb-btn {
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.ssb-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

.ssb-btn.ghost {
  color: var(--muted);
}

.ssb-spin {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ssb-spin :deep(.n-spin-container),
.ssb-spin :deep(.n-spin-content) {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ssb-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ssb-cloud {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ssb-cloud-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: 0;
  border-radius: 0;
  overflow: visible;
  background: transparent;
}

.ssb-cloud-grid > .ssb-card + .ssb-card {
  border-left: 0;
}

@media (max-width: 1100px) {
  .ssb {
    height: auto;
    min-height: calc(100dvh - 200px);
    max-height: none;
    overflow: auto;
  }

  .ssb-cloud-grid {
    grid-template-columns: 1fr;
  }

  .ssb-cloud-grid > .ssb-card + .ssb-card {
    border-left: 0;
    border-top: 0;
  }

  .ssb-cloud {
    flex: none;
  }
}

.ssb-card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  min-width: 0;
}

.ssb-card-cloud {
  color: var(--text);
}

.ssb-env-tag {
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--muted) !important;
  background: color-mix(in srgb, var(--line) 55%, transparent) !important;
}

.ssb-card {
  display: flex;
  flex-direction: column;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px 8px;
  height: 100%;
  min-height: 0;
  max-height: none;
  box-shadow: none;
  overflow: hidden;
  position: relative;
}

@media (max-width: 1100px) {
  .ssb-card {
    height: 320px;
    min-height: 320px;
    max-height: 320px;
  }
}

.ssb-card::before {
  display: none;
}

.ssb-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 0;
  border-bottom: 0;
  flex-shrink: 0;
}

.ssb-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ssb-card-status {
  flex-shrink: 0;

  &.is-ok {
    color: var(--ok);
  }

  &.is-fail {
    color: var(--fail);
  }

  &.is-unk {
    color: var(--unk);
  }

  &.is-muted {
    color: var(--muted);
    opacity: 0.75;
  }
}

.ssb-card-env {
  display: none;
}

.ssb-card-time {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
  cursor: default;
}

.ssb-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ssb-card-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.ssb-card-refresh:hover:not(:disabled) {
  color: var(--primary);
  background: var(--hover);
}

.ssb-card-refresh:disabled {
  opacity: 0.55;
  cursor: default;
}

.ssb-card-refresh.is-loading :deep(.n-icon) {
  animation: ssb-spin 0.8s linear infinite;
}

@keyframes ssb-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ssb-card-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
  padding: 12px;
}

.ssb-card-empty.err {
  color: var(--fail);
  flex-direction: column;
  gap: 8px;
}

.ssb-card-empty.warn {
  color: var(--muted);
  flex-direction: column;
  gap: 8px;
}

.ssb-empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.ssb-empty-icon {
  opacity: 0.55;
  color: var(--muted);
}

.ssb-card-empty.err .ssb-empty-icon {
  color: var(--fail);
  opacity: 0.8;
}

.ssb-card-empty.warn .ssb-empty-icon {
  color: var(--muted);
  opacity: 0.7;
}

.ssb-card-hint {
  display: none;
}

.ssb-cols {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ssb-col {
  flex: 1 1 0;
  min-width: 0;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
}

.ssb-col.is-ok {
  border-width: 2px;
  border-color: var(--ok);
}

.ssb-col.is-fail {
  border-width: 2px;
  border-color: #ff0000;
}

.ssb-col.is-unk {
  border-width: 2px;
  border-color: var(--unk);
}

.ssb-col.is-skip {
  border-width: 2px;
  border-color: color-mix(in srgb, var(--muted) 70%, var(--line));
}

.ssb-col.is-muted {
  border-width: 1px;
  border-color: var(--line);
}

.ssb-col-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 650;
  color: var(--muted);
  text-align: left;
  white-space: nowrap;
  flex-shrink: 0;
}

.ssb-col-status {
  flex-shrink: 0;

  &.is-ok {
    color: var(--ok);
  }

  &.is-fail {
    color: var(--fail);
  }

  &.is-unk {
    color: var(--unk);
  }

  &.is-skip,
  &.is-muted {
    color: var(--muted);
    opacity: 0.75;
  }
}

.ssb-col-empty {
  color: var(--muted);
  font-size: 11px;
  text-align: left;
  padding: 4px 0;
  opacity: 0.7;
}

.ssb-col-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ssb-col-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.ssb-scene {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 5px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  color: var(--text);
  cursor: default;
  text-align: left;
  font: inherit;
  min-height: 0;
}

.ssb-scene:last-child {
  border-bottom: 0;
}

.ssb-scene:hover {
  background: transparent;
}

.ssb-scene-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.35;
  color: var(--muted);
}

.ssb-status-tag {
  flex-shrink: 0;
  transform-origin: center;

  :deep(.n-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.ssb-status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
}

.ssb-status-tag.is-ok .ssb-status-dot {
  background: var(--ok);
}

.ssb-status-tag.is-fail .ssb-status-dot {
  background: var(--fail);
}

.ssb-status-tag.is-unk .ssb-status-dot {
  background: var(--unk);
}

.ssb-status-tag.is-skip .ssb-status-dot {
  background: var(--muted);
}

.ssb-status-tag.is-ok {
  animation: ssb-tag-breathe 2.4s ease-in-out infinite;
}

.ssb-status-tag.is-fail {
  animation: ssb-tag-pulse 1.4s ease-in-out infinite;
}

.ssb-status-tag.is-unk {
  animation: ssb-tag-breathe 2s ease-in-out infinite;
}

@keyframes ssb-tag-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.06);
    filter: brightness(1.08);
  }
}

@keyframes ssb-tag-breathe {
  0%,
  100% {
    opacity: 0.88;
  }
  50% {
    opacity: 1;
  }
}

.ssb-tip {
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;

  .tip-err {
    color: var(--fail);
    margin-top: 4px;
  }
}

.ssb-expand-head {
  --text: v-bind(ssbText);
  --muted: v-bind(ssbMuted);
  --primary: v-bind(ssbPrimary);
  --hover: v-bind(ssbHover);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-right: 8px;
  color: var(--text);
}

.ssb-expand-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
}

.ssb-expand-env {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

.ssb-expand-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ssb-expand {
  --bg: v-bind(ssbBg);
  --card: v-bind(ssbCard);
  --text: v-bind(ssbText);
  --muted: v-bind(ssbMuted);
  --line: v-bind(ssbLine);
  --primary: v-bind(ssbPrimary);
  --ok: v-bind(ssbOk);
  --ok-bg: v-bind(ssbOkFaded);
  --fail: v-bind(ssbFail);
  --fail-bg: v-bind(ssbFailFaded);
  --unk: v-bind(ssbWarn);
  --unk-bg: v-bind(ssbWarnFaded);
  --hover: v-bind(ssbHover);
  --soft: v-bind(ssbPressed);

  display: flex;
  flex-direction: column;
  gap: 8px;
  height: min(82vh, 900px);
  min-height: 420px;
  color: var(--text);
}

.ssb-expand-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 10px 16px;
  flex-shrink: 0;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--line) 22%, transparent);
}

.ssb-expand-meta-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 240px;
}

.ssb-expand-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--card) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
  line-height: 1.3;

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.n-icon) {
    flex-shrink: 0;
    color: var(--muted);
  }

  &.muted {
    color: var(--muted);
  }
}

.ssb-expand-metrics {
  display: flex;
  align-items: stretch;
  gap: 6px;
  flex: 0 0 auto;
}

.ssb-expand-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--card) 75%, transparent);
  border: 1px solid transparent;
  line-height: 1.15;
}

.ssb-expand-metric-num {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.ssb-expand-metric-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.ssb-expand-metric-label .ssb-status-dot {
  background: currentColor;
}

.ssb-expand-metric.is-ok {
  background: color-mix(in srgb, var(--ok-bg) 75%, transparent);
  border-color: color-mix(in srgb, var(--ok) 25%, transparent);

  .ssb-expand-metric-num,
  .ssb-expand-metric-label {
    color: var(--ok);
  }
}

.ssb-expand-metric.is-fail {
  background: color-mix(in srgb, var(--fail-bg) 75%, transparent);
  border-color: color-mix(in srgb, var(--fail) 25%, transparent);

  .ssb-expand-metric-num,
  .ssb-expand-metric-label {
    color: var(--fail);
  }
}

.ssb-expand-metric.is-unk {
  background: color-mix(in srgb, var(--unk-bg) 75%, transparent);
  border-color: color-mix(in srgb, var(--unk) 25%, transparent);

  .ssb-expand-metric-num,
  .ssb-expand-metric-label {
    color: var(--unk);
  }
}

.ssb-expand-metric.is-skip {
  background: color-mix(in srgb, var(--line) 55%, transparent);
  border-color: color-mix(in srgb, var(--muted) 45%, transparent);

  .ssb-expand-metric-num,
  .ssb-expand-metric-label {
    color: var(--muted);
  }
}

.ssb-expand-metric.is-total {
  background: color-mix(in srgb, var(--soft) 55%, transparent);
  border-color: color-mix(in srgb, var(--line) 80%, transparent);
}

.ssb-expand-err {
  font-size: 12px;
  color: var(--fail);
  background: color-mix(in srgb, var(--fail-bg) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--fail) 35%, transparent);
  border-radius: 6px;
  padding: 6px 8px;
  flex-shrink: 0;
}

.ssb-expand-cols {
  flex: 1;
  min-height: 0;
  gap: 10px;
}

.ssb-expand-col {
  padding: 6px 8px;
}

.ssb-expand-col-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  font-weight: 650;
  margin-bottom: 4px;
  color: var(--text);
  flex-shrink: 0;
}

.ssb-expand-col-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.ssb-expand-col-stat {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  font-style: normal;

  em {
    font-style: normal;
  }

  em.is-ok {
    color: var(--ok);
  }
}

.ssb-expand-scene {
  position: relative;
  margin-bottom: 12px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--primary) 28%, var(--line));
  border-radius: 8px;
  background: var(--card);
  overflow: hidden;
}

.ssb-expand-scene:last-child {
  margin-bottom: 4px;
}

.ssb-expand-scene-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 22%, var(--line));
  background: color-mix(in srgb, var(--primary) 14%, var(--card));
}

.ssb-expand-scene-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ssb-expand-scene-icon {
  flex-shrink: 0;
  color: var(--primary);
}

.ssb-expand-scene-name {
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--primary);
}

.ssb-expand-scene-count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--primary) 55%, var(--muted));
  font-variant-numeric: tabular-nums;
}

.ssb-expand-scene-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--bg) 55%, var(--card));
}

.ssb-expand-step {
  position: relative;
  padding: 6px 8px 6px 10px;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
  border-radius: 6px;
  background: transparent;
}

.ssb-expand-step::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 6px 0 0 6px;
  background: color-mix(in srgb, var(--line) 70%, transparent);
}

.ssb-expand-step.is-ok {
  background: color-mix(in srgb, var(--ok-bg) 55%, var(--card));
  border-color: color-mix(in srgb, var(--line) 50%, transparent);
}

.ssb-expand-step.is-ok::before {
  background: color-mix(in srgb, var(--ok) 55%, var(--line));
}

.ssb-expand-step.is-fail {
  background: color-mix(in srgb, var(--fail-bg) 60%, var(--card));
  border-color: color-mix(in srgb, var(--line) 55%, transparent);
}

.ssb-expand-step.is-fail::before {
  background: color-mix(in srgb, var(--fail) 60%, var(--line));
}

.ssb-expand-step.is-unk {
  background: color-mix(in srgb, var(--unk-bg) 60%, var(--card));
  border-color: color-mix(in srgb, var(--line) 55%, transparent);
}

.ssb-expand-step.is-unk::before {
  background: color-mix(in srgb, var(--unk) 55%, var(--line));
}

.ssb-expand-step.is-skip {
  background: color-mix(in srgb, var(--line) 30%, var(--card));
  border-color: color-mix(in srgb, var(--line) 50%, transparent);
}

.ssb-expand-step.is-skip::before {
  background: color-mix(in srgb, var(--muted) 45%, var(--line));
}

.ssb-expand-step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 18px;
}

.ssb-expand-step-name {
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted);
}

.ssb-expand-step-sub {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
  min-width: 0;
}

.ssb-expand-step-api {
  min-width: 0;
  flex: 1;
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ssb-expand-step-err {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 5px;
  padding: 6px 8px;
  border-radius: 5px;
  border: 1px solid color-mix(in srgb, var(--fail) 28%, var(--line));
  background: color-mix(in srgb, var(--fail-bg) 70%, var(--card));
  color: var(--fail);
}

.ssb-expand-step-err-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--fail);
  opacity: 0.9;
}

.ssb-expand-step-err-text {
  min-width: 0;
  flex: 1;
  font-size: 11px;
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.ssb-expand-step-time {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--muted);
  opacity: 0.85;
  white-space: nowrap;
}

:deep(.n-spin-content) {
  color: inherit;
}
</style>

<style lang="less">
.ssb-expand-modal.n-modal,
.ssb-expand-modal.n-card {
  max-width: 96vw;
}

.ssb-expand-modal .n-card-header {
  padding: 12px 16px 6px !important;
}

.ssb-expand-modal .n-card__content {
  padding: 4px 16px 12px !important;
}
</style>
