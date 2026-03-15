import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: '小安中控模拟（内测）',
    path: '/xiaoan-ecu-mock',
    description: '模拟小安协议中控的通信，用于调试和测试',
    keywords: ['xiaoan', 'ecu', 'mock'],
    component: () => import('./xiaoan-ecu-mock.vue'),
    icon: Devices,
    createdAt: new Date('2026-02-28'),
});
