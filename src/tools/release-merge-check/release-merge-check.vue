<template>
  <div class="release-merge-check">
    <n-card class="search-card">
      <div class="input-section">
        <div class="input-group">
          <n-input
            v-model:value="releaseUrl"
            placeholder="粘贴TAPD发布计划链接..."
            @keyup.enter="fetchReport"
            class="release-url-input"
          />
          <div class="button-group">
            <n-button
              type="primary"
              :loading="loading"
              @click="fetchReport"
              class="fetch-button"
            >
              开始检查
            </n-button>
            <n-button
              v-if="result"
              type="default"
              @click="clearData"
              class="clear-button"
            >
              清空
            </n-button>
          </div>
          <span v-if="lastRefreshTime" class="last-refresh-time">
            上次：{{ lastRefreshTime }}
          </span>
        </div>
        <div v-if="historyList.length > 0" class="history-section">
          <div class="history-tags">
            <n-tag
              v-for="(item, index) in historyList"
              :key="index"
              class="history-tag"
              closable
              @click="selectHistory(item.url)"
              @close.stop="deleteHistory(index)"
            >
              {{ item.name }}
            </n-tag>
          </div>
        </div>
      </div>
    </n-card>

    <n-card class="content-card">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="medium" />
        <span class="loading-text">正在检查MR，请稍候...</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error">
        <n-alert type="error" :title="error" />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && (!result || !result.items || result.items.length === 0)" class="empty-section">
        <n-empty description="请输入TAPD发布计划链接并开始检查" />
      </div>

      <!-- 结果展示 -->
      <div v-if="result && result.items && result.items.length > 0" class="result-section">
        <!-- 发布计划信息 -->
        <div class="release-info">
          <div v-if="result.release_info" class="release-details">
            <n-space justify="center" :size="16">
              <span>
                <n-text strong>发布计划ID：</n-text>
                <c-link :href="releaseUrl" target="_blank">
                  {{ result.release_info.id }}
                </c-link>
              </span>
              <span>
                <n-text strong>发布计划名称：</n-text>
                <c-link :href="releaseUrl" target="_blank">
                  {{ result.release_info.name }}
                </c-link>
              </span>
            </n-space>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stat-cards">
          <n-grid :cols="7" :x-gap="4" :y-gap="4">
            <n-grid-item>
              <n-card
                class="stat-card story-card"
                :class="{ active: typeFilter === 'story' }"
                @click="toggleTypeFilter('story')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ storyCount }}</div>
                  <div class="stat-label">需求数</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card bug-card"
                :class="{ active: typeFilter === 'bug' }"
                @click="toggleTypeFilter('bug')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ bugCount }}</div>
                  <div class="stat-label">缺陷数</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card total-card"
                @click="clearAllFilters"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ mrTotalAll }}</div>
                  <div class="stat-label">总MR数</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card merged-card"
                :class="{ active: mrStatusFilter === 'merged' }"
                @click="toggleMrStatusFilter('merged')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ mrMergedAll }}</div>
                  <div class="stat-label">已合并MR</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card unmerged-card"
                :class="{ active: mrStatusFilter === 'open' }"
                @click="toggleMrStatusFilter('open')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ mrUnmergedAll }}</div>
                  <div class="stat-label">未合并MR</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card error-card"
                :class="{ active: mrStatusFilter === 'error' }"
                @click="toggleMrStatusFilter('error')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ mrErrorAll }}</div>
                  <div class="stat-label">异常MR</div>
                </div>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card
                class="stat-card no-mr-card"
                :class="{ active: mrStatusFilter === 'no_mr' }"
                @click="toggleMrStatusFilter('no_mr')"
              >
                <div class="stat-content">
                  <div class="stat-number">{{ mrNoMrAll }}</div>
                  <div class="stat-label">无MR</div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>
        </div>

        <!-- 筛选器 -->
        <div class="filter-section">
          <n-space justify="space-between" align="center" wrap :size="8">
            <n-radio-group v-model:value="viewMode" size="small" @update:value="saveToLocalStorage">
              <n-radio-button value="flat">MR视图</n-radio-button>
              <n-radio-button value="grouped">TAPD单视图</n-radio-button>
            </n-radio-group>
            <n-space align="center" :size="8">
              <n-space v-if="viewMode === 'grouped'" align="center" :size="6">
                <n-button size="tiny" quaternary @click="expandOnlyNotAllMergedTapdItems">
                  只展开未全部合并
                </n-button>
                <n-button size="tiny" quaternary @click="expandAllTapdItems">
                  全部展开
                </n-button>
                <n-button size="tiny" quaternary @click="collapseAllTapdItems">
                  全部折叠
                </n-button>
              </n-space>
              <n-select
                v-model:value="itemStatusFilter"
                :options="itemStatusOptions"
                placeholder="选择TAPD状态"
                clearable
                style="width: 150px"
                @update:value="saveToLocalStorage"
              />
              <n-select
                v-model:value="mrStatusFilter"
                :options="mrStatusOptions"
                placeholder="选择MR实际状态"
                clearable
                style="width: 150px"
                @update:value="saveToLocalStorage"
              />
            </n-space>
          </n-space>
        </div>

        <!-- MR视图 -->
        <div v-if="viewMode === 'flat'" class="table-section">
          <n-data-table
            :columns="columns"
            :data="filteredRows"
            :pagination="false"
            :bordered="false"
            size="medium"
            table-layout="fixed"
            :scroll-x="mrTableScrollX"
            :row-class-name="() => 'compact-row'"
            :striped="true"
            class="mr-table"
            :on-unstable-column-resize="handleMrColumnResize"
            @update:sorter="handleTableSorterUpdate"
          />
        </div>

        <!-- TAPD单视图 -->
        <div v-else class="grouped-section">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="item-group"
            :class="{
              'item-group--all-merged': isItemAllMerged(item),
              'item-group--collapsed': !isTapdItemExpanded(item),
            }"
          >
            <div
              class="item-group-header item-group-header--collapsible"
              :class="`item-group-header--${item.type || 'other'}`"
              @click="onTapdHeaderClick(item, $event)"
            >
              <span
                class="item-group-expand-icon"
                :class="{ 'item-group-expand-icon--expanded': isTapdItemExpanded(item) }"
                aria-hidden="true"
              />
              <n-tag
                v-if="item.type === 'story'"
                type="info"
                size="tiny"
                class="item-group-type-tag"
              >
                需求
              </n-tag>
              <n-tag
                v-else-if="item.type === 'bug'"
                type="error"
                size="tiny"
                class="item-group-type-tag"
              >
                缺陷
              </n-tag>
              <n-tag v-else size="tiny" class="item-group-type-tag">
                {{ item.type }}
              </n-tag>
              <div class="item-group-title-wrap">
                <a
                  :href="normalizeUrl(item.url)"
                  target="_blank"
                  class="item-group-title"
                  :title="item.title"
                >
                  {{ item.title }}
                </a>
                <n-tag
                  v-if="item.status"
                  size="tiny"
                  bordered
                  class="item-group-status-tag tapd-status-tag tag-fixed-center"
                  :title="item.status"
                >
                  {{ item.status }}
                </n-tag>
                <n-tag
                  v-for="(part, labelIndex) in getItemLabelParts(item.label)"
                  :key="labelIndex"
                  size="tiny"
                  bordered
                  class="item-group-label-tag tag-fixed-center"
                  :title="part"
                >
                  {{ part }}
                </n-tag>
              </div>
              <span
                class="item-group-meta"
                :class="getItemMrMeta(item).class"
              >
                <span v-if="getItemMrMeta(item).icon" class="item-group-meta-icon">
                  {{ getItemMrMeta(item).icon }}
                </span>
                <span class="item-group-meta-text">{{ getItemMrMeta(item).text }}</span>
              </span>
            </div>
            <n-collapse-transition :show="isTapdItemExpanded(item)">
              <n-data-table
                :columns="mrColumns"
                :data="getItemMrRows(item)"
                :pagination="false"
                :bordered="true"
                size="medium"
                :row-class-name="() => 'compact-row'"
                :striped="true"
                class="mr-table item-group-table"
              />
            </n-collapse-transition>
          </div>
          <n-empty
            v-if="filteredItems.length === 0"
            description="当前筛选条件下暂无数据"
            class="grouped-empty"
          />
        </div>
      </div>

      <!-- 无数据提示 -->
      <div
        v-else-if="result && (!result.items || result.items.length === 0)"
        class="no-data"
      >
        <n-empty description="暂无数据" />
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, h, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createDiscreteApi, NTag, NTooltip, NIcon } from 'naive-ui';
import { Help } from '@vicons/tabler';
import { getTapdReleaseInfo } from './release-merge-check.service.js';

