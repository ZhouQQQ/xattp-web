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
        <!-- 历史记录 -->
        <div v-if="historyList.length > 0" class="history-section">
          <!-- <div class="history-label">历史记录：</div> -->
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
          <n-grid :cols="7" :x-gap="8" :y-gap="8">
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
import { ref, computed, h, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createDiscreteApi } from 'naive-ui';
import { NTag } from 'naive-ui';
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
const typeFilter = ref('');
const lastRefreshTime = ref('');
const sortKey = ref('');
const sortOrder = ref('asc');
const historyList = ref([]);

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
        if (parsed.typeFilter !== undefined) typeFilter.value = parsed.typeFilter;
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
        typeFilter: typeFilter.value,
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
    width: 55,
    render: (row) => {
      if (row.type === 'story') {
        return h(NTag, { type: 'info', size: 'small' }, { default: () => '需求' });
      } else if (row.type === 'bug') {
        return h(NTag, { type: 'error', size: 'small' }, { default: () => '缺陷' });
      }
      return h(NTag, { type: 'default', size: 'small' }, { default: () => row.type });
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
    },
  },
  {
    title: 'MR链接',
    key: 'mr_url',
    width: 250,
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
    },
  },
  {
    title: '目标分支',
    key: 'target_branch',
    width: 120,
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
    },
  },
  {
    title: 'MR状态',
    key: 'mr_status',
    width: 100,
    render: (row) => {
      if (!row.noMr) {
        if (row.mr.status === 'error') {
          return h(NTag, { type: 'warning', size: 'small' }, { default: () => '异常' });
        } else if (row.mr.status === 'merged') {
          return h(NTag, { type: 'success', size: 'small' }, { default: () => '已合并' });
        } else if (row.mr.status === 'open') {
          return h(NTag, { type: 'error', size: 'small' }, { default: () => '未合并' });
        } else if (row.mr.status === 'closed') {
          return h(NTag, { type: 'warning', size: 'small' }, { default: () => '已关闭' });
        } else {
          return h(NTag, { type: 'default', size: 'small' }, { default: () => row.mr.status });
        }
      } else {
        return h(NTag, { type: 'default', size: 'small' }, { default: () => '无MR' });
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
  typeFilter.value = '';
  sortKey.value = '';
  sortOrder.value = 'asc';
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
  // height: 100vh;
  margin: 0;
  padding: 2px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
  :deep(.n-card) {
    padding: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
}

.input-section {
  margin-bottom: 12px;
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
  margin-top: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.release-info {
  margin-bottom: 12px;
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
  padding: 8px 12px;
  font-size: 0.9em;
  color: #444;
}

.stat-cards {
  margin-bottom: 12px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.2s;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  :deep(.n-card__content) {
    padding: 4px;
  }
  
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
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 4px;
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

.table-section {
  display: flex;
  flex-direction: column;
  
  :deep(.n-data-table) {
    .n-data-table-base-table {
      border-radius: 6px;
    }
    
    // 移除表格滚动条
    .n-data-table-wrapper {
      overflow: visible !important;
    }
    
    .n-scrollbar {
      overflow: visible !important;
    }
  }
}

.mr-table {
  :deep(.n-data-table-th) {
    background: #f6f8fa;
    color: #333;
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 6px;
    
    &:hover {
      background: #e6f7ff;
    }
  }
  
  :deep(.n-data-table-td) {
    padding: 3px 5px;
    font-size: 12px;
    overflow: hidden;
    
    // 确保标题和MR链接列不换行
    &:nth-child(2),
    &:nth-child(3) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  :deep(.n-data-table-tr:hover) {
    background: #f0f7ff;
  }
  
  :deep(.compact-row) {
    height: 28px;
  }
  
  :deep(.n-tag) {
    font-size: 11px;
    padding: 0 4px;
    height: 20px;
    line-height: 18px;
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
  font-size: 12px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
  
  &:hover {
    color: #1456c2;
  }
}

.mr-link {
  color: #1677ff;
  text-decoration: underline;
  font-size: 12px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
  
  &:hover {
    color: #1456c2;
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
    height: 50px;
  }
  
  .stat-number {
    font-size: 1.0em;
  }
  
  .stat-label {
    font-size: 0.65em;
  }
}
</style>