import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: 'ECU TOOLS ',
    path: '/ecu-tool',
    tag: '实验',
    description: '使用AI逆向自 ECU_TOOLS v2.5.2客户端「常用查询」页：向中控透传命令并查看响应',
    keywords: ['ecu', '中控', '常用查询', '透传', '指令', 'xiaoan'],
    component: () => import('./ecu-tool.vue'),
    icon: Devices,
    createdAt: new Date('2026-10-20'),
});