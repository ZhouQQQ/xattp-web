import { defineStore } from 'pinia';
import { login } from '@/api/auth';

export const useUserStore = defineStore('user', {
    state: () => {
        return {
            userInfo:{}
        };
    },
    actions: {

    },
});
