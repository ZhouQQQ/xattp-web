import { Table } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.muti-table-sql-gen.title'),
  path: '/muti-table-sql-gen',
  description: translate('tools.muti-table-sql-gen.description'),
  keywords: ['muti', 'table', 'sql', 'gen'],
  component: () => import('./muti-table-sql-gen.vue'),
  icon: Table,
  createdAt: new Date('2025-08-12'),
});