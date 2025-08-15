import { BatteryAutomotive } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.rental-switch.title'),
  path: '/rental-switch',
  description: '',
  keywords: ['rental', 'switch', 'qc', 'dz'],
  component: () => import('./rental-switch.vue'),
  icon: BatteryAutomotive,
  createdAt: new Date('2024-10-25'),
});