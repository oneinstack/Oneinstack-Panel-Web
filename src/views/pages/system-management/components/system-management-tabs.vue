<script setup lang="ts">
import i18n from '@/lang'

interface TabItem {
  key: string
  label: string
  labelKey?: string
}

interface Props {
  items: TabItem[]
  activeKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:activeKey', value: string): void
}>()

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const activate = (key: string) => {
  if (key === props.activeKey) return
  emit('update:activeKey', key)
}
</script>

<template>
  <div class="system-management-tabs" role="tablist" aria-label="System management sections">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="system-management-tabs__item"
      :class="{ 'is-active': activeKey === item.key }"
      role="tab"
      :aria-selected="activeKey === item.key"
      @click="activate(item.key)"
    >
      {{ item.labelKey ? t(item.labelKey, item.label) : item.label }}
    </button>
  </div>
</template>

<style scoped lang="less">
.system-management-tabs {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0 14px;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.system-management-tabs__item {
  position: relative;
  flex: 0 0 auto;
  height: 62px;
  padding: 0 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 0;
    height: 3px;
    border-radius: 999px 999px 0 0;
    background: rgb(var(--primary-color));
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  &:hover {
    color: var(--text-primary);
  }

  &.is-active {
    color: rgb(var(--primary-color));

    &::after {
      transform: scaleX(1);
    }
  }
}

@media (max-width: 768px) {
  .system-management-tabs {
    gap: 2px;
    padding: 0 8px;
  }

  .system-management-tabs__item {
    height: 54px;
    padding: 0 12px;
    font-size: 14px;

    &::after {
      left: 10px;
      right: 10px;
    }
  }
}
</style>
