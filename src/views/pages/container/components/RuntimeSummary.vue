<script setup lang="ts">
import type { RuntimeInfo } from '../types'
import i18n from '@/lang'

defineProps<{
  runtime: RuntimeInfo | null
  runtimeLoading: boolean
  runningContainers: number
  containerCount: number
}>()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
</script>

<template>
  <section class="runtime-grid" v-loading="runtimeLoading">
    <div class="metric-card">
      <div class="metric-card__label">{{ t('container.dockerClient', 'Docker Client') }}</div>
      <strong>{{ runtime?.dockerVersion || '--' }}</strong>
      <span>{{ t('container.clientVersion', 'Client version') }}</span>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">{{ t('container.dockerServer', 'Docker Server') }}</div>
      <strong>{{ runtime?.serverVersion || '--' }}</strong>
      <span>{{ t('container.serverVersion', 'Server version') }}</span>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">{{ t('container.composeRuntime', 'Compose') }}</div>
      <strong>{{ runtime?.composeVersion || '--' }}</strong>
      <span>{{ t('container.composeRuntimeLabel', 'Compose runtime') }}</span>
    </div>
    <div class="metric-card metric-card--accent">
      <div class="metric-card__label">{{ t('container.runningContainers', 'Running containers') }}</div>
      <strong>{{ runningContainers }} / {{ containerCount }}</strong>
      <span>{{ t('container.currentContainerStatus', 'Current container status') }}</span>
    </div>
  </section>
</template>

<style scoped lang="less">
.runtime-grid {
  width: 100%;
  max-width: none;
  margin: 0 0 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 106px;
  padding: 18px 20px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  &__label {
    color: var(--text-secondary);
    font-weight: 600;
    margin-bottom: 10px;
  }

  span {
    display: block;
    color: var(--text-secondary);
    margin-top: 6px;
    font-size: 12px;
  }

  strong {
    font-size: 22px;
    line-height: 1.2;
  }

  &--accent {
    background: color-mix(in srgb, var(--accent-color) 8%, var(--surface-card));
  }
}

@media (max-width: 980px) {
  .runtime-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
