import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

export function mergeRequestCheckAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/gitlab/mr/check`,data);
}