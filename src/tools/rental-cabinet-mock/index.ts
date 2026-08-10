import { Inbox } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '电柜模拟',
  path: '/rental-cabinet-mock',
  description: '模拟电柜设备，可视化仓门与电池状态，支持内联编辑所有参数',
  tag: '内测',
  notice: '内测中，可能会出现连接中断/不存在/数据异常等问题，不保证长期在线可用',
  keywords: ['rental', 'cabinet', 'mock', '电柜', '模拟'],
  component: () => import('./rental-cabinet-mock.vue'),
  icon: Inbox,
  createdAt: new Date('2026-03-12'),
});