<template>
  <div>
    <c-card>
      <div class="environment-section">
        <h3>环境选择</h3>
        <div class="env-row">
          <n-select v-model:value="selectedEnv" :options="environments" placeholder="请选择环境" class="env-select" />
          <div class="tenant-count" v-if="tenantIds.length > 0">
            <n-tag type="" size="small">
              📊 当前环境共有 {{ tenantIds.length }} 个租户
            </n-tag>
          </div>
        </div>
      </div>

      <div class="sql-input-section" mt-4>
        <div class="input-header">
          <h3>SQL输入 <n-button size="small" type="" @click="insertExample" class="example-btn">
              📝 示例
            </n-button></h3>
          <div class="placeholder-tip">
            <n-tag type="" size="small" class="clickable-tag" @click="insertPlaceholder">
              💡 提示1：使用 {tenant_id} 作为租户ID占位符，点我插入
            </n-tag>
            <n-tag type="" size="small" class="clickable-tag">
              💡 提示2：SQL必须指定库名,并且 以分号 ; 结束
            </n-tag>
          </div>

        </div>

        <div class="sql-editor-container">
          <div class="input-row">
            <n-input v-model:value="sqlInput" type="textarea" :placeholder="exampleSQL" :rows="6" class="sql-input" />

          </div>
          <div class="highlighted-overlay" v-if="sqlInput">
            <div class="highlighted-sql" v-html="highlightedSql"></div>
          </div>
        </div>
      </div>

      <div class="result-section" mt-4 v-if="tenantIds.length > 0">
        <div class="result-header">
          <h3>生成的多租户SQL ({{ tenantIds.length }} 个租户)</h3>
          <div class="result-actions">
            <div class="action-controls">
              <n-checkbox v-model:checked="includeComments" size="small">
                包含注释
              </n-checkbox>
            </div>
            <div class="action-buttons">
              <n-button type="default" size="small" @click="copyAllSQL">
                复制全部
              </n-button>
              <n-button type="default" size="small" @click="downloadSQL">
                下载SQL文件
              </n-button>
              <n-button type="success" size="small" @click="executeSQL" :loading="executingSQL">
                执行SQL
              </n-button>
            </div>
          </div>
        </div>
        <div class="sql-results">
          <div class="sql-result-item">
            <n-input
              v-model:value="editableGeneratedSQL"
              type="textarea"
              :rows="20"
              placeholder="生成的SQL将显示在这里，您可以编辑或删除部分内容..."
              class="editable-sql-textarea"
            />
          </div>
        </div>
      </div>
    </c-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { sqlExecuteApi } from '@/api/db_tool';
import { config } from '@/config';
const message = useMessage();

// 响应式数据
const sqlInput = ref('');
const selectedEnv = ref('test2');
const tenants = ref<any[]>([]);
const tenantIds = ref<string[]>([]);
const totalCount = ref<string>('');
const loadingTenants = ref(false);
const includeComments = ref(false);
const executingSQL = ref(false);
const editableGeneratedSQL = ref('');

// 环境配置
const environments = [
  {
    label: '测试环境（test2）',
    value: 'test2'
  },
  {
    label: 'UAT环境（uat）',
    value: 'uat',
    disabled: true
  }
];

// 示例SQL
const exampleSQL = `请输入包含 {tenant_id} 占位符的SQL语句...

示例：
ALTER TABLE ebike_operation.t_ebike_operation_one_move_record_{tenant_id} 
ADD COLUMN \`last_order_end_time\` datetime DEFAULT NULL COMMENT "车辆最近一次订单的结束时间";`;

// 实际示例SQL（用于插入）
const actualExampleSQL = `ALTER TABLE ebike_operation.t_ebike_operation_one_move_record_{tenant_id} 
ADD COLUMN \`last_order_end_time\` datetime DEFAULT NULL COMMENT "车辆最近一次订单的结束时间";`;



// 高亮显示占位符
const highlightedSql = computed(() => {
  if (!sqlInput.value) return '';
  return sqlInput.value.replace(
    /\{tenant_id\}/g,
    '<span class="placeholder-highlight">{tenant_id}</span>'
  );
});

// 实时生成所有SQL
const allGeneratedSQL = computed(() => {
  if (!sqlInput.value.trim() || tenantIds.value.length === 0) {
    return '';
  }

  // 检查是否包含 {tenant_id} 占位符
  if (!sqlInput.value.includes('{tenant_id}')) {
    return '';
  }

  // 按租户ID排序（字符串转整数排序）
  const sortedTenantIds = [...tenantIds.value].sort((a, b) => {
    const aNum = parseInt(a.toString().replace(/\D/g, '')) || parseInt(a) || 0;
    const bNum = parseInt(b.toString().replace(/\D/g, '')) || parseInt(b) || 0;
    return aNum - bNum;
  });

  return sortedTenantIds.map(tenantId => {
    // 提取租户ID的数字部分，如果tenantId是字符串格式，提取其中的数字
    const tenantIdNumber = tenantId.toString().replace(/\D/g, '') || tenantId;

    const comment = includeComments.value ? `-- 租户ID: ${tenantId}\n` : '';
    return `${comment}${sqlInput.value.replace(/\{tenant_id\}/g, tenantIdNumber)}\n`;
  }).join('\n');
});

