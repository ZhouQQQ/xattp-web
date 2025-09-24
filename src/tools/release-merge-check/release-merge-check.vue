<template>
  <div class="release-merge-check">
    <n-card>
      <!-- 输入区域 -->
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
                MR检查
              </n-button>
            </div>
          <span v-if="lastRefreshTime" class="last-refresh-time">
            上次：{{ lastRefreshTime }}
          </span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="medium" />
        <span class="loading-text">正在检查MR，请稍候...</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error">
        <n-alert type="error" :title="error" />
      </div>

      <!-- 结果展示 -->
      <div v-if="result && result.items && result.items.length > 0" class="result-section">
        <!-- 发布计划信息 -->
        <div class="release-info">
          <h3 class="section-title">发布计划</h3>
          <div v-if="result.release_info" class="release-details">
            <n-space>
              <span>
                <n-text strong>ID：</n-text>
                <c-link :href="releaseUrl" target="_blank">
                  {{ result.release_info.id }}
                </c-link>
              </span>
              <span>
                <n-text strong>名称：</n-text>
                <c-link :href="releaseUrl" target="_blank">
                  {{ result.release_info.name }}
                </c-link>
              </span>
            </n-space>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stat-cards">
          <n-grid :cols="7" :x-gap="12" :y-gap="12">
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
          <n-space justify="end">
            <n-select
              v-model:value="mrStatusFilter"
              :options="mrStatusOptions"
              placeholder="选择MR状态"
              style="width: 150px"
            />
          </n-space>
        </div>

        <!-- 数据表格 -->
        <div class="table-section">
          <n-data-table
            :columns="columns"
            :data="filteredRows"
            :pagination="false"
            :bordered="false"
            size="small"
            :row-class-name="() => 'compact-row'"
            :max-height="500"
            :striped="true"
            class="mr-table"
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
import { ref, computed, onMounted, h } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import { getTapdReleaseInfo } from './release-merge-check.service.js';

// 响应式数据
const releaseUrl = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);
const mrStatusFilter = ref('');
const typeFilter = ref('');
const lastRefreshTime = ref('');
const sortKey = ref('');
const sortOrder = ref('asc');

// 消息提示
const { message } = createDiscreteApi(['message']);

// 常量
const STORAGE_KEY = 'tapdReleaseReport';

const mrStatusOptions = [
  { label: '全部', value: '' },
  { label: '已合并', value: 'merged' },
  { label: '未合并', value: 'open' },
  { label: '异常', value: 'error' },
  { label: '无MR', value: 'no_mr' },
];

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
          mr,
          noMr: false,
        });
      });
    } else {
      rows.push({
        type: item.type,
        title: item.title,
        url: item.url,
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
  rows = rows.slice().sort((a, b) => {
    const getStatusPriority = (row) => {
      if (row.mr && (row.mr.status === 'error' || row.mr.status === 'closed')) return 1;
      if (row.noMr) return 2;
      if (row.mr && row.mr.status === 'open') return 2;
      if (row.mr && row.mr.status === 'merged') return 3;
      return 4;
    };
    const priorityA = getStatusPriority(a);
    const priorityB = getStatusPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.title.localeCompare(b.title);
  });
  
  // 支持表格点击排序
  if (sortKey.value) {
    rows = rows.slice().sort((a, b) => {
      let va, vb;
      switch (sortKey.value) {
        case 'type':
          va = a.type;
          vb = b.type;
          break;
        case 'title':
          va = a.title;
          vb = b.title;
          break;
        case 'mr_url':
          va = a.mr ? a.mr.url : '';
          vb = b.mr ? b.mr.url : '';
          break;
        case 'target_branch':
          va = a.mr ? a.mr.target_branch : '';
          vb = b.mr ? b.mr.target_branch : '';
          break;
        case 'mr_status':
          va = a.mr ? a.mr.status : '';
          vb = b.mr ? b.mr.status : '';
          break;
        default:
          va = '';
          vb = '';
      }
      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';
      if (sortOrder.value === 'asc') {
        return va > vb ? 1 : va < vb ? -1 : 0;
      } else {
        return va < vb ? 1 : va > vb ? -1 : 0;
      }
    });
  }
  return rows;
});

// 表格列定义
const columns = computed(() => [
  {
    title: '类型',
    key: 'type',
    width: 60,
    render: (row) => {
      if (row.type === 'story') {
        return h('n-tag', { type: 'primary', size: 'small' }, '需求');
      } else if (row.type === 'bug') {
        return h('n-tag', { type: 'error', size: 'small' }, '缺陷');
      }
      return h('n-tag', { type: 'default', size: 'small' }, row.type);
    },
    sorter: true,
    sortOrder: sortKey.value === 'type' ? sortOrder.value : false,
    onUpdateSortOrder: (order) => {
      if (order === false) {
        sortKey.value = '';
        sortOrder.value = 'asc';
      } else {
        sortKey.value = 'type';
        sortOrder.value = order;
      }
      saveToLocalStorage();
    },
  },
  {
    title: '标题',
    key: 'title',
    width: 250,
    render: (row) => {
      return h('a', {
        href: row.url && row.url.startsWith('@') ? row.url.slice(1) : row.url,
        target: '_blank',
        class: 'title-link',
        title: row.title,
      }, row.title);
      },
    sorter: true,
    sortOrder: sortKey.value === 'title' ? sortOrder.value : false,
    onUpdateSortOrder: (order) => {
      if (order === false) {
        sortKey.value = '';
        sortOrder.value = 'asc';
      } else {
        sortKey.value = 'title';
        sortOrder.value = order;
      }
      saveToLocalStorage();
    },
  },
  {
    title: 'MR链接',
    key: 'mr_url',
    width: 160,
    render: (row) => {
      if (!row.noMr) {
        return h('a', {
          href: row.mr.url,
          target: '_blank',
          class: 'mr-link',
        }, row.mr.url);
      }
      return '';
    },
    sorter: true,
    sortOrder: sortKey.value === 'mr_url' ? sortOrder.value : false,
    onUpdateSortOrder: (order) => {
      if (order === false) {
        sortKey.value = '';
        sortOrder.value = 'asc';
      } else {
        sortKey.value = 'mr_url';
        sortOrder.value = order;
      }
      saveToLocalStorage();
    },
  },
  {
    title: '目标分支',
    key: 'target_branch',
    width: 80,
    render: (row) => {
      if (!row.noMr) {
        return row.mr.target_branch || '-';
      }
      return '';
    },
    sorter: true,
    sortOrder: sortKey.value === 'target_branch' ? sortOrder.value : false,
    onUpdateSortOrder: (order) => {
      if (order === false) {
        sortKey.value = '';
        sortOrder.value = 'asc';
      } else {
        sortKey.value = 'target_branch';
        sortOrder.value = order;
      }
      saveToLocalStorage();
    },
  },
  {
    title: 'MR状态',
    key: 'mr_status',
    width: 80,
    render: (row) => {
      if (!row.noMr) {
        if (row.mr.status === 'error') {
          return h('n-tag', { type: 'error', size: 'small' }, '异常');
        } else if (row.mr.status === 'merged') {
          return h('n-tag', { type: 'success', size: 'small' }, '已合并');
        } else if (row.mr.status === 'open') {
          return h('n-tag', { type: 'warning', size: 'small' }, '未合并');
        } else if (row.mr.status === 'closed') {
          return h('n-tag', { type: 'error', size: 'small' }, '已关闭');
        } else {
          return h('n-tag', { type: 'default', size: 'small' }, row.mr.status);
        }
      } else {
        return h('n-tag', { type: 'default', size: 'small' }, '无MR');
      }
    },
    sorter: true,
    sortOrder: sortKey.value === 'mr_status' ? sortOrder.value : false,
    onUpdateSortOrder: (order) => {
      if (order === false) {
        sortKey.value = '';
        sortOrder.value = 'asc';
      } else {
        sortKey.value = 'mr_status';
        sortOrder.value = order;
      }
      saveToLocalStorage();
    },
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
    lastRefreshTime.value = new Date().toLocaleString();
    saveToLocalStorage();
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

const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    releaseUrl: releaseUrl.value,
    result: result.value,
    mrStatusFilter: mrStatusFilter.value,
    typeFilter: typeFilter.value,
    lastRefreshTime: lastRefreshTime.value,
    sortKey: sortKey.value,
    sortOrder: sortOrder.value,
  }));
};

