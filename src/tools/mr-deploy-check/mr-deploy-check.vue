<template>
  <div class="mr-deploy-check">
    <n-card>
      <div class="input-section">
        <n-form label-placement="left" label-width="88px">
          <n-form-item label="共享环境">
            <n-radio-group v-model:value="env" @update:value="onEnvChange">
              <n-radio value="test">test</n-radio>
              <n-radio value="uat">uat</n-radio>
            </n-radio-group>
          </n-form-item>
          <n-form-item label="MR地址">
            <n-input
              v-model:value="mergeRequestUrl"
              placeholder="请输入 MR 链接，例如：https://code.xiaoantech.com/ebike/ebike-fence/merge_requests/625"
              @keyup.enter="handleCheck"
              @update:value="onMergeRequestUrlChange"
            />
          </n-form-item>
          <n-form-item>
            <n-space>
              <n-button type="primary" :loading="loading" @click="handleCheck">
                开始检测
              </n-button>
              <n-button v-if="result" @click="clearData">
                清空
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>

      <div v-if="loading" class="loading">
        <n-spin size="medium" />
        <span class="loading-text">正在检测部署状态，请稍候...</span>
      </div>

      <div v-if="error" class="error">
        <n-alert type="error" :title="error" />
      </div>

      <div
        v-if="!loading && !error && !result"
        class="empty-section"
      >
        <n-empty description="请选择环境并输入 MR 链接后开始检测" />
      </div>

      <div v-if="result" class="result-section">
        <n-alert
          class="deploy-summary-alert"
          :type="result.all_commmit_deployed ? 'success' : 'warning'"
          :title="deploySummaryText"
          :show-icon="true"
        />

        <div v-if="result.image_info" class="info-block">
          <div class="info-block-title">{{ env }}环境服务镜像信息</div>
          <div class="image-info-grid">
            <div class="image-info-item">
              <div class="image-info-label">服务</div>
              <div class="image-info-value">{{ result.image_info.image_name || '-' }}</div>
            </div>
            <div class="image-info-item">
              <div class="image-info-label">分支</div>
              <div class="image-info-value">{{ result.image_info.branch || '-' }}</div>
            </div>
            <div class="image-info-item">
              <div class="image-info-label">构建时间</div>
              <div class="image-info-value mono-text">{{ result.image_info.build_time_fmt || '-' }}</div>
            </div>
            <div class="image-info-item">
              <div class="image-info-label">Commit</div>
              <div class="image-info-value mono-text">{{ result.image_info.commit_id || '-' }}</div>
            </div>
            <div class="image-info-item image-info-item--full">
              <div class="image-info-label">镜像</div>
              <div
                class="image-info-value mono-text image-raw"
                :title="result.image_info.image_raw"
              >
                {{ result.image_info.image_raw || '-' }}
              </div>
            </div>
          </div>
        </div>

        <div class="table-section">
          <div class="table-title">Commit 明细</div>
          <n-data-table
            :columns="columns"
            :data="commits"
            :pagination="false"
            :bordered="false"
            size="small"
            :striped="true"
            class="commit-table"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { createDiscreteApi, NTag, NTooltip } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  getMrDeployCheck,
  type MrDeployEnv,
} from './mr-deploy-check.service';

const STORAGE_KEY = 'mr-deploy-check-form';

interface CommitRow {
  branch_commit_date?: string | null;
  branch_commit_date_fmt?: string | null;
  commit_author?: string;
  commit_id?: string;
  commit_msg?: string;
  committed_date?: string;
  committed_date_fmt?: string;
  is_maybe_deployed?: boolean;
  is_merged_to_deploy_branch?: boolean;
}

interface MrDeployResult {
  all_commmit_deployed?: boolean;
  commits?: CommitRow[];
  image_info?: Record<string, string>;
  mr?: {
    author?: string;
    title?: string;
    source_branch?: string;
    target_branch?: string;
    state?: string;
    url?: string;
    web_url?: string;
  };
}

function getInitialForm() {
  const fallback = { env: 'uat' as MrDeployEnv, mergeRequestUrl: '' };
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return {
      env: parsed.env === 'test' || parsed.env === 'uat' ? parsed.env : 'uat',
      mergeRequestUrl: parsed.mergeRequestUrl != null ? String(parsed.mergeRequestUrl) : '',
    };
  } catch {
    return fallback;
  }
}

const initialForm = getInitialForm();
const env = ref<MrDeployEnv>(initialForm.env);
const mergeRequestUrl = ref(initialForm.mergeRequestUrl);
const loading = ref(false);
const error = ref('');
const result = ref<MrDeployResult | null>(null);

const { message } = createDiscreteApi(['message']);

const commits = computed(() => result.value?.commits ?? []);

const imageBranch = computed(() => result.value?.image_info?.branch || '部署');

const deploySummaryText = computed(() => {
  const envLabel = env.value;
  if (result.value?.all_commmit_deployed) {
    return `该MR所有commit均已部署到${envLabel}环境`;
  }
  return `该MR可能存在commit没有部署到${envLabel}环境`;
});

const buildTimeFmt = computed(() => result.value?.image_info?.build_time_fmt || '-');

