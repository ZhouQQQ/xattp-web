import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

const MODULE_PATH = "/business_tool"

export function clear_realname_api(data) {
    return AlovaInstance.Post(`${BASE_PATH}${MODULE_PATH}/user/clear_realname`,data);
}

export function add_experience_user_api(data: { wx_app_id: string; wx_id: string }) {
    return AlovaInstance.Post(`${BASE_PATH}${MODULE_PATH}/add_experience_user`, data);
}

export function tenant_all_api(env?: string) {
    const trimmedEnv = String(env ?? "").trim();
    if (trimmedEnv) {
        return AlovaInstance.Get(`${BASE_PATH}${MODULE_PATH}/tenant/all`, { params: { env: trimmedEnv } });
    }
    return AlovaInstance.Get(`${BASE_PATH}${MODULE_PATH}/tenant/all`);
}

export function tenant_gray_api() {
    return AlovaInstance.Get(`${BASE_PATH}${MODULE_PATH}/tenant/gray`);
}
