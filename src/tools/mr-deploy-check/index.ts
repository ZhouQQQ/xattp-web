import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
    name: 'MR部署检测',
    path: '/mr-deploy-check',
    description: '检测某个 MR 是否在指定环境（test/uat）部署过，使用镜像时间作为参考依据，有可能不准，仅供参考',
    keywords: ['mr', 'deploy', 'check', '部署', 'k8s'],
    component: () => import('./mr-deploy-check.vue'),
    icon: ArrowsShuffle,
    createdAt: new Date('2026-06-11'),
    tag: '实验',
});