const route = useRoute();
const router = useRouter();

/** 地址栏参数名：分享用 TAPD 发布计划链接 */
const TAPD_RELEASE_URL_PARAM = 'tapd_release_url';

// 响应式数据
const releaseUrl = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);
const mrStatusFilter = ref('');
const itemStatusFilter = ref('');
const typeFilter = ref('');
const viewMode = ref('flat');
const lastRefreshTime = ref('');
const sortKey = ref('');
const sortOrder = ref('ascend');
const historyList = ref([]);
/** TAPD单视图：已折叠的 TAPD 单 id */
const collapsedTapdItemIds = ref(new Set());

// 表格高度计算
const tableHeight = computed(() => {
  // 视口高度减去其他元素的大概高度（输入区域、统计卡片、筛选器等）
  // 大约预留 300px 给其他元素
  return window.innerHeight - 300;
});

// 消息提示
const { message } = createDiscreteApi(['message']);

// 常量
const HISTORY_STORAGE_KEY = 'tapdReleaseHistory';
const FILTER_STORAGE_KEY = 'tapdReleaseFilterState';
const MR_COLUMN_WIDTH_STORAGE_KEY = 'tapdReleaseMrColumnWidths_v2';

const DEFAULT_MR_COLUMN_WIDTHS = {
  type: 46,
  title: 180,
  item_status: 88,
  item_label: 180,
  mr_url: 250,
  target_branch: 140,
  author: 88,
  merge_status: 116,
  mr_status: 88,
};

const loadMrColumnWidths = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(MR_COLUMN_WIDTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_MR_COLUMN_WIDTHS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load MR column widths:', e);
  }
  return { ...DEFAULT_MR_COLUMN_WIDTHS };
};

const mrColumnWidths = ref(loadMrColumnWidths());

// 在组件初始化时立即加载历史记录
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData);
        if (Array.isArray(parsed)) {
          historyList.value = parsed;
        }
      } catch (e) {
        console.error('Failed to parse history on init:', e);
      }
    }
    const filterData = localStorage.getItem(FILTER_STORAGE_KEY);
    if (filterData) {
      try {
        const parsed = JSON.parse(filterData);
        if (parsed.mrStatusFilter !== undefined) mrStatusFilter.value = parsed.mrStatusFilter;
        if (parsed.itemStatusFilter !== undefined) itemStatusFilter.value = parsed.itemStatusFilter;
        if (parsed.typeFilter !== undefined) typeFilter.value = parsed.typeFilter;
        if (parsed.viewMode === 'flat' || parsed.viewMode === 'grouped') {
          viewMode.value = parsed.viewMode;
        }
      } catch (e) {
        console.error('Failed to parse filter state on init:', e);
      }
    }
  } catch (e) {
    console.error('Failed to load history on init:', e);
  }
}

/**
 * 保存筛选状态到 localStorage
 */
const saveToLocalStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
        mrStatusFilter: mrStatusFilter.value,
        itemStatusFilter: itemStatusFilter.value,
        typeFilter: typeFilter.value,
        viewMode: viewMode.value,
      }));
    }
  } catch (e) {
    console.error('Failed to save filter state:', e);
  }
};

const mrStatusOptions = [
  { label: '全部', value: '' },
  { label: '已合并', value: 'merged' },
  { label: '未合并', value: 'open' },
  { label: '异常', value: 'error' },
  { label: '无MR', value: 'no_mr' },
];

const itemStatusOptions = computed(() => {
  if (!result.value?.items) return [{ label: '全部', value: '' }];
  const statuses = [...new Set(
    result.value.items
      .map(item => item.status)
      .filter(status => status != null && status !== '')
  )];
  return [
    { label: '全部', value: '' },
    ...statuses.sort((a, b) => a.localeCompare(b, 'zh-CN')).map(status => ({
      label: status,
      value: status,
    })),
  ];
});

const MERGE_STATUS_LABELS = {
  unchecked: '未检查',
  checking: '检查中',
  can_be_merged: '可合并',
  cannot_be_merged: '不可合并',
  cannot_be_merged_recheck: '不可合并(需重检)',
};

