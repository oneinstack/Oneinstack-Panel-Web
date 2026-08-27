<script setup lang="ts">
import { useAppStore } from '@/stores/modules/app';
import { toRefs } from 'vue'
import { scheduleInteractionRecovery } from '@/utils/theme'

const sapp = useAppStore()

const { theme } = toRefs(sapp)
sapp.setTheme(theme.value)

const colors = {
  light: {
    default: ['#c8c8c8'],
    select: ['#ffffff']
  },
  dark: {
    default: ['#b7b7b7'],
    select: ['#212e3d']
  }
}

const toggleTheme = (event: MouseEvent) => {
  event.preventDefault()
  const nextTheme = theme.value === 'light' ? 'dark' : 'light'
  sapp.setTheme(nextTheme)
  scheduleInteractionRecovery()
}
</script>

<template>
  <div class="theme-switch" @click="toggleTheme">
    <div :class="{ active: theme === 'light' }" class="theme-switch__core">
      <v-s-icon name="day" :color="colors[theme][theme === 'light' ? 'select' : 'default']" size="16" />
    </div>
    <div :class="{ active: theme === 'dark' }" class="theme-switch__core">
      <v-s-icon name="night" :color="colors[theme][theme === 'dark' ? 'select' : 'default']" size="16" />
    </div>
  </div>
</template>

<style scoped lang="less">
.theme-switch {
  width: 66px;
  height: 36px;
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: 11px;
  background: var(--surface-subtle);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &__core {
    width: 29px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;

    &.active {
      background: rgb(var(--primary-color));
      box-shadow: 0 4px 10px rgba(var(--primary-color), 0.2);
    }

    img {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