const renderBoolTag = (value: boolean | undefined, trueText: string, falseText: string) => {
  if (value === true) {
    return h(NTag, { type: 'success', size: 'small' }, { default: () => trueText });
  }
  return h(NTag, { type: 'warning', size: 'small' }, { default: () => falseText });
};

const timeCompareRowStyle = 'display: flex; gap: 10px; line-height: 1.7;';
const timeCompareLabelStyle = 'flex-shrink: 0; width: 7.5em; text-align: right; opacity: 0.85;';
const timeCompareValueStyle = 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;';

const renderMaybeDeployedTooltip = (row: CommitRow) => {
  const branchCommitTime = row.branch_commit_date_fmt || row.branch_commit_date || '-';
  const buildTime = buildTimeFmt.value;
  return h('div', { style: 'font-size: 12px;' }, [
    h('div', { style: timeCompareRowStyle }, [
      h('span', { style: timeCompareLabelStyle }, '分支提交时间'),
      h('span', { style: timeCompareValueStyle }, branchCommitTime),
    ]),
    h('div', { style: timeCompareRowStyle }, [
      h('span', { style: timeCompareLabelStyle }, '镜像构建时间'),
      h('span', { style: timeCompareValueStyle }, buildTime),
    ]),
  ]);
};

const renderMaybeDeployedCell = (row: CommitRow) => {
  return h(NTooltip, { trigger: 'hover' }, {
    trigger: () => renderBoolTag(row.is_maybe_deployed, '是', '否'),
    default: () => renderMaybeDeployedTooltip(row),
  });
};

const columns = computed<DataTableColumns<CommitRow>>(() => [
  {
    title: 'Commit ID',
    key: 'commit_id',
    width: 110,
    render: (row) => h('span', { class: 'mono-text', title: row.commit_id }, row.commit_id?.slice(0, 12) || '-'),
  },
  {
    title: 'Commit 消息',
    key: 'commit_msg',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row) => row.commit_msg || '-',
  },
  {
    title: '提交人',
    key: 'commit_author',
    width: 80,
    render: (row) => row.commit_author || '-',
  },
  {
    title: 'commit时间',
    key: 'branch_commit_date_fmt',
    width: 150,
    render: (row) => h(
      'span',
      { class: 'mono-text' },
      row.branch_commit_date_fmt || row.branch_commit_date || '-',
    ),
  },
  {
    title: `合并到${imageBranch.value}分支`,
    key: 'is_merged_to_deploy_branch',
    width: 130,
    align: 'center',
    render: (row) => renderBoolTag(row.is_merged_to_deploy_branch, '是', '否'),
  },
  {
    title: `可能已部署到${env.value}环境`,
    key: 'is_maybe_deployed',
    width: 168,
    align: 'center',
    render: (row) => renderMaybeDeployedCell(row),
  },
]);

const clearResult = () => {
  result.value = null;
  error.value = '';
};

const saveFormToStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        env: env.value,
        mergeRequestUrl: mergeRequestUrl.value,
      }));
    }
  } catch (e) {
    console.error('Failed to save form:', e);
  }
};

const onEnvChange = () => {
  clearResult();
  saveFormToStorage();
};

const onMergeRequestUrlChange = () => {
  clearResult();
  saveFormToStorage();
};

const handleCheck = async () => {
  const url = mergeRequestUrl.value.trim();
  if (!url) {
    error.value = '请输入 MR 链接';
    message.error('请输入 MR 链接');
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const response = await getMrDeployCheck({
      env: env.value,
      merge_request_url: url,
    });
    if (response.code !== 0) {
      error.value = response.msg || '接口调用失败';
      message.error(error.value);
      return;
    }
    result.value = response.data || null;
    saveFormToStorage();
    if (result.value?.all_commmit_deployed) {
      message.success(`该MR所有commit均已部署到${env.value}环境`);
    } else {
      message.warning(`该MR可能存在commit没有部署到${env.value}环境`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    error.value = `请求失败: ${msg}`;
    message.error(error.value);
  } finally {
    loading.value = false;
  }
};

const clearData = () => {
  mergeRequestUrl.value = '';
  env.value = 'uat';
  result.value = null;
  error.value = '';
  saveFormToStorage();
  message.success('已清空');
};
</script>

<style lang="less" scoped>
.mr-deploy-check {
  width: 100%;
}

.input-section {
  margin-bottom: 12px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 32px 0;
  color: #1677ff;
}

.error {
  margin: 12px 0;
}

.empty-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deploy-summary-alert {
  margin-top: 4px;
}

.info-block {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #444;
}

.info-block-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.image-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
}

.image-info-item {
  min-width: 0;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 6px;
}

.image-info-item--full {
  grid-column: 1 / -1;
}

.image-info-label {
  font-size: 11px;
  color: #8c8c8c;
  line-height: 1.2;
  margin-bottom: 4px;
}

.image-info-value {
  font-size: 13px;
  color: #262626;
  line-height: 1.4;
  word-break: break-word;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.image-raw {
  word-break: break-all;
}

@media (max-width: 900px) {
  .image-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .image-info-grid {
    grid-template-columns: 1fr;
  }
}

.table-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: #333;
}

.commit-table {
  :deep(.mono-text) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  :deep(.n-data-table-th) {
    background: #f6f8fa;
    font-size: 12px;
  }

  :deep(.n-data-table-td) {
    font-size: 12px;
  }
}
</style>
