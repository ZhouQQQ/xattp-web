import { Bike } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.ebike-switch.title'),
  path: '/ebike-switch',
  description: translate('tools.ebike-switch.description'),
  keywords: ['ebike', 'switch', 'qc', 'saas'],
  component: () => import('./ebike-switch.vue'),
  icon: Bike,
  createdAt: new Date('2024-10-24'),
});
