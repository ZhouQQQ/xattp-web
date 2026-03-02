<template>
  <div class="merge-request-check">
    <n-card>
      <!-- 输入区域 -->
      <div class="input-section">
        <n-form :model="formData" label-placement="left" label-width="120px">
          <n-form-item label="MR地址" path="mergeRequestUrl">
            <n-input
              v-model:value="formData.mergeRequestUrl"
              placeholder="请输入MR地址，例如：https://code.xiaoantech.com/ebike/ebike-fence/merge_requests/510"
              @keyup.enter="handleCheck"
              @update:value="saveFormDataToStorage"
              class="mr-url-input"
            />
          </n-form-item>
          <n-form-item>
            <n-grid :cols="2" :x-gap="12">
              <n-grid-item>
                <n-form-item label="检测分支" path="checkBranch" style="margin-bottom: 0;">
                  <n-input
                    v-model:value="formData.checkBranch"
                    placeholder="请输入检测分支，例如：test/test"
                    @keyup.enter="handleCheck"
                    @update:value="saveFormDataToStorage"
                  />
                </n-form-item>
              </n-grid-item>
              <n-grid-item>
                <n-form-item path="checkCommitPageSize" style="margin-bottom: 0;">
                  <template #label>
                    <span style="display: flex; align-items: center; gap: 4px;">
                      检测数量
                      <n-tooltip trigger="hover">
                        <template #trigger>
                          <n-icon :component="Help" :size="16" style="cursor: help; color: #999;" />
                        </template>
                        {{ `会检测对应分支最近${formData.checkCommitPageSize || 100}个commit是否包含该MR的commit，如果MR比较久远可适当加大数量` }}
                      </n-tooltip>
                    </span>
                  </template>
                  <n-input-number
                    v-model:value="formData.checkCommitPageSize"
                    :min="1"
                    :max="1000"
                    placeholder="请输入检测最近commit数量"
                    @update:value="saveFormDataToStorage"
                    style="width: 100%"
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>
          </n-form-item>
          <n-form-item>
            <n-space>
              <n-button
                type="primary"
                :loading="loading"
                @click="handleCheck"
                class="check-button"
              >
                开始检测
              </n-button>
              <n-button
                v-if="resultData && resultData.length > 0"
                type="default"
                @click="clearData"
                class="clear-button"
              >
                清空
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="medium" />
        <span class="loading-text">正在检测MR合并状态，请稍候...</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error">
        <n-alert type="error" :title="error" />
      </div>

      <!-- 成功提示 -->
      <div v-if="allCommitsMerged && resultData && resultData.length > 0" class="success-tip">
        <n-alert type="success" :title="`所有commit都已合入${formData.checkBranch}`" />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && (!resultData || resultData.length === 0)" class="empty-section">
        <n-empty description="请输入MR地址、分支然后开始检查" />
      </div>

      <!-- 结果展示 -->
      <div v-if="resultData && resultData.length > 0" class="result-section">
        <!-- 数据表格 -->
        <div class="table-section">
          <n-data-table
            :columns="columns"
            :data="resultData"
            :pagination="false"
            :bordered="false"
            size="small"
            :row-class-name="() => 'compact-row'"
            :striped="true"
            class="mr-table"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from "vue";
import { createDiscreteApi } from "naive-ui";
import { NTag } from "naive-ui";
import { Help } from "@vicons/tabler";
import { mergeRequestCheckAPI } from "@/api/gitlab";

// localStorage key
const STORAGE_KEY = "merge-request-check-data";

/**
 * 从 localStorage 读取表单初始值（在 ref 创建前同步执行，刷新后 MR 地址等能立即恢复）
 */
function getInitialFormData() {
  if (typeof window === "undefined" || !window.localStorage) {
    return { mergeRequestUrl: "", checkBranch: "test/test", checkCommitPageSize: 100 };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { mergeRequestUrl: "", checkBranch: "test/test", checkCommitPageSize: 100 };
    const parsed = JSON.parse(saved);
    if (!parsed?.formData) return { mergeRequestUrl: "", checkBranch: "test/test", checkCommitPageSize: 100 };
    const fd = parsed.formData;
    return {
      mergeRequestUrl: fd.mergeRequestUrl != null ? String(fd.mergeRequestUrl) : "",
      checkBranch: fd.checkBranch != null ? String(fd.checkBranch) : "test/test",
      checkCommitPageSize: fd.checkCommitPageSize != null ? Number(fd.checkCommitPageSize) || 100 : 100,
    };
  } catch (e) {
    return { mergeRequestUrl: "", checkBranch: "test/test", checkCommitPageSize: 100 };
  }
}

// 响应式数据 - 初始值来自 localStorage，刷新后 MR 地址不会丢
const formData = ref(getInitialFormData());

const loading = ref(false);
const error = ref("");
const resultData = ref<any[]>([]);
const isInitialized = ref(true); // 初始值已从 storage 来，直接视为已初始化，便于后续保存

// 消息提示
const { message } = createDiscreteApi(["message"]);

/**
 * 保存表单数据到localStorage
 */
