import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

const MODULE_PATH = "/business_tool"

export function clear_realname_api(data) {
    return AlovaInstance.Post(`${BASE_PATH}${MODULE_PATH}/user/clear_realname`,data);
}

export function add_experience_user_api(data: { wx_app_id: string; wx_id: string }) {
    return AlovaInstance.Post(`${BASE_PATH}${MODULE_PATH}/add_experience_user`, data);
}