/** GitLab MR API merge_status 字段含义（参考 GitLab 9.4+） */
const MERGE_STATUS_DESCRIPTIONS = {
  unchecked: '该 MR 尚未进行可合并性检查',
  checking: '正在检查该 MR 是否可以合并',
  can_be_merged: '该 MR 可无冲突合并',
  cannot_be_merged: '源分支与目标分支存在合并冲突',
  cannot_be_merged_recheck: '当前尚未检查；在此前的变更中曾存在冲突',
};

const getMergeStatusTagType = (mergeStatus) => {
  if (mergeStatus === 'can_be_merged') return 'success';
  if (mergeStatus === 'cannot_be_merged' || mergeStatus === 'cannot_be_merged_recheck') return 'error';
  return 'default';
};

const isMergeStatusOutlineStyle = (mergeStatus) => (
  mergeStatus === 'unchecked' || mergeStatus === 'checking'
);

const renderMergeStatusColumnTitle = () => {
  const helpLines = Object.entries(MERGE_STATUS_LABELS).map(([key, label]) => (
    h('div', { class: 'merge-status-help-line' }, [
      h('span', { class: 'merge-status-help-label' }, `${label}`),
      h('span', { class: 'merge-status-help-key' }, `（${key}）`),
      `：${MERGE_STATUS_DESCRIPTIONS[key]}`,
    ])
  ));

  return h('span', { class: 'column-title-with-help' }, [
    '可合并状态',
    h(
      NTooltip,
      { trigger: 'hover', style: { maxWidth: '380px' } },
      {
        trigger: () => h(
          NIcon,
          {
            size: 14,
            class: 'column-title-help-icon',
          },
          { default: () => h(Help) }
        ),
        default: () => h('div', { class: 'merge-status-help' }, [
          h('div', { class: 'merge-status-help-title' }, 'GitLab MR API merge_status 说明'),
          ...helpLines,
        ]),
      }
    ),
  ]);
};

// 计算属性
const storyCount = computed(() => {
  if (!result.value || !result.value.items) return 0;
  return result.value.items.filter(i => i.type === 'story').length;
});

const bugCount = computed(() => {
  if (!result.value || !result.value.items) return 0;
  return result.value.items.filter(i => i.type === 'bug').length;
});

const mrTotalAll = computed(() => {
  if (!result.value || !result.value.items) return 0;
  return result.value.items.reduce(
    (sum, item) => sum + (item.mr_links ? item.mr_links.length : 0),
    0
  );
});

const mrMergedAll = computed(() => {
  if (!result.value || !result.value.items) return 0;
  let count = 0;
  result.value.items.forEach(item => {
    if (item.mr_links) {
      count += item.mr_links.filter(mr => mr.status === 'merged').length;
    }
  });
  return count;
});

const mrUnmergedAll = computed(() => {
  if (!result.value || !result.value.items) return 0;
  let count = 0;
  result.value.items.forEach(item => {
    if (item.mr_links) {
      count += item.mr_links.filter(mr => mr.status === 'open').length;
    }
  });
  return count;
});

const mrErrorAll = computed(() => {
  if (!result.value || !result.value.items) return 0;
  let count = 0;
  result.value.items.forEach(item => {
    if (item.mr_links) {
      count += item.mr_links.filter(mr => 
        mr.status === 'error' || mr.status === 'closed'
      ).length;
    }
  });
  return count;
});

const mrNoMrAll = computed(() => {
  if (!result.value || !result.value.items) return 0;
  return result.value.items.filter(
    item => !item.mr_links || item.mr_links.length === 0
  ).length;
});

const processedRows = computed(() => {
  if (!result.value || !result.value.items) return [];
  const rows = [];
  result.value.items.forEach(item => {
    if (item.mr_links && item.mr_links.length > 0) {
      item.mr_links.forEach(mr => {
        rows.push({
          type: item.type,
          title: item.title,
          url: item.url,
          itemStatus: item.status,
          itemLabel: item.label,
          mr,
          noMr: false,
        });
      });
    } else {
      rows.push({
        type: item.type,
        title: item.title,
        url: item.url,
        itemStatus: item.status,
        itemLabel: item.label,
        mr: null,
        noMr: true,
      });
    }
  });
  return rows;
});

const filteredRows = computed(() => {
  if (!processedRows.value) return [];
  let rows = processedRows.value;
  
  // 类型过滤
  if (typeFilter.value) {
    rows = rows.filter(row => row.type === typeFilter.value);
  }

  // TAPD状态过滤
  if (itemStatusFilter.value) {
    rows = rows.filter(row => row.itemStatus === itemStatusFilter.value);
  }
  
  // MR状态过滤
  if (mrStatusFilter.value) {
    if (mrStatusFilter.value === 'no_mr') {
      rows = rows.filter(row => row.noMr);
    } else {
      rows = rows.filter(row => {
        if (row.noMr) return false;
        return row.mr.status === mrStatusFilter.value;
      });
    }
  }
  
  // 默认排序：异常 > 无MR/未合并 > 已合并
  if (!sortKey.value) {
    rows = rows.slice().sort((a, b) => {
      const priorityA = getRowStatusPriority(a);
      const priorityB = getRowStatusPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const titleCmp = a.title.localeCompare(b.title);
      if (titleCmp !== 0) return titleCmp;
      const urlA = a.mr?.url || '';
      const urlB = b.mr?.url || '';
      return urlA.localeCompare(urlB);
    });
  }

  return rows;
});

const compareRowField = (a, b, getValue) => {
  const va = getValue(a);
  const vb = getValue(b);
  const sa = va === undefined || va === null ? '' : String(va);
  const sb = vb === undefined || vb === null ? '' : String(vb);
  return sa.localeCompare(sb, 'zh-CN');
};

/** Naive DataTable 通过 @update:sorter 通知受控排序 */
const handleTableSorterUpdate = (sortState) => {
  if (sortState == null) {
    sortKey.value = '';
    sortOrder.value = 'ascend';
    return;
  }
  const s = Array.isArray(sortState) ? sortState[0] : sortState;
  if (!s?.columnKey || s.order === false) {
    sortKey.value = '';
    sortOrder.value = 'ascend';
    return;
  }
  sortKey.value = s.columnKey;
  sortOrder.value = s.order;
};

const getColumnSortOrder = (key) => {
  return sortKey.value === key ? sortOrder.value : false;
};

const getMrColumnWidth = (key) => {
  return mrColumnWidths.value[key] ?? DEFAULT_MR_COLUMN_WIDTHS[key];
};

const mrTableScrollX = computed(() => {
  return Object.values(mrColumnWidths.value).reduce(
    (sum, width) => sum + (Number(width) || 0),
    0
  );
});

