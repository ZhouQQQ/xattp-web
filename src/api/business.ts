import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

const MODULE_PATH = "/business_tool"

export function clear_realname_api(data) {
    return AlovaInstance.Post(`${BASE_PATH}${MODULE_PATH}/user/clear_realname`,data);
}

