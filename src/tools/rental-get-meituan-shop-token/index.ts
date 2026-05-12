import { Key } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '获取美团店铺token',
  path: '/rental-get-meituan-shop-token',
  description: '输入美团店铺ID，查询店铺名称与 access_token',
  keywords: ['rental', 'meituan', '美团', '店铺', 'token', '短租'],
  component: () => import('./rental-get-meituan-shop-token.vue'),
  icon: Key,
  createdAt: new Date('2026-05-09'),
});