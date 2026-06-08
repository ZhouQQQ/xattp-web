import { CodePlus } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: 'JSON 格式化',
    path: '/json-beautify',
    description: '又双叒叕一款JSON 格式化工具',
    keywords: ['json', 'beautify', 'format', 'minify', 'escape', '格式化', '压缩', '转义'],
    component: () => import('./json-beautify.vue'),
    icon: CodePlus,
    createdAt: new Date('2026-05-24'),
});
