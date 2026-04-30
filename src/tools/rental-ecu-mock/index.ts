import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '短租中控模拟',
  path: '/rental-ecu-mock',
  description: '短租中控模拟,用于测试和调试短租中控的通信,暂时只支持共享协议中控',
  tag: '内测',
  keywords: ['rental', 'ecu', 'mock'],
  component: () => import('./rental-ecu-mock.vue'),
  icon: Devices,
  createdAt: new Date('2026-03-02'),
});