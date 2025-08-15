import { Speakerphone } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.text-to-speech.title'),
  path: '/text-to-speech',
  description: translate('tools.text-to-speech.description'),
  keywords: ['text', 'speech', 'voice', 'audio', 'speak', 'tts', 'convert', 'sound', 'mp3', 'wav'],
  component: () => import('./text-to-speech.vue'),
  icon: Speakerphone,
  createdAt: new Date('2024-05-16'),
});