const saveMrColumnWidths = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        MR_COLUMN_WIDTH_STORAGE_KEY,
        JSON.stringify(mrColumnWidths.value)
      );
    }
  } catch (e) {
    console.error('Failed to save MR column widths:', e);
  }
};

const handleMrColumnResize = (resizedWidth, _limitedWidth, column) => {
  const key = column?.key;
  if (key == null || key === '') return;
  mrColumnWidths.value = {
    ...mrColumnWidths.value,
    [key]: Math.round(resizedWidth),
  };
  saveMrColumnWidths();
};

const mrResizableColumn = (key, minWidth = 40) => ({
  width: getMrColumnWidth(key),
  minWidth,
  resizable: true,
});

const normalizeUrl = (url) => {
  if (!url) return '#';
  return url.startsWith('@') ? url.slice(1) : url;
};

const renderTitleCell = (row) => {
  return h(NTooltip, { trigger: 'hover', keepAliveOnHover: false }, {
    trigger: () => h('div', { class: 'cell-link-wrap' }, [
      h(
        'a',
        {
          href: normalizeUrl(row.url),
          target: '_blank',
          class: 'title-link',
        },
        row.title
      ),
    ]),
    default: () => row.title,
  });
};

const renderMrUrlCell = (row) => {
  if (row.noMr) return '';
  const url = row.mr.url;
  return h(NTooltip, { trigger: 'hover', keepAliveOnHover: false, style: { maxWidth: '640px' } }, {
    trigger: () => h('div', { class: 'cell-link-wrap cell-link-wrap--mr' }, [
      h(
        'a',
        {
          href: url,
          target: '_blank',
          class: 'mr-link',
        },
        [h('span', { class: 'mr-link-text' }, url)]
      ),
    ]),
    default: () => url,
  });
};

const getMrStatusPriority = (status) => {
  if (status === 'error' || status === 'closed') return 1;
  if (status === 'open') return 2;
  if (status === 'merged') return 3;
  return 4;
};

const getRowStatusPriority = (row) => {
  if (row.mr && (row.mr.status === 'error' || row.mr.status === 'closed')) return 1;
  if (row.noMr) return 2;
  if (row.mr && row.mr.status === 'open') return 2;
  if (row.mr && row.mr.status === 'merged') return 3;
  return 4;
};

const sortMrRows = (rows) => {
  return rows.slice().sort((a, b) => {
    const priorityA = getRowStatusPriority(a);
    const priorityB = getRowStatusPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const urlA = a.mr?.url || '';
    const urlB = b.mr?.url || '';
    return urlA.localeCompare(urlB);
  });
};

const itemMatchesFilters = (item) => {
  if (typeFilter.value && item.type !== typeFilter.value) {
    return false;
  }
  if (itemStatusFilter.value && item.status !== itemStatusFilter.value) {
    return false;
  }
  if (!mrStatusFilter.value) {
    return true;
  }
  if (mrStatusFilter.value === 'no_mr') {
    return !item.mr_links || item.mr_links.length === 0;
  }
  return item.mr_links?.some(mr => mr.status === mrStatusFilter.value);
};

const getItemPriority = (item) => {
  if (!item.mr_links || item.mr_links.length === 0) return 2;
  let min = 4;
  item.mr_links.forEach(mr => {
    min = Math.min(min, getMrStatusPriority(mr.status));
  });
  return min;
};

/** 有 MR 且全部已合并 */
const isItemAllMerged = (item) => {
  const links = item.mr_links;
  if (!links || links.length === 0) return false;
  return links.every(mr => mr.status === 'merged');
};

const initTapdCollapseState = () => {
  if (!result.value?.items) {
    collapsedTapdItemIds.value = new Set();
    return;
  }
  expandOnlyNotAllMergedTapdItems();
};

const isTapdItemExpanded = (item) => {
  return !collapsedTapdItemIds.value.has(item.id);
};

const toggleTapdItemExpand = (item) => {
  const next = new Set(collapsedTapdItemIds.value);
  if (next.has(item.id)) {
    next.delete(item.id);
  } else {
    next.add(item.id);
  }
  collapsedTapdItemIds.value = next;
};

const expandAllTapdItems = () => {
  collapsedTapdItemIds.value = new Set();
};

/** 仅展开未全部合并的单子，全部已合并的折叠 */
const expandOnlyNotAllMergedTapdItems = () => {
  const collapsed = new Set();
  filteredItems.value.forEach(item => {
    if (isItemAllMerged(item)) {
      collapsed.add(item.id);
    }
  });
  collapsedTapdItemIds.value = collapsed;
};

const collapseAllTapdItems = () => {
  collapsedTapdItemIds.value = new Set(
    filteredItems.value.map(item => item.id)
  );
};

const onTapdHeaderClick = (item, event) => {
  if (event.target.closest('a')) return;
  toggleTapdItemExpand(item);
};

const filteredItems = computed(() => {
  if (!result.value?.items) return [];
  let items = result.value.items.filter(itemMatchesFilters);
  items = items.slice().sort((a, b) => {
    const allMergedA = isItemAllMerged(a);
    const allMergedB = isItemAllMerged(b);
    if (allMergedA !== allMergedB) {
      return allMergedA ? 1 : -1;
    }
    const priorityA = getItemPriority(a);
    const priorityB = getItemPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.title.localeCompare(b.title);
  });
  return items;
});

const getItemMrRows = (item) => {
  let rows = [];
  if (item.mr_links && item.mr_links.length > 0) {
    rows = item.mr_links.map(mr => ({ mr, noMr: false }));
  } else {
    rows = [{ mr: null, noMr: true }];
  }
  if (mrStatusFilter.value && mrStatusFilter.value !== 'no_mr') {
    rows = rows.filter(row => !row.noMr && row.mr.status === mrStatusFilter.value);
  }
  return sortMrRows(rows);
};

const getItemMrMeta = (item) => {
  const links = item.mr_links || [];
  if (links.length === 0) {
    return { icon: '', text: '无 MR', class: 'item-group-meta--empty' };
  }

  const merged = links.filter(mr => mr.status === 'merged').length;
  const open = links.filter(mr => mr.status === 'open').length;
  const abnormal = links.filter(mr =>
    mr.status === 'error' || mr.status === 'closed'
  ).length;

  const parts = [`共 ${links.length} 个 MR`];
  if (merged) parts.push(`已合并 ${merged}`);
  if (open) parts.push(`未合并 ${open}`);
  if (abnormal) parts.push(`异常 ${abnormal}`);
  const text = parts.join(' · ');

  if (abnormal > 0) {
    return { icon: '⚠️', text, class: 'item-group-meta--warning' };
  }
  if (open > 0) {
    return { icon: '❌', text, class: 'item-group-meta--error' };
  }
  if (merged === links.length) {
    return { icon: '✅', text, class: 'item-group-meta--success' };
  }

  return { icon: '⚠️', text, class: 'item-group-meta--warning' };
};

