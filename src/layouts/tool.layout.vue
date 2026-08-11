<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import type { HeadObject } from '@vueuse/head';

import BaseLayout from './base.layout.vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import type { Tool } from '@/tools/tools.types';

const route = useRoute();

const head = computed<HeadObject>(() => ({
  title: `${route.meta.name} - 小安测试工具平台`,
  meta: [
    {
      name: 'description',
      content: route.meta?.description as string,
    },
    {
      name: 'keywords',
      content: ((route.meta.keywords ?? []) as string[]).join(','),
    },
  ],
}));
useHead(head);
const { t } = useI18n();

const i18nKey = computed<string>(() => route.path.trim().replace('/', ''));
const toolTitle = computed<string>(() => t(`tools.${i18nKey.value}.title`, String(route.meta.name)));
const toolDescription = computed<string>(() => t(`tools.${i18nKey.value}.description`, String(route.meta.description)));
const toolTag = computed<string | undefined>(() => route.meta?.tag as string | undefined);
const toolNotice = computed<string | undefined>(() => {
  const notice = route.meta?.notice;
  return typeof notice === 'string' && notice.trim() ? notice.trim() : undefined;
});
const isWideTool = computed(() => route.path === '/tenant-dashboard');
</script>

<template>
  <BaseLayout>
    <div class="tool-layout" :class="{ 'is-wide': isWideTool }">
      <div class="tool-header">
        <div flex flex-nowrap items-center justify-between>
          <n-h1 flex items-center gap-10px>
            {{ toolTitle }}
            <n-tag v-if="toolTag" size="small" type="warning">
              {{ toolTag }}
            </n-tag>
          </n-h1>
          <div>
            <FavoriteButton :tool="{ name: route.meta.name, path: route.path } as Tool" />
          </div>
        </div>

        <div class="separator" />

        <div class="description">
          {{ toolDescription }}
        </div>
        <n-alert v-if="toolNotice" class="tool-notice" type="warning" :show-icon="true">
          {{ toolNotice }}
        </n-alert>
      </div>
    </div>

    <div class="tool-content">
      <slot />
    </div>
  </BaseLayout>
</template>

<style lang="less" scoped>
.tool-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;

  ::v-deep(& > *) {
    flex: 0 1 80%;
  }
}

.tool-layout {
  max-width: 80%;
  margin: 0 auto;
  box-sizing: border-box;

  &.is-wide {
    max-width: 100%;

    .tool-content ::v-deep(& > *) {
      flex: 1 1 100%;
    }
  }

  .tool-header {
    padding: 18px 0;
    width: 100%;

    .n-h1 {
      opacity: 0.9;
      font-size: 32px;
      font-weight: 400;
      margin: 0;
      line-height: 1;
    }

    .separator {
      width: 200px;
      height: 1px;
      background: rgb(161, 161, 161);
      opacity: 0.2;
      margin: 1px 0;
    }

    .description {
      margin: 0;
      opacity: 0.7;
    }

    .tool-notice {
      margin-top: 10px;
    }
  }
}
</style>
