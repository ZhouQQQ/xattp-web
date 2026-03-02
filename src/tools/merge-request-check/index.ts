import { GitMerge } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'MR合并检查',
  path: '/merge-request-check',
  description: 'MR合并检查工具，用于检查MR合并状态，是否合并到指定分支',
  keywords: ['merge', 'request', 'check'],
  component: () => import('./merge-request-check.vue'),
  icon: GitMerge,
  createdAt: new Date('2026-01-27'),
});