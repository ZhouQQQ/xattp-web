import { World } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '海外中控模拟',
  path: '/oversea-ecu-mock',
  description: '模拟海外业务中控的通信，用于调试和测试',
  tag: '内测',
  notice: '内测中，可能会出现连接中断/不存在/数据异常等问题，不保证长期在线可用',
  keywords: ['oversea', '海外', 'ecu', 'mock', '中控'],
  component: () => import('./oversea-ecu-mock.vue'),
  icon: World,
  createdAt: new Date('2026-08-11'),
});
