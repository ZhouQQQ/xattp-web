import { UserOff } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.clear-realname.title'),
  path: '/clear-realname',
  description: translate('tools.clear-realname.description'),
  keywords: ['clear', 'realname', '实名', '共享',"清除实名"],
  component: () => import('./clear-realname.vue'),
  icon: UserOff,
  createdAt: new Date('2025-12-24'),
});