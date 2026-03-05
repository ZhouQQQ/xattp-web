import { Speakerphone } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '快捷语音位设置',
  path: '/quick-set-ecu-voice',
  description: '使用文本快速快捷设置你的中控语音位',
  keywords: ['ecu', 'voice', 'idx'],
  component: () => import('./ecu-voice-idx.vue'),
  icon: Speakerphone,
  createdAt: new Date('2026-03-04'),
});