// 监听生成的SQL变化，同步到可编辑的SQL
watch(allGeneratedSQL, (newSQL) => {
  editableGeneratedSQL.value = newSQL;
});



// 获取租户列表
async function fetchTenants() {
  loadingTenants.value = true;
  try {
    const response = await fetch('https://tenant-test2.xiaoantech.com/tenant/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xa-source': 'xattp',
        'xa-version': config.app.version,
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: 3000,
        platform: 'WeChatMPS',
        traceId: 'fromxattp',
        tenantId: ''
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log('API响应数据:', data); // 调试信息

    if (data.success && data.code === '0') {
      if (data.data && data.data.list && Array.isArray(data.data.list)) {
        tenants.value = data.data.list;
        // 提取所有租户ID到单独的数组
        tenantIds.value = data.data.list.map(tenant => tenant.tenantId);
        totalCount.value = data.data.count || '0';
        console.log('成功获取租户列表:', {
          total: totalCount.value,
          tenantIds: tenantIds.value
        });
      } else {
        console.warn('API返回数据结构异常:', data);
        tenants.value = [];
        tenantIds.value = [];
        totalCount.value = '0';
        message.warning('获取租户列表成功，但数据结构异常');
      }
    } else {
      throw new Error(data.msg || '获取租户列表失败');
    }
  } catch (error) {
    console.error('获取租户列表失败:', error);
    message.error('获取租户列表失败: ' + (error as Error).message);
    tenants.value = [];
  } finally {
    loadingTenants.value = false;
  }
}

// 刷新租户列表
function refreshTenants() {
  fetchTenants();
}



// 插入示例SQL
function insertExample() {
  sqlInput.value = actualExampleSQL;
  // 聚焦到输入框
  const textarea = document.querySelector('.sql-input textarea') as HTMLTextAreaElement;
  if (textarea) {
    textarea.focus();
  }
}

// 插入占位符到SQL输入框
function insertPlaceholder() {
  const textarea = document.querySelector('.sql-input textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const placeholder = '{tenant_id}';
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentValue = sqlInput.value;

  // 在光标位置插入占位符
  const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
  sqlInput.value = newValue;

  // 设置新的光标位置
  const newCursorPos = start + placeholder.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);

  // 聚焦到输入框
  textarea.focus();
}





// 复制所有SQL
async function copyAllSQL() {
  if (!editableGeneratedSQL.value) {
    message.warning('没有可复制的SQL');
    return;
  }

  try {
    await navigator.clipboard.writeText(editableGeneratedSQL.value);
    message.success('所有SQL已复制到剪贴板');
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = editableGeneratedSQL.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    message.success('所有SQL已复制到剪贴板');
  }
}

// 下载SQL文件
function downloadSQL() {
  if (!editableGeneratedSQL.value) {
    message.warning('没有可下载的SQL');
    return;
  }

  const blob = new Blob([editableGeneratedSQL.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `multi_tenant_sql_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success('SQL文件已下载');
}


function executeSQL() {
  if (!editableGeneratedSQL.value) {
    message.warning('没有可执行的SQL');
    return;
  }

  executingSQL.value = true;
  // 这里可以添加实际执行SQL的逻辑
  sqlExecuteApi({ sql: editableGeneratedSQL.value, env: selectedEnv.value }).then((res) => {
    if (res.code === 0) {
      message.success('SQL执行成功');
    } else {
      message.error(res.msg);
    }
  }).catch((err) => {
    message.error('SQL执行失败: ' + err.message);
  }).finally(() => {
    executingSQL.value = false;
  });
}

// 页面加载时获取租户列表
onMounted(() => {
  fetchTenants();
});
</script>

<style lang="less" scoped>
.sql-input-section {
  .input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .placeholder-tip {
    .clickable-tag {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.sql-editor-container {
  position: relative;

  .input-row {
    display: flex;
    gap: 0;
    align-items: flex-start;

    .sql-input {
      flex: 1;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;

      :deep(.n-input__input-el) {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
      }
    }

    .example-btn {
      flex-shrink: 0;
      margin-bottom: 4px;
    }
  }

  .highlighted-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;

    .highlighted-sql {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      padding: 10px 12px;
      white-space: pre-wrap;
      color: transparent;
      background: transparent;
      border: 1px solid transparent;
      height: 100%;
      overflow: hidden;

      .placeholder-highlight {
        color: #3b82f6;
        font-weight: bold;
        background: rgba(59, 130, 246, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
    }
  }


}

.environment-section {
  h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .env-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .env-select {
    width: 200px;
  }

  .tenant-count {
    .n-tag {
      font-size: 12px;
    }
  }
}

.result-section {
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .result-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .action-controls {
        .n-checkbox {
          font-size: 12px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 4px;
      }
    }
  }

  .sql-results {
    .sql-result-item {
      .editable-sql-textarea {
        :deep(textarea) {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.4;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .tenant-grid {
    grid-template-columns: 1fr !important;
  }

  .input-header,
  .result-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;
  }
}
</style>