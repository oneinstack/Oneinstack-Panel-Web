<script setup lang="ts">
import { Download, Refresh } from '@element-plus/icons-vue'
import type { ContainerItem } from '../types'
import i18n from '@/lang'

const t = i18n.t as any

defineProps<{
  visible: boolean
  loading: boolean
  downloading: boolean
  target: ContainerItem | null
  logsText: string
  tail: number
  timeFilter: string
  customRange: [Date, Date] | []
  timestamps: boolean
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'update:tail', value: number): void
  (event: 'update:timeFilter', value: string): void
  (event: 'update:customRange', value: [Date, Date] | []): void
  (event: 'update:timestamps', value: boolean): void
  (event: 'refresh'): void
  (event: 'download'): void
}>()
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="t('container.logViewer.title', { name: target?.Names || t('container.logViewer.containerFallback') })"
    size="880px"
    :cancel-text="t('container.logViewer.close')"
    :show-confirm="false"
    :on-close="() => emit('update:visible', false)"
  >
    <div class="logs-drawer-body">
      <div class="logs-toolbar">
        <div class="toolbar-field">
          <span>{{ t('container.logViewer.filter') }}</span>
          <el-select
            :model-value="timeFilter"
            :placeholder="t('container.logViewer.filter')"
            @update:model-value="emit('update:timeFilter', String($event || 'all'))"
          >
            <el-option :label="t('container.logViewer.all')" value="all" />
            <el-option :label="t('container.logViewer.lastDay')" value="24h" />
            <el-option :label="t('container.logViewer.last4Hours')" value="4h" />
            <el-option :label="t('container.logViewer.lastHour')" value="1h" />
            <el-option :label="t('container.logViewer.last10Minutes')" value="10m" />
            <el-option :label="t('container.logViewer.customTime')" value="custom" />
          </el-select>
        </div>
        <div v-if="timeFilter === 'custom'" class="toolbar-field toolbar-field--range">
          <span>{{ t('container.logViewer.time') }}</span>
          <el-date-picker
            :model-value="customRange"
            type="datetimerange"
            :start-placeholder="t('container.logViewer.startTime')"
            :end-placeholder="t('container.logViewer.endTime')"
            :range-separator="t('container.logViewer.rangeSeparator')"
            @update:model-value="emit('update:customRange', ($event || []) as [Date, Date] | [])"
          />
        </div>
        <div class="toolbar-field">
          <span>{{ t('container.logViewer.count') }}</span>
          <el-select
            :model-value="tail"
            :placeholder="t('container.logViewer.count')"
            @update:model-value="emit('update:tail', Number($event || 100))"
          >
            <el-option :label="t('container.logViewer.allCount')" :value="10000" />
            <el-option label="100" :value="100" />
            <el-option label="200" :value="200" />
            <el-option label="500" :value="500" />
            <el-option label="1000" :value="1000" />
          </el-select>
        </div>
        <el-switch
          :model-value="timestamps"
          inline-prompt
          :active-text="t('container.logViewer.timestamp')"
          :inactive-text="t('container.logViewer.raw')"
          @update:model-value="emit('update:timestamps', Boolean($event))"
        />
        <el-button :icon="Refresh" :loading="loading" @click="emit('refresh')">{{ t('container.logViewer.refresh') }}</el-button>
        <el-button :icon="Download" :loading="downloading" @click="emit('download')">{{ t('container.logViewer.download') }}</el-button>
      </div>
      <div v-loading="loading" class="logs-box">
        <pre v-if="logsText">{{ logsText }}</pre>
        <el-empty v-else :description="t('container.logViewer.empty')" />
      </div>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.logs-drawer-body {
  // height: calc(100vh - 172px);
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.logs-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--text-secondary);

  span {
    font-size: 13px;
  }
}

.toolbar-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  :deep(.el-select) {
    width: 220px;
  }

  :deep(.el-date-editor.el-input__wrapper),
  :deep(.el-date-editor.el-range-editor) {
    min-height: 42px;
  }

  :deep(.el-select__wrapper) {
    min-height: 42px;
  }
}

.toolbar-field--range {
  :deep(.el-date-editor) {
    width: 360px;
  }
}

.logs-box {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  border-radius: 14px;
  background: #0b1220;
  color: #e5edf6;
  border: 1px solid rgba(148, 163, 184, 0.18);

  pre {
    margin: 0;
    padding: 18px;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
  }
}

@media (max-width: 768px) {
  .logs-toolbar {
    justify-content: flex-start;
  }

  .toolbar-field {
    width: 100%;
    align-items: flex-start;
    flex-direction: column;

    :deep(.el-select),
    :deep(.el-date-editor) {
      width: 100%;
    }
  }

  .logs-box {
    min-height: 0;
  }
}
</style>
