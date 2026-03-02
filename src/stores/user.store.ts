import { defineStore } from 'pinia';
import { login } from '@/api/auth';

export interface UserInfo {
  mobile?: string;
  [key: string]: unknown;
}

export const useUserStore = defineStore('user', {
    state: (): { userInfo: UserInfo } => {
        return {
            userInfo: {},
        };
    },
    actions: {

    },
});