const renderFixedCenterTag = (label, options = {}) => {
  const { type, class: extraClass = '', title = label } = options;
  return h(
    NTag,
    {
      type,
      size: 'small',
      class: `tag-fixed-center ${extraClass}`.trim(),
      title,
    },
    { default: () => label }
  );
};

const getItemLabelParts = (label) => {
  if (!label) return [];
  return String(label)
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);
};

const renderItemLabelCell = (row) => {
  const parts = getItemLabelParts(row.itemLabel);
  if (parts.length === 0) return '-';
  return h(
    'div',
    { class: 'item-label-tags' },
    parts.map((part, index) =>
      h(
        NTag,
        {
          key: index,
          size: 'small',
          bordered: true,
          class: 'item-label-tag',
          title: part,
        },
        { default: () => part }
      )
    )
  );
};

const renderItemStatusTag = (status) => {
  return h(
    NTag,
    {
      size: 'small',
      bordered: true,
      class: 'tag-fixed-center tapd-status-tag',
      title: status,
    },
    { default: () => status }
  );
};

const renderMergeStatusCell = (row) => {
  if (row.noMr || !row.mr?.merge_status) {
    return '';
  }
  const mergeStatus = row.mr.merge_status;
  const label = MERGE_STATUS_LABELS[mergeStatus] || mergeStatus;
  const description = MERGE_STATUS_DESCRIPTIONS[mergeStatus] || mergeStatus;
  const isOutlineStyle = isMergeStatusOutlineStyle(mergeStatus);
  const tag = h(
    NTag,
    {
      ...(isOutlineStyle
        ? { bordered: true, class: 'merge-status-tag merge-status-tag--outline' }
        : { type: getMergeStatusTagType(mergeStatus), class: 'merge-status-tag' }),
      size: 'small',
    },
    { default: () => label }
  );
  return h(NTooltip, { trigger: 'hover' }, {
    trigger: () => tag,
    default: () => description,
  });
};

const renderMrStatusCell = (row) => {
  if (!row.noMr) {
    if (row.mr.status === 'error') {
      return renderFixedCenterTag('异常', { type: 'warning', class: 'mr-status-tag' });
    }
    if (row.mr.status === 'merged') {
      return renderFixedCenterTag('已合并', { type: 'success', class: 'mr-status-tag' });
    }
    if (row.mr.status === 'open') {
      return renderFixedCenterTag('未合并', { type: 'error', class: 'mr-status-tag' });
    }
    if (row.mr.status === 'closed') {
      return renderFixedCenterTag('已关闭', { type: 'warning', class: 'mr-status-tag' });
    }
    return renderFixedCenterTag(row.mr.status, { type: 'default', class: 'mr-status-tag' });
  }
  return renderFixedCenterTag('无MR', { type: 'default', class: 'mr-status-tag' });
};

// 分组视图：仅 MR 相关列
const mrColumns = computed(() => [
  {
    title: 'MR链接',
    key: 'mr_url',
    minWidth: 280,
    render: renderMrUrlCell,
  },
  {
    title: '目标分支',
    key: 'target_branch',
    width: 140,
    render: (row) => {
      if (!row.noMr) {
        return row.mr.target_branch || '-';
      }
      return '';
    },
  },
  {
    title: '提交人',
    key: 'author',
    width: 88,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.noMr) {
        return row.mr.author || '-';
      }
      return '';
    },
  },
  {
    title: renderMergeStatusColumnTitle,
    key: 'merge_status',
    width: 116,
    align: 'center',
    render: renderMergeStatusCell,
  },
  {
    title: 'MR实际状态',
    key: 'mr_status',
    width: 76,
    align: 'center',
    render: renderMrStatusCell,
  },
]);

// 表格列定义
const columns = computed(() => [
  {
    title: '类型',
    key: 'type',
    fixed: 'left',
    ...mrResizableColumn('type', 40),
    align: 'center',
    render: (row) => {
      if (row.type === 'story') {
        return renderFixedCenterTag('需求', { type: 'info', class: 'type-tag' });
      } else if (row.type === 'bug') {
        return renderFixedCenterTag('缺陷', { type: 'error', class: 'type-tag' });
      }
      return renderFixedCenterTag(row.type, { type: 'default', class: 'type-tag' });
    },
    sorter: (a, b) => compareRowField(a, b, r => r.type),
    sortOrder: getColumnSortOrder('type'),
  },
  {
    title: '标题',
    key: 'title',
    fixed: 'left',
    ...mrResizableColumn('title', 100),
    render: renderTitleCell,
    sorter: (a, b) => compareRowField(a, b, r => r.title),
    sortOrder: getColumnSortOrder('title'),
  },
  {
    title: '状态',
    key: 'item_status',
    fixed: 'left',
    ...mrResizableColumn('item_status', 60),
    align: 'center',
    render: (row) => {
      if (!row.itemStatus) return '-';
      return renderItemStatusTag(row.itemStatus);
    },
    sorter: (a, b) => compareRowField(a, b, r => r.itemStatus),
    sortOrder: getColumnSortOrder('item_status'),
  },
  {
    title: '标签',
    key: 'item_label',
    ...mrResizableColumn('item_label', 60),
    render: renderItemLabelCell,
    sorter: (a, b) => compareRowField(a, b, r => r.itemLabel),
    sortOrder: getColumnSortOrder('item_label'),
  },
  {
    title: 'MR链接',
    key: 'mr_url',
    fixed: 'left',
    ...mrResizableColumn('mr_url', 120),
    render: renderMrUrlCell,
    sorter: (a, b) => compareRowField(a, b, r => r.mr?.url),
    sortOrder: getColumnSortOrder('mr_url'),
  },
  {
    title: '目标分支',
    key: 'target_branch',
    ...mrResizableColumn('target_branch', 100),
    render: (row) => {
      if (!row.noMr) {
        return row.mr.target_branch || '-';
      }
      return '';
    },
    sorter: (a, b) => compareRowField(a, b, r => r.mr?.target_branch),
    sortOrder: getColumnSortOrder('target_branch'),
  },
  {
    title: '提交人',
    key: 'author',
    ...mrResizableColumn('author', 64),
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.noMr) {
        return row.mr.author || '-';
      }
      return '';
    },
    sorter: (a, b) => compareRowField(a, b, r => r.mr?.author),
    sortOrder: getColumnSortOrder('author'),
  },
  {
    title: renderMergeStatusColumnTitle,
    key: 'merge_status',
    ...mrResizableColumn('merge_status', 80),
    align: 'center',
    render: renderMergeStatusCell,
    sorter: (a, b) => compareRowField(a, b, r => r.mr?.merge_status),
    sortOrder: getColumnSortOrder('merge_status'),
  },
  {
    title: 'MR实际状态',
    key: 'mr_status',
    ...mrResizableColumn('mr_status', 72),
    align: 'center',
    render: renderMrStatusCell,
    sorter: (a, b) => compareRowField(a, b, r => r.mr?.status),
    sortOrder: getColumnSortOrder('mr_status'),
  },
]);

