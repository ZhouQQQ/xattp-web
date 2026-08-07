import { DeviceDesktopAnalytics } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: '业务接口巡检',
    path: '/service-status-board',
    tag: 'demo',
    description: '共享业务业务接口巡检，主要关注业务接口可用性',
    keywords: ['service', 'status', '巡检', '大屏', '共享'],
    component: () => import('./service-status-board.vue'),
    icon: DeviceDesktopAnalytics,
    createdAt: new Date('2026-08-05'),
});
