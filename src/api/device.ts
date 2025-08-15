import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

export function queryEBikeAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/ebike/device/info`,{params});
}

export function switchEbikeAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/ebike/device/switch`,data);
}

export function cmdEbikeAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/ebike/device/cmd`,data);
}

export function queryRentalAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/rental/device/info`,{params});
}

export function switchRentalAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/rental/device/switch`,data);
}

export function getDeviceLogAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/device/log/get`,{params});
}



export function queryOverseaAPI(params) {
    return AlovaInstance.Get(`${BASE_PATH}/oversea/device/info`,{params});
}

export function switchOverseaAPI(data) {
    return AlovaInstance.Post(`${BASE_PATH}/oversea/device/switch`,data);
}