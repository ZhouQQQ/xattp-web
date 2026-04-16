import { UserPlus } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.add-tester.title'),
  path: '/add-tester',
  description: translate('tools.add-tester.description'),
  keywords: ['add', 'tester', '体验', '微信小程序', 'wxappid'],
  component: () => import('./add-tester.vue'),
  icon: UserPlus,
  createdAt: new Date('2026-04-10'),
});