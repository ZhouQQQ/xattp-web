import type { Component } from 'vue';

export interface Tool {
  name: string
  path: string
  description: string
  tag?: string
  /** 工具页顶部提示文案（如内测说明），有值时展示 */
  notice?: string
  keywords: string[]
  component: () => Promise<Component>
  icon: Component
  redirectFrom?: string[]
  isNew: boolean
  createdAt?: Date
  allowUsers?: string[]
}

export interface ToolCategory {
  name: string
  components: Tool[]
}

export type ToolWithCategory = Tool & { category: string };
