import { type MaybeRef, get, useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import _ from 'lodash';
import type { Tool, ToolCategory, ToolWithCategory } from './tools.types';
import { toolsWithCategory } from './index';
import { useUserStore } from '@/stores/user.store';

/** 是否展示该工具：allowUsers 为空则所有人可见；否则仅 userStore.userInfo.mobile 在 allowUsers 中时可见 */
function isToolVisible(tool: Tool, mobile: string | undefined): boolean {
  if (!tool.allowUsers || tool.allowUsers.length === 0) return true;
  return mobile != null && mobile !== '' && tool.allowUsers.includes(mobile);
}

export const useToolStore = defineStore('tools', () => {
  const userStore = useUserStore();
  const favoriteToolsName = useStorage('favoriteToolsName', []) as Ref<string[]>;
  const { t } = useI18n();

  const tools = computed<ToolWithCategory[]>(() => {
    const mobile = userStore.userInfo?.mobile;
    const filtered = toolsWithCategory.filter((t) => isToolVisible(t, mobile));
    return filtered.map((tool) => {
      const toolI18nKey = tool.path.replace(/\//g, '');

      return ({
        ...tool,
        path: tool.path,
        name: t(`tools.${toolI18nKey}.title`, tool.name),
        description: t(`tools.${toolI18nKey}.description`, tool.description),
        category: t(`tools.categories.${tool.category.toLowerCase()}`, tool.category),
      });
    });
  });

  const toolsByCategory = computed<ToolCategory[]>(() => {
    return _.chain(tools.value)
      .groupBy('category')
      .map((components, name, path) => ({
        name,
        path,
        components,
      }))
      .value();
  });

  const favoriteTools = computed(() => {
    return favoriteToolsName.value
      .map(favoriteName => tools.value.find(({ name, path }) => name === favoriteName || path === favoriteName))
      .filter(Boolean) as ToolWithCategory[]; // cast because .filter(Boolean) does not remove undefined from type
  });

  return {
    tools,
    favoriteTools,
    toolsByCategory,
    newTools: computed(() => tools.value.filter(({ isNew }) => isNew)),

    addToolToFavorites({ tool }: { tool: MaybeRef<Tool> }) {
      favoriteToolsName.value.push(get(tool).path);
    },

    removeToolFromFavorites({ tool }: { tool: MaybeRef<Tool> }) {
      favoriteToolsName.value = favoriteToolsName.value.filter(name => get(tool).name !== name && get(tool).path !== name);
    },

    isToolFavorite({ tool }: { tool: MaybeRef<Tool> }) {
      return favoriteToolsName.value.includes(get(tool).name)
        || favoriteToolsName.value.includes(get(tool).path);
    },
  };
});
