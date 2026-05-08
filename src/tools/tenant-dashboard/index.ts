import { List } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '租户灰度看板',
  path: '/tenant-dashboard',
  description: '快速查看共享业务实时灰度组&正式的租户信息',
  keywords: ['tenant', 'dashboard'],
  component: () => import('./tenant-dashboard.vue'),
  icon: List,
  createdAt: new Date('2026-04-30'),
});