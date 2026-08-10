<script setup lang="ts">
import i18n from '@/lang'

interface Item {
  name: string
  nameKey?: string
  index: number
  dot?: boolean
  [key: string]: any
}

interface Props {
  list: Item[]
  activeIndex: number
  clickActive: (item: Item) => void
}

defineProps<Props>()

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}
</script>

<template>
  <div class="head-tabs">
    <div
      v-for="item in list"
      :key="item.index"
      class="item"
      :class="{ active: activeIndex === item.index }"
      @click="clickActive(item)"
    >
      <el-badge :is-dot="item.dot" >{{ item.nameKey ? t(item.nameKey, item.name) : item.name }}</el-badge>
    </div>
  </div>
</template>

<style scoped lang="less">
.head-tabs {
  padding: 5px;
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 13px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);

  .item {
    min-width: 94px;
    height: 38px;
    padding: 0 14px;
    border-radius: 9px;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    font-size: 13px;
    font-weight: 560;
    white-space: nowrap;
    transition: all 0.18s ease;

    &:hover {
      color: var(--text-primary);
      background: var(--surface-subtle);
    }

    &.active {
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.1);
      box-shadow: inset 0 0 0 1px rgba(var(--primary-color), 0.08);
      font-weight: 650;
    }
  }
}
</style>