// 方法
const fetchReport = async () => {
  if (!releaseUrl.value) {
    error.value = '请输入TAPD发布计划链接';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await getTapdReleaseInfo({ tapd_release_url: releaseUrl.value });
    if (response.code !== 0) {
      error.value = response.msg || '接口调用失败';
      return;
    }
    
    result.value = response.data;
    initTapdCollapseState();
    lastRefreshTime.value = new Date().toLocaleString();
    // 确保历史记录保存成功
    try {
      saveToHistory();
    } catch (e) {
      console.error('Failed to save history in fetchReport:', e);
    }
    // 将 tapd_release_url 写入地址栏，便于分享链接
    try {
      await router.replace({
        path: route.path,
        query: { ...route.query, [TAPD_RELEASE_URL_PARAM]: releaseUrl.value },
      });
    } catch (e) {
      console.error('Failed to update URL:', e);
    }
    message.success('统计完成');
  } catch (err) {
    error.value = `请求失败: ${err}`;
    message.error('请求失败');
  } finally {
    loading.value = false;
  }
};

const setMrStatusFilter = (status) => {
  mrStatusFilter.value = status;
  saveToLocalStorage();
};

const toggleTypeFilter = (type) => {
  if (typeFilter.value === type) {
    typeFilter.value = '';
  } else {
    typeFilter.value = type;
  }
  saveToLocalStorage();
};

const clearAllFilters = () => {
  mrStatusFilter.value = '';
  itemStatusFilter.value = '';
  typeFilter.value = '';
  saveToLocalStorage();
};



const toggleMrStatusFilter = (status) => {
  if (mrStatusFilter.value === status) {
    mrStatusFilter.value = '';
  } else {
    mrStatusFilter.value = status;
  }
  saveToLocalStorage();
};


/**
 * 保存到历史记录
 */
const saveToHistory = () => {
  if (!result.value || !result.value.release_info) {
    console.warn('Cannot save history: result or release_info is missing');
    return;
  }
  
  const releaseName = result.value.release_info.name || '';
  const releaseUrlValue = releaseUrl.value;
  
  if (!releaseName || !releaseUrlValue) {
    console.warn('Cannot save history: releaseName or releaseUrlValue is empty');
    return;
  }
  
  // 读取现有历史记录
  const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
  let history = [];
  
  if (historyData) {
    try {
      const parsed = JSON.parse(historyData);
      history = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse history data:', e);
      history = [];
    }
  }
  
  // 检查是否已存在，如果存在则移除
  history = history.filter(item => item.url !== releaseUrlValue);
  
  // 添加到开头
  history.unshift({
    name: releaseName,
    url: releaseUrlValue,
    time: new Date().toISOString(),
  });
  
  // 限制历史记录数量，最多保存20条
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  
  // 保存到localStorage
  try {
    const historyJson = JSON.stringify(history);
    // console.log('Saving history, key:', HISTORY_STORAGE_KEY, 'data:', historyJson);
    localStorage.setItem(HISTORY_STORAGE_KEY, historyJson);
    // 验证保存是否成功
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved === historyJson) {
      historyList.value = history;
      // console.log('History saved successfully:', history.length, 'items');
    } else {
      console.error('History save verification failed');
      historyList.value = history;
    }
  } catch (e) {
    console.error('Failed to save history:', e);
    // 如果保存失败，至少更新当前显示
    historyList.value = history;
  }
};

/**
 * 加载历史记录
 */
const loadHistory = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return;
    }
    
    const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
    // console.log('Loading history, key:', HISTORY_STORAGE_KEY, 'exists:', !!historyData);
    
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData);
        if (Array.isArray(parsed)) {
          historyList.value = parsed;
          // console.log('History loaded successfully:', historyList.value.length, 'items', historyList.value);
        } else {
          console.log('History data is not an array, resetting');
          historyList.value = [];
        }
      } catch (e) {
        console.error('Failed to parse history data:', e, 'raw data:', historyData);
        historyList.value = [];
      }
    } else {
      // console.log('No history data found in localStorage');
      historyList.value = [];
    }
  } catch (e) {
    console.error('Failed to load history:', e);
    historyList.value = [];
  }
};

/**
 * 选择历史记录
 * @param {string} url - 发布计划链接
 */
const selectHistory = (url) => {
  releaseUrl.value = url;
};

/**
 * 删除历史记录
 * @param {number} index - 历史记录索引
 */
const deleteHistory = (index) => {
  historyList.value.splice(index, 1);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList.value));
  } catch (e) {
    console.error('Failed to save history after delete:', e);
  }
};

/**
 * 清空当前数据
 */
const clearData = () => {
  releaseUrl.value = '';
  result.value = null;
  error.value = '';
  lastRefreshTime.value = '';
  mrStatusFilter.value = '';
  itemStatusFilter.value = '';
  typeFilter.value = '';
  sortKey.value = '';
  sortOrder.value = 'ascend';
  collapsedTapdItemIds.value = new Set();
  // 移除地址栏中的分享参数
  try {
    const query = { ...route.query };
    delete query[TAPD_RELEASE_URL_PARAM];
    router.replace({ path: route.path, query });
  } catch (e) {
    console.error('Failed to clear URL param:', e);
  }
  message.success('已清空数据');
};

/**
 * 从地址栏 query 中取出 tapd_release_url（支持字符串或数组）
 */
function getTapdUrlFromQuery() {
  const raw = route.query[TAPD_RELEASE_URL_PARAM];
  if (raw == null) return '';
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (typeof str !== 'string') return '';
  try {
    return decodeURIComponent(str).trim();
  } catch {
    return str.trim();
  }
}