const saveFormDataToStorage = () => {
  // 如果还未初始化完成，不保存
  if (!isInitialized.value) {
    return;
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const dataToSave = {
        formData: formData.value,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  } catch (e) {
    console.error("保存数据到localStorage失败:", e);
  }
};

// 监听表单数据变化，自动保存
watch(
  formData,
  () => {
    saveFormDataToStorage();
  },
  { deep: true }
);

// 初始数据已在 getInitialFormData() 中从 localStorage 同步恢复，无需 onMounted

/**
 * 判断是否所有commit都已合入
 */
const allCommitsMerged = computed(() => {
  if (!resultData.value || resultData.value.length === 0) {
    return false;
  }
  return resultData.value.every((item) => item.check_branch_included === true);
});

// 表格列定义
const columns = computed(() => [
  {
    title: "Commit ID",
    key: "commit_id",
    minWidth: 150,
    render: (row: any) => {
      return h(
        "span",
        {
          style: {
            fontFamily: "monospace",
            fontSize: "12px",
          },
        },
        row.commit_id?.substring(0, 12) || "-"
      );
    },
  },
  {
    title: "Commit消息",
    key: "commit_msg",
    minWidth: 200,
    ellipsis: {
      tooltip: true,
    },
    render: (row: any) => {
      return row.commit_msg || "-";
    },
  },
  {
    title: "提交作者",
    key: "commit_author",
    minWidth: 100,
    render: (row: any) => {
      return row.commit_author || "-";
    },
  },
  {
    title: "提交时间",
    key: "committed_date",
    minWidth: 160,
    render: (row: any) => {
      if (!row.committed_date) return "-";
      const date = new Date(row.committed_date);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
  },
  {
    title: "是否已合入",
    key: "check_branch_included",
    minWidth: 100,
    render: (row: any) => {
      if (row.check_branch_included === true) {
        return h(NTag, { type: "success", size: "small" }, { default: () => "已合入" });
      } else {
        return h(NTag, { type: "error", size: "small" }, { default: () => "未合入" });
      }
    },
  },
  // {
  //   title: "检测分支commit数量",
  //   key: "check_branch_commit_size",
  //   width: 150,
  //   render: (row: any) => {
  //     return row.check_branch_commit_size || "-";
  //   },
  // },
]);

/**
 * 处理检测
 */
const handleCheck = async () => {
  // 表单验证
  if (!formData.value.mergeRequestUrl) {
    error.value = "请输入MR地址";
    message.error("请输入MR地址");
    return;
  }

  if (!formData.value.checkBranch) {
    error.value = "请输入检测分支";
    message.error("请输入检测分支");
    return;
  }

  if (!formData.value.checkCommitPageSize || formData.value.checkCommitPageSize < 1) {
    error.value = "请输入有效的检测最近commit数量";
    message.error("请输入有效的检测最近commit数量");
    return;
  }

  loading.value = true;
  error.value = "";
  resultData.value = [];

  // 构建请求体
  const requestBody = {
    merge_request_url: formData.value.mergeRequestUrl,
    check_branch: formData.value.checkBranch,
    check_commit_page_size: formData.value.checkCommitPageSize,
  };

  // 发送请求
  mergeRequestCheckAPI(requestBody)
    .then((response) => {
      if (response.code !== 0) {
        error.value = response.msg || "接口调用失败";
        message.error(response.msg || "接口调用失败");
        return;
      }

      // 保存结果数据
      resultData.value = response.data || [];

      // 保存到localStorage
      saveFormDataToStorage();

      // 显示成功消息
      if (allCommitsMerged.value) {
        message.success(`所有commit都已合入${formData.value.checkBranch}`);
      } else {
        message.success(`检测完成，共检测到 ${resultData.value.length} 个commit`);
      }
    })
    .catch((err: any) => {
      error.value = `请求失败: ${err.message || err}`;
      message.error(`请求失败: ${err.message || err}`);
      console.error("检测失败:", err);
    })
    .finally(() => {
      loading.value = false;
    });
};

/**
 * 清空数据
 */
const clearData = () => {
  resultData.value = [];
  error.value = "";
  
  // 清除localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error("清除localStorage失败:", e);
  }
  
  message.success("已清空数据");
};
</script>

<style lang="less" scoped>
.merge-request-check {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 2px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  :deep(.n-card) {
    padding: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
  }
}

.input-section {
  margin-bottom: 12px;
}

.mr-url-input {
  width: 100%;
}

.check-button {
  border-radius: 6px;
}

.empty-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
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

.success-tip {
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

.table-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;

  :deep(.n-data-table) {
    width: 100%;
    max-width: 100%;
    
    .n-data-table-base-table {
      border-radius: 6px;
      width: 100%;
      max-width: 100%;
    }

    // 允许表格水平滚动
    .n-data-table-wrapper {
      width: 100%;
      max-width: 100%;
      overflow-x: auto !important;
      overflow-y: visible !important;
    }

    .n-scrollbar {
      width: 100%;
      max-width: 100%;
      overflow-x: auto !important;
      overflow-y: visible !important;
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

  // 确保tag颜色正确显示
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

  :deep(.n-data-table-tr:nth-child(even)) {
    background: #fafbfc;
  }

  :deep(.n-data-table-tr:nth-child(even):hover) {
    background: #f0f7ff;
  }
}

@media (max-width: 900px) {
  .merge-request-check {
    padding: 6px;
  }
}
</style>
