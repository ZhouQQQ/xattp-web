import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '短租中控模拟',
  path: '/rental-ecu-mock',
  description: '短租中控模拟,用于测试和调试短租中控的通信,暂时只支持共享协议中控',
  tag: '内测',
  notice: '内测中，可能会出现连接中断/不存在/数据异常等问题，不保证长期在线可用',
  keywords: ['rental', 'ecu', 'mock'],
  component: () => import('./rental-ecu-mock.vue'),
  icon: Devices,
  createdAt: new Date('2026-03-02'),
});