import { AlovaInstance } from '@/utils/alova';

const BASE_PATH = "/xattp-server"

export function sqlExecuteApi(data) {
    return AlovaInstance.Post(`${BASE_PATH}/db_tool/sql/execute`,data);
}

