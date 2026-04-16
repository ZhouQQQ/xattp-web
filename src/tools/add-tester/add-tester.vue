<template>
  <div class="add-tester-container">
    <n-card>
      <n-form ref="formRef" :model="formData" label-placement="left" label-width="180">
        <n-form-item label="选择类型" path="target_key">
          <n-radio-group v-model:value="formData.target_key">
            <n-radio
              v-for="item in targetKeyOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </n-radio>
          </n-radio-group>
        </n-form-item>

        <n-form-item :label="targetValueLabel" path="target_value">
          <n-input
            v-model:value="formData.target_value"
            :placeholder="targetValuePlaceholder"
            clearable
          />
        </n-form-item>

        <n-form-item label="微信号" path="wx_id">
          <n-input
            v-model:value="formData.wx_id"
            placeholder="请输入微信号（体验成员）"
            clearable
          />
        </n-form-item>

        <n-form-item>
          <n-button type="primary" :loading="loading" @click="handleSubmit">
            添加体验权限
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { createDiscreteApi } from "naive-ui";
import { add_experience_user_api } from "@/api/business";

const { message } = createDiscreteApi(["message"]);

type TargetKey = "tenant_id" | "wx_app_id";

const formData = ref({
  target_key: "tenant_id" as TargetKey,
  target_value: "",
  wx_id: "",
});

const targetKeyOptions = [
  { label: "租户ID", value: "tenant_id" },
  { label: "微信AppID", value: "wx_app_id" },
];

const targetValueLabel = computed(() =>
  formData.value.target_key === "tenant_id" ? "租户ID" : "微信小程序 AppID"
);

const targetValuePlaceholder = computed(() =>
  formData.value.target_key === "tenant_id"
    ? "请输入租户ID"
    : "请输入 wxappid"
);

const loading = ref(false);

async function handleSubmit() {
  const target_key = formData.value.target_key;
  const target_value = formData.value.target_value?.trim();
  const wx_id = formData.value.wx_id?.trim();
  if (!target_value) {
    message.warning(target_key === "tenant_id" ? "请输入租户ID" : "请输入小程序 AppID");
    return;
  }
  if (!wx_id) {
    message.warning("请输入微信号");
    return;
  }

  try {
    loading.value = true;
    const payload: Record<string, string> = {
      wx_id,
      [target_key]: target_value,
    };
    const response = (await add_experience_user_api({
      ...payload,
    })) as { code?: number; msg?: string; data?: unknown };

    if (response.code === 0) {
      message.success("体验权限添加成功");
    } else {
      message.error(response.msg || "添加失败");
    }
  } catch (error) {
    console.error("add_experience_user:", error);
    message.error("请求失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
.add-tester-container {
  padding: 20px;
}
</style>
