import { World } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
    name: translate('tools.oversea-switch.title'),
    path: '/oversea-switch',
    description: translate('tools.oversea-switch.description'),
    keywords: ['ebike', 'switch', 'qc', 'saas'],
    component: () => import('./oversea-switch.vue'),
    icon: World,
    createdAt: new Date('2025-07-19'),
});
