<script setup lang="ts">
export interface SectionTabItem {
  key: string
  label: string
  disabled?: boolean
}

interface Props {
  items: SectionTabItem[]
  activeKey: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Section navigation'
})

const emit = defineEmits<{
  (e: 'update:activeKey', value: string): void
}>()

const activate = (item: SectionTabItem) => {
  if (item.disabled || item.key === props.activeKey) return
  emit('update:activeKey', item.key)
}
</script>

<template>
  <div class="section-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="section-tabs__item"
      :class="{ 'is-active': activeKey === item.key }"
      :disabled="item.disabled"
      role="tab"
      :aria-selected="activeKey === item.key"
      @click="activate(item)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped lang="less">
.section-tabs {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  gap: 10px;
  padding: 0 14px;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--surface-raised);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--border-strong);
  }
}

.section-tabs__item {
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
    right: 14px;
    bottom: 0;
    left: 14px;
    height: 3px;
    border-radius: 999px 999px 0 0;
    background: rgb(var(--primary-color));
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) {
    color: var(--text-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &.is-active {
    color: rgb(var(--primary-color));

    &::after {
      transform: scaleX(1);
    }
  }
}

@media (max-width: 768px) {
  .section-tabs {
    gap: 2px;
    padding: 0 8px;
  }

  .section-tabs__item {
    height: 54px;
    padding: 0 12px;
    font-size: 14px;

    &::after {
      right: 10px;
      left: 10px;
    }
  }
}
</style>
