import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '短租中控模拟（内测）',
  path: '/rental-ecu-mock',
  description: '短租车辆中控模拟',
  keywords: ['rental', 'ecu', 'mock'],
  component: () => import('./rental-ecu-mock.vue'),
  icon: Devices,
  createdAt: new Date('2026-03-02'),
});