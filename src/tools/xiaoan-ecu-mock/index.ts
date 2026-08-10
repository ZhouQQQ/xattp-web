import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: '小安中控模拟',
    path: '/xiaoan-ecu-mock',
    description: '模拟小安协议中控的通信，用于调试和测试',
    tag: '内测',
    notice: '内测中，可能会出现连接中断/不存在/数据异常等问题，不保证长期在线可用',
    keywords: ['xiaoan', 'ecu', 'mock'],
    component: () => import('./xiaoan-ecu-mock.vue'),
    icon: Devices,
    createdAt: new Date('2026-02-28'),
});
