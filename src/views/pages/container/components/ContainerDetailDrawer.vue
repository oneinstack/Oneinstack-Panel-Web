<script setup lang="ts">
import type { ContainerStats, DetailType } from '../types'
import i18n from '@/lang'

defineProps<{
  visible: boolean
  title: string
  loading: boolean
  detailType: DetailType
  detailData: Record<string, any> | null
  detailStats: ContainerStats | null
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'close'): void
}>()

const formatJson = (data: any) => {
  if (!data) return '{}'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="title"
    size="560px"
    class="container-detail-drawer"
    :cancel-text="i18n.t('container.resourceDetail.close')"
    :show-confirm="false"
    :on-close="handleClose"
    body-mode="compact"
  >
    <div v-loading="loading" class="detail-drawer-body">
      <div v-if="detailType === 'container'" class="stats-grid">
        <div class="stat-card">
          <span>CPU</span>
          <strong>{{ detailStats?.cpuPercent || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>{{ i18n.t('container.resourceDetail.memory') }}</span>
          <strong>{{ detailStats?.memoryPercent || '--' }}</strong>
          <small>{{ detailStats?.memoryUsage || '--' }}</small>
        </div>
        <div class="stat-card">
          <span>{{ i18n.t('container.resourceDetail.networkIo') }}</span>
          <strong>{{ detailStats?.networkIO || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>{{ i18n.t('container.resourceDetail.blockIo') }}</span>
          <strong>{{ detailStats?.blockIO || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>PIDs</span>
          <strong>{{ detailStats?.pids || '--' }}</strong>
        </div>
      </div>

      <div class="detail-json">
        <div class="detail-json__head">
          <strong>{{ i18n.t(detailType === 'container' ? 'container.resourceDetail.inspect' : 'container.resourceDetail.details') }}</strong>
          <span v-if="detailType === 'container'">{{ i18n.t('container.resourceDetail.refreshTip') }}</span>
        </div>
        <pre>{{ formatJson(detailData) }}</pre>
      </div>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.detail-drawer-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  min-height: 104px;
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);

  span,
  small {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  small {
    margin-top: 6px;
    font-weight: 600;
  }
}

.detail-json {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
  background: #0b1220;
  flex: 1;
  min-height: 0;
}

.detail-json__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  color: #e5edf6;

  span {
    color: #94a3b8;
    font-size: 12px;
  }
}

.detail-json pre {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 18px 18px 28px;
  overflow: auto;
  color: #e5edf6;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.65;
}

@media (max-width: 768px) {
  .detail-drawer-body {
    min-height: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .detail-json pre {
    padding-bottom: 22px;
  }
}
</style>
