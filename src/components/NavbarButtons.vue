<script setup lang="ts">
import { BrandGithub, BrandTwitter, InfoCircle, Moon, Sun, UserCircle } from '@vicons/tabler';
import { useStyleStore } from '@/stores/style.store';
import { useUserStore } from '@/stores/user.store';
import { getUserInfo } from '@/api/auth';
import { useRouter } from 'vue-router';
import { useCopy } from '@/composable/copy';
import { useMessage } from 'naive-ui';

const styleStore = useStyleStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();
const { isDarkTheme } = toRefs(styleStore);
const { copy } = useCopy({ text: '复制成功' });
const userOptions = [
    {
        label: '复制token',
        key: 'copyToken',
    },
    {
        label: '退出',
        key: 'logout',
    },
];

onMounted(() => {
    // 延迟获取用户信息，确保 token 已经生效
    setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // console.log('开始获取用户信息...');
            getUserInfo().then(res => {
                // console.log('getUserInfo 响应:', res);
                if (res && res.code === 0) {
                    userStore.userInfo = res.data;
                    // console.log('用户信息设置成功:', res.data);
                } else {
                    console.warn('getUserInfo 响应异常:', res);
                }
            }).catch(error => {
                console.warn('获取用户信息失败:', error);
                // 如果失败，1秒后重试一次
                setTimeout(() => {
                    const retryToken = localStorage.getItem('token');
                    if (retryToken) {
                        console.log('重试获取用户信息...');
                        getUserInfo().then(res => {
                            if (res && res.code === 0) {
                                userStore.userInfo = res.data;
                                console.log('重试成功，用户信息设置:', res.data);
                            }
                        }).catch(retryError => {
                            console.warn('重试获取用户信息仍失败:', retryError);
                        });
                    }
                }, 1000);
            });
        } else {
            console.log('没有找到 token，跳过获取用户信息');
        }
    }, 800); // 延迟 800ms 确保 token 生效
});





function handleSelect(key) {
    if (key == 'logout') {
        // console.log('logout');
        localStorage.removeItem("token");
        // 跳转到登录页，而不是直接跳钉钉
        router.push('/login');
    } else if (key == 'copyToken') {
        const token = localStorage.getItem("token");
        if (token) {
            copy(token);
        } else {
            message.warning('请刷新页面');
        }
    }
}

function handleXathClick() {
    if (typeof window !== 'undefined') {
        window.location.href = 'https://ttp.xiaoantech.com/xath/';
    }
}

//获取用户信息
</script>

<template>
    <!-- <c-tooltip :tooltip="$t('home.nav.github')" position="bottom">
      <c-button
        circle
        variant="text"
        href="https://github.com/CorentinTh/it-tools"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="$t('home.nav.githubRepository')"
      >
        <n-icon size="25" :component="BrandGithub" />
      </c-button>
    </c-tooltip>

    <c-tooltip :tooltip="$t('home.nav.twitter')" position="bottom">
      <c-button
        circle
        variant="text"
        href="https://twitter.com/ittoolsdottech"
        rel="noopener"
        target="_blank"
        :aria-label="$t('home.nav.twitterAccount')"
      >
        <n-icon size="25" :component="BrandTwitter" />
      </c-button>
    </c-tooltip> -->
    <c-tooltip :tooltip="isDarkTheme ? $t('home.nav.lightMode') : $t('home.nav.darkMode')" position="bottom">
        <c-button circle variant="text" :aria-label="$t('home.nav.mode')" @click="() => styleStore.toggleDark()">
            <n-icon v-if="isDarkTheme" size="25" :component="Sun" />
            <n-icon v-else size="25" :component="Moon" />
        </c-button>
    </c-tooltip>
    <c-tooltip position="bottom">
        <c-button variant="text" @click="handleXathClick">
            ⚙️小安测试助手（浏览器插件）
        </c-button>
    </c-tooltip>
    <c-tooltip position="bottom">
        <c-button variant="text" target="_blank" to="https://test-jenkins.xiaoantech.com">
            测试Jenkins
        </c-button>
    </c-tooltip>
    <c-tooltip position="bottom">
        <c-button variant="text" target="_blank" to="https://www.tapd.cn/51117884/prong/stories/add?workitem_type_id=1151117884001000289&category_id=1151117884001000868">
            ❓需求反馈
        </c-button>
    </c-tooltip>

    <n-dropdown :options="userOptions" @select="handleSelect">
        <c-button variant="text"> <span>😄{{ userStore.userInfo.nick }}</span></c-button>
    </n-dropdown>
</template>


<style lang="less" scoped>
.n-button {
    &:not(:last-child) {
        margin-right: 10px;
    }
}
</style>
