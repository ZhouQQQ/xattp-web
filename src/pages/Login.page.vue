<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <h1>小安测试工具平台</h1>
      </div>
      <div class="login-form">
        <h2>欢迎使用</h2>
        <p>请使用钉钉账号登录系统</p>
        <c-button 
          type="primary" 
          size="large" 
          @click="handleLogin"
          class="login-btn"
        >
          <template #icon>
            <n-icon><DingtalkOutlined /></n-icon>
          </template>
          钉钉登录
        </c-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DingtalkOutlined } from '@vicons/antd';
import { sanitizeLoginRedirect, toLogin } from '@/utils/location';

const route = useRoute();

const postLoginRedirect = computed(() => {
  const raw = route.query.redirect;
  return sanitizeLoginRedirect(typeof raw === 'string' ? raw : '/');
});

function handleLogin() {
  toLogin(postLoginRedirect.value);
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.logo h1 {
  font-size: 2.0rem;
  font-weight: 600;
  color: #18a058;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.logo p {
  color: #666;
  margin: 0 0 40px 0;
  font-size: 1.1rem;
  font-weight: 400;
}

.login-form h2 {
  font-size: 1.6rem;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.login-form p {
  color: #666;
  margin: 0 0 32px 0;
  font-size: 0.95rem;
}

.login-btn {
  width: 100%;
  height: 52px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 8px;
}
</style> 