const loadFromLocalStorage = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      releaseUrl.value = parsedData.releaseUrl || '';
      result.value = parsedData.result || null;
      mrStatusFilter.value = parsedData.mrStatusFilter || '';
      typeFilter.value = parsedData.typeFilter || '';
      lastRefreshTime.value = parsedData.lastRefreshTime || '';
      sortKey.value = parsedData.sortKey || '';
      sortOrder.value = parsedData.sortOrder || 'asc';
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
    }
  }
};

// 生命周期
onMounted(() => {
  loadFromLocalStorage();
});
</script>

<style lang="less" scoped>
.release-merge-check {
  max-width: 1800px;
  margin: 0 auto;
  padding: 16px;
}

.input-section {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
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
  font-size: 0.8em;
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: #1677ff;
}

.loading-text {
  font-size: 1.1em;
}

.error {
  margin: 16px 0;
}

.result-section {
  margin-top: 20px;
}

.release-info {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1em;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #222;
}

.release-details {
  background: #f4f7fb;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9em;
  color: #444;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.2s;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.1);
  }
  
  &.active {
    outline: 2px solid #1677ff;
    background: #e6f7ff;
  }
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 0.8em;
  color: #666;
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
    color: #d48806;
  }
}

.error-card {
  .stat-number {
    color: #e74c3c;
  }
}

.no-mr-card {
  .stat-number {
    color: #888;
  }
}

.filter-section {
  margin-bottom: 12px;
}

.table-section {
  overflow-x: auto;
  
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
    font-size: 11px;
    padding: 4px 6px;
    
    &:hover {
      background: #e6f7ff;
    }
  }
  
  :deep(.n-data-table-td) {
    padding: 2px 4px;
    font-size: 11px;
  }
  
  :deep(.n-data-table-tr:hover) {
    background: #f0f7ff;
  }
  
  :deep(.compact-row) {
    height: 28px;
  }
  
  :deep(.n-tag) {
    font-size: 10px;
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
  }
  
  :deep(.n-data-table-tr:nth-child(even)) {
    background: #fafbfc;
  }
  
  :deep(.n-data-table-tr:nth-child(even):hover) {
    background: #f0f7ff;
  }
}



.title-link {
  color: #1677ff;
  text-decoration: underline;
  word-break: break-all;
  font-size: 11px;
  
  &:hover {
    color: #1456c2;
  }
}

.mr-link {
  color: #1677ff;
  text-decoration: underline;
  word-break: break-all;
  font-size: 11px;
  
  &:hover {
    color: #1456c2;
  }
}

.no-data {
  margin: 24px 0;
  text-align: center;
}

@media (max-width: 900px) {
  .release-merge-check {
    padding: 10px;
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
      gap: 8px !important;
    }
  }
  
  .stat-card {
    height: 60px;
  }
  
  .stat-number {
    font-size: 1.1em;
  }
  
  .stat-label {
    font-size: 0.7em;
  }
}
</style>