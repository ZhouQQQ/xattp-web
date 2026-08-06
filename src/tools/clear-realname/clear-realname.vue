<template>
  <div class="clear-realname-container">
    <n-card >
      <n-form ref="formRef" :model="formData" label-placement="left" label-width="100">
        <n-form-item label="环境" path="env">
          <n-select 
            v-model:value="formData.env" 
            :options="envOptions" 
            placeholder="请选择环境"
          />
        </n-form-item>

        <n-form-item label="租户ID" path="tenant_id">
          <n-input 
            v-model:value="formData.tenant_id" 
            placeholder="请输入租户ID"
            clearable
          />
        </n-form-item>

        <n-form-item label="手机号" path="phone">
          <n-input-group>
            <n-input 
              v-model:value="formData.phone" 
              placeholder="请输入手机号"
              clearable
            />
            <n-button @click="fillMyPhone">我的手机号</n-button>
          </n-input-group>
        </n-form-item>

        <n-form-item>
          <n-button 
            type="primary" 
            :loading="loading" 
            @click="handleClearRealname"
          >
            清除实名
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { createDiscreteApi } from "naive-ui";
import { clear_realname_api } from "@/api/business";
import jwtDecode from "jwt-decode";

const { message } = createDiscreteApi(["message"]);

// 表单数据
const formData = ref({
  env: "test2",
  tenant_id: "1",
  phone: ""
});

// 环境选项
const envOptions = [
  {
    label: "test2",
    value: "test2",
    disabled: false
  },
  {
    label: "dev",
    value: "dev",
    disabled: false
  },
  {
    label: "uat",
    value: "uat",
    disabled: false
  }
];

// 加载状态
const loading = ref(false);

/**
 * 填充我的手机号
 */
const fillMyPhone = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      message.warning("未找到登录token");
      return;
    }

    const decoded: any = jwtDecode(token);
    const phone = decoded.loginId;
    
    if (phone) {
      formData.value.phone = phone;
      message.success("已填充");
    } else {
      message.warning("token中未包含手机号信息");
    }
  } catch (error) {
    console.error("解析token失败:", error);
    message.error("解析token失败");
  }
};

/**
 * 处理清除实名操作
 */
const handleClearRealname = async () => {
  // 验证手机号
  if (!formData.value.phone) {
    message.warning("请输入手机号");
    return;
  }

  try {
    loading.value = true;
    const response = await clear_realname_api({
      env: formData.value.env,
      tenant_id: formData.value.tenant_id,
      phone: formData.value.phone
    });

    if (response.code === 0) {
      message.success(response.data || "清除实名成功");
      // 清空手机号
      // formData.value.phone = "";
    } else {
      message.error(response.msg || "清除实名失败");
    }
  } catch (error) {
    console.error("清除实名失败:", error);
    message.error("清除实名失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="less" scoped>
.clear-realname-container {
  padding: 20px;
}
</style>