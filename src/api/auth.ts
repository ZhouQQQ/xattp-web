import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-auth/api/v1/auth"

/**
 * @description: 钉钉登录
 */
export function login(params) {
    return AlovaInstance.Get(`${BASE_PATH}/login`,{params});
}

export function getUserInfo(params) {
    return AlovaInstance.Get(`${BASE_PATH}/info`,{params});
}