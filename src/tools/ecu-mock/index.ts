import { DeviceMobileVibration } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'ECU模拟',
  path: '/ecu-mock',
  description: 'ECU模拟工具，用于模拟ECU的通信',
  keywords: ['ecu', 'mock'],
  component: () => import('./ecu-mock.vue'),
  icon: DeviceMobileVibration,
  createdAt: new Date('2026-02-12'),
});