watch(viewMode, (mode) => {
  if (mode === 'grouped' && result.value?.items) {
    expandOnlyNotAllMergedTapdItems();
  }
});

// 打开带 tapd_release_url 的分享链接时，填充输入框并自动检查
watch(
  () => route.query[TAPD_RELEASE_URL_PARAM],
  () => {
    const url = getTapdUrlFromQuery();
    if (!url) return;
    // 避免与当前已加载的 URL 重复请求
    if (releaseUrl.value === url && result.value) return;
    releaseUrl.value = url;
    nextTick(() => {
      fetchReport();
    });
  },
  { immediate: true }
);

</script>

<style lang="less" scoped>
.release-merge-check {
  width: 100% !important;
  max-width: 100% !important;
  flex: 1 1 100% !important;
  margin: 0;
  padding: 2px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;

  :deep(.n-card) {
    padding: 10px;
    box-sizing: border-box;
  }
}

.search-card {
  flex-shrink: 0;
}

.content-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.n-card__content) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding-top: 8px;
  }
}

.input-section {
  margin-bottom: 0;
}

.history-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.history-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }
}

.empty-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.release-url-input {
  flex: 1;
  min-width: 0;
}

.button-group {
  display: flex;
  align-items: center;
}

.fetch-button {
  border-radius: 6px;
}

.last-refresh-time {
  color: #666;
  font-size: 0.85em;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 40px 0;
  color: #1677ff;
}

.loading-text {
  font-size: 1em;
}

.error {
  margin: 12px 0;
}

.result-section {
  margin-top: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.release-info {
  margin-bottom: 8px;
}

.section-title {
  font-size: 1em;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #222;
}

.release-details {
  background: #f4f7fb;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.9em;
  color: #444;
  text-align: center;
}

.stat-cards {
  margin-bottom: 8px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  
  :deep(.n-card__content) {
    padding: 0 2px;
    width: 100%;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.1);
  }
  
  &.active {
    outline: 2px solid #1677ff;
    background: #e6f7ff;
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  width: 100%;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #595959;
  line-height: 1;
  white-space: nowrap;
}

.story-card {
  .stat-number {
    color: #1677ff;
  }
}

.bug-card {
  .stat-number {
    color: #e74c3c;
  }
}

.total-card {
  .stat-number {
    color: #1677ff;
  }
}

.merged-card {
  .stat-number {
    color: #389e0d;
  }
}

.unmerged-card {
  .stat-number {
    color: #e74c3c;
  }
}

.error-card {
  .stat-number {
    color: #d48806;
  }
}

.no-mr-card {
  .stat-number {
    color: #888;
  }
}

.filter-section {
  margin-bottom: 8px;
}

.grouped-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.item-group {
  border: 1px solid #e8ecf0;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;

  &--collapsed {
    .item-group-header {
      border-bottom: none;
    }
  }

  &--all-merged.item-group--collapsed {
    border-color: #e6f4ea;
  }
}

.item-group-expand-icon {
  flex-shrink: 0;
  width: 0;
  height: 0;
  margin-right: -2px;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid #8c8c8c;
  transition: transform 0.2s ease;

  &--expanded {
    transform: rotate(90deg);
  }
}

.item-group-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-height: 22px;
  padding: 2px 6px 2px 8px;
  border-bottom: 1px solid #e8ecf0;
  border-left: 3px solid #d9d9d9;
  background: #f8fafc;
  min-width: 0;

  &--story,
  &--bug,
  &--other {
    border-left-color: #d9d9d9;
    background: #f8fafc;
  }

  &--collapsible {
    cursor: pointer;
    user-select: none;

    &:hover {
      filter: brightness(0.98);
    }
  }
}

.item-group-type-tag {
  flex-shrink: 0;
  transform: scale(0.82);
  transform-origin: left center;
}

.item-group-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
}

