<template>
    <n-flex class="logging" justify="center">
        <n-spin size="large" />
        {{ status }}
    </n-flex>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user.store';
import { useRoute, useRouter } from 'vue-router';
import { login, getUserInfo } from '@/api/auth';
import { nextTick } from 'vue';
import { useMessage } from 'naive-ui';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const userStore = useUserStore();
const status = ref('正在验证登录信息...');

const authCode = route.query.authCode;

// 使用authCode登录
if (!authCode) {
    status.value = '登录参数缺失，跳转到登录页...';
    setTimeout(() => {
        router.replace('/login');
    }, 1000);
} else {
    const handleRedirect = async () => {
        try {
            status.value = '正在调用登录接口...';
            const loginResponse = await login({ 'authCode': authCode });
            
            if (loginResponse.code === 0) {
                status.value = '登录成功...';
                
                // 保存 token
                localStorage.setItem('token', loginResponse.data.tokenValue);
                
                // 等待更长时间确保 token 完全写入
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 验证 token 是否成功保存
                const savedToken = localStorage.getItem('token');
                if (!savedToken) {
                    throw new Error('Token 保存失败');
                }
                
                status.value = '登录成功，准备跳转...';
                
                // 暂时跳过 getUserInfo，避免 401 问题
                // 用户信息可以在主页面再获取
                // try {
                //     const userInfoResponse = await getUserInfo();
                //     if (userInfoResponse.code === 0) {
                //         userStore.userInfo = userInfoResponse.data;
                //         status.value = '用户信息获取成功，正在跳转...';
                //     } else {
                //         status.value = '用户信息获取失败，但登录成功，正在跳转...';
                //     }
                // } catch (userInfoError) {
                //     console.warn('获取用户信息失败:', userInfoError);
                //     status.value = '用户信息获取失败，但登录成功，正在跳转...';
                // }
                
                await nextTick();
                
                // 确定跳转目标
                let redirect = route.query.r || '/';
                if (typeof redirect === 'string' && (redirect.includes('/oauth/callback') || redirect === '/login')) {
                    redirect = '/';
                }
                
                status.value = `登录成功，正在跳转到 ${redirect}...`;
                
                // 立即跳转，不再延迟
                router.replace(redirect);
            } else {
                status.value = '登录失败: ' + loginResponse.msg;
                message.error('登录失败：' + loginResponse.msg);
                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('登录过程出错:', error);
            status.value = '登录过程出错，请重试';
            message.error('登录失败，请重试');
            setTimeout(() => {
                router.replace('/login');
            }, 2000);
        }
    };
    
    handleRedirect();
}
</script>

<style scoped>
.logging {
    height: 100vh;
    align-items: center;
}
</style>