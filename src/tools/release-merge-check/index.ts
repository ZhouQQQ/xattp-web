import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '发布计划MR检查',
  path: '/release-merge-check',
  description: 'TAPD发布计划MR统计工具，用于检查发布计划中需求和缺陷的MR合并状态',
  keywords: ['release', 'merge', 'check', 'tapd', 'mr', '统计'],
  component: () => import('./release-merge-check.vue'),
  icon: ArrowsShuffle,
  createdAt: new Date('2025-08-18'),
});