.tag-fixed-center,
:deep(.n-tag.tag-fixed-center) {
  display: inline-flex !important;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  padding-left: 0 !important;
  padding-right: 0 !important;

  :deep(.n-tag__content) {
    display: block;
    width: 100%;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.tapd-status-tag,
:deep(.n-tag.tapd-status-tag) {
  max-width: 80px;
  min-width: 0;
  background-color: #fff !important;
  color: #1677ff !important;
  border: 1px solid #1677ff !important;
  border-radius: 9999px !important;
  padding: 0 8px !important;
  font-weight: 400;
}

.item-label-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.item-label-tag,
:deep(.n-tag.item-label-tag) {
  max-width: 120px;
  background-color: #fff !important;
  color: #722ed1 !important;
  border: 1px solid #d3adf7 !important;
  font-weight: 400;
  font-size: 11px !important;
  height: 20px !important;
  line-height: 18px !important;
}

.merge-status-tag,
:deep(.n-tag.merge-status-tag) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.merge-status-tag--outline,
:deep(.n-tag.merge-status-tag--outline) {
  background-color: #fff !important;
  color: #595959 !important;
  border: 1px solid #d9d9d9 !important;
}

.column-title-with-help {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

.column-title-help-icon {
  cursor: help;
  color: #999;
  flex-shrink: 0;
}

.merge-status-help-title {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 12px;
}

.merge-status-help-line {
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.45;
}

.merge-status-help-label {
  font-weight: 500;
}

.merge-status-help-key {
  color: #8c8c8c;
  font-size: 11px;
}

.mr-status-tag,
:deep(.n-tag.mr-status-tag) {
  width: 56px;
}

.type-tag,
:deep(.n-tag.type-tag) {
  width: 40px;
}

.item-group-status-tag {
  flex-shrink: 0;
  transform: scale(0.82);
  transform-origin: left center;
}

.item-group-label-tag {
  flex-shrink: 0;
  transform: scale(0.75);
  transform-origin: left center;
  background-color: #fff !important;
  color: #722ed1 !important;
  border: 1px solid #d3adf7 !important;
  font-weight: 400;
}

.item-group-title {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.15;
  color: #262626;
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: #1677ff;
    text-decoration: underline;
  }
}

.item-group-meta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  max-width: 48%;
  overflow: hidden;
  font-size: 10px;
  line-height: 1.15;
  color: #8c8c8c;

  &--success {
    color: #389e0d;

    .item-group-meta-text {
      color: #52c41a;
    }
  }

  &--error {
    color: #cf1322;

    .item-group-meta-text {
      color: #ff4d4f;
    }
  }

  &--warning {
    color: #d48806;

    .item-group-meta-text {
      color: #faad14;
    }
  }

  &--empty {
    color: #bfbfbf;
  }
}

.item-group-meta-icon {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
}

.item-group-meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-group-table {
  :deep(.n-data-table-th) {
    background: #fafbfc;
    white-space: nowrap;
  }
}

.grouped-empty {
  padding: 40px 0;
}

.table-section {
  display: flex;
  flex-direction: column;
  min-width: 0;

  :deep(.n-data-table) {
    .n-data-table-base-table {
      border-radius: 6px;
    }
  }
}

.mr-table {
  :deep(.n-data-table-th) {
    background: #f6f8fa;
    color: #333;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.35;
    padding: 6px 8px;
    white-space: nowrap;
    
    &:hover {
      background: #e6f7ff;
    }
  }
  
  :deep(.n-data-table-td) {
    padding: 6px 8px;
    font-size: 13px;
    line-height: 1.35;
    overflow: hidden;
    
    // 确保标题和MR链接列不换行
    &:nth-child(2),
    &:nth-child(4) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  :deep(.n-data-table-tr:hover > .n-data-table-td) {
    background: #e6f4ff !important;
  }
  
  :deep(.compact-row) {
    height: 32px;
  }
  
  :deep(.n-tag) {
    font-size: 12px;
    padding: 0 6px;
    height: 22px;
    line-height: 20px;
  }
  
  // 确保tag颜色正确显示 - 使用多种选择器确保匹配
  :deep(.n-tag[type="error"]),
  :deep(.n-tag.n-tag--error-type),
  :deep(.n-tag--error-type) {
    background-color: #ff4d4f !important;
    color: #fff !important;
    border-color: #ff4d4f !important;
  }
  
  :deep(.n-tag[type="success"]),
  :deep(.n-tag.n-tag--success-type),
  :deep(.n-tag--success-type) {
    background-color: #52c41a !important;
    color: #fff !important;
    border-color: #52c41a !important;
  }
  
  :deep(.n-tag[type="warning"]),
  :deep(.n-tag.n-tag--warning-type),
  :deep(.n-tag--warning-type) {
    background-color: #faad14 !important;
    color: #fff !important;
    border-color: #faad14 !important;
  }
  
  :deep(.n-tag[type="info"]),
  :deep(.n-tag.n-tag--info-type),
  :deep(.n-tag--info-type) {
    background-color: #1677ff !important;
    color: #fff !important;
    border-color: #1677ff !important;
  }
  
  :deep(.n-tag[type="default"]),
  :deep(.n-tag.n-tag--default-type),
  :deep(.n-tag--default-type) {
    background-color: #d9d9d9 !important;
    color: #666 !important;
    border-color: #d9d9d9 !important;
  }

  :deep(.n-tag.tag-fixed-center) {
    display: inline-flex !important;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    overflow: hidden;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  :deep(.n-tag.tag-fixed-center .n-tag__content) {
    display: block;
    width: 100%;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.n-tag.tapd-status-tag),
  :deep(.n-tag--default-type.tapd-status-tag) {
    max-width: 80px;
    min-width: 0;
    background-color: #fff !important;
    color: #1677ff !important;
    border: 1px solid #1677ff !important;
    border-radius: 9999px !important;
    padding: 0 8px !important;
    font-weight: 400;
  }

  :deep(.n-tag.merge-status-tag) {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  :deep(.n-tag.merge-status-tag--outline) {
    background-color: #fff !important;
    color: #595959 !important;
    border: 1px solid #d9d9d9 !important;
  }

  :deep(.n-tag.mr-status-tag) {
    width: 56px;
  }

  :deep(.n-tag.type-tag) {
    width: 40px;
  }
  
  :deep(.n-data-table-tr:nth-child(even) > .n-data-table-td) {
    background: #fafbfc;
  }
  
  :deep(.n-data-table-tr:nth-child(even):hover > .n-data-table-td) {
    background: #e6f4ff !important;
  }

  // 固定列背景，避免横向滚动时透出下层内容
  :deep(.n-data-table-td--fixed-left) {
    background: #fff;
  }

  :deep(.n-data-table-th--fixed-left) {
    background: #f6f8fa;
  }

  :deep(.n-data-table-tr:nth-child(even) > .n-data-table-td--fixed-left) {
    background: #fafbfc;
  }

  :deep(.n-data-table-tr:hover > .n-data-table-td--fixed-left) {
    background: #e6f4ff !important;
  }

  :deep(.cell-link-wrap) {
    max-width: 100%;
    overflow: hidden;
  }

  :deep(.title-link),
  :deep(.mr-link),
  :deep(a.title-link),
  :deep(a.mr-link) {
    color: #1677ff !important;
    text-decoration: none !important;
    text-decoration-line: none !important;
    font-size: 13px;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    vertical-align: bottom;
    box-shadow: none !important;
    border-bottom: none !important;
    background-image: none !important;

    &:hover,
    &:focus,
    &:visited,
    &:active {
      color: #1456c2 !important;
      text-decoration: none !important;
      text-decoration-line: none !important;
    }
  }

  :deep(.title-link) {
    display: block;
    text-overflow: ellipsis;
  }

  // MR 链接左侧省略，优先展示 URL 末尾
  :deep(.mr-link) {
    display: block;
    direction: rtl;
    text-align: left;
    text-overflow: ellipsis;
  }

  :deep(.mr-link-text) {
    direction: ltr;
    unicode-bidi: bidi-override;
  }
}

.no-data {
  margin: 16px 0;
  text-align: center;
}

@media (max-width: 900px) {
  .release-merge-check {
    padding: 6px;
  }
  
  .input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .button-group {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .stat-cards {
    :deep(.n-grid) {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 6px !important;
    }
  }
  
  .stat-card {
    :deep(.n-card__content) {
      padding: 0 2px;
    }
  }
  
  .stat-number {
    font-size: 26px;
  }
  
  .stat-label {
    font-size: 12px;
  }
}
</style>

<style lang="less">
/* 非 scoped：覆盖浏览器默认 a 下划线 */
.release-merge-check .mr-table a.title-link,
.release-merge-check .mr-table a.mr-link,
.release-merge-check .mr-table a.title-link:hover,
.release-merge-check .mr-table a.mr-link:hover,
.release-merge-check .mr-table a.title-link:visited,
.release-merge-check .mr-table a.mr-link:visited,
.release-merge-check .mr-table a.title-link:active,
.release-merge-check .mr-table a.mr-link:active,
.release-merge-check .mr-table a.title-link:focus,
.release-merge-check .mr-table a.mr-link:focus {
  text-decoration: none !important;
  text-decoration-line: none !important;
  border-bottom: none !important;
}
</style>