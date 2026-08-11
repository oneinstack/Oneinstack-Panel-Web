<script setup lang="ts">
import { Download, Refresh } from '@element-plus/icons-vue'
import type { ContainerItem } from '../types'

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
    :title="`${target?.Names || '容器'} 日志`"
    size="880px"
    cancel-text="关闭"
    :show-confirm="false"
    :on-close="() => emit('update:visible', false)"
  >
    <div class="logs-drawer-body">
      <div class="logs-toolbar">
        <div class="toolbar-field">
          <span>过滤</span>
          <el-select
            :model-value="timeFilter"
            placeholder="过滤"
            @update:model-value="emit('update:timeFilter', String($event || 'all'))"
          >
            <el-option label="全部" value="all" />
            <el-option label="最近一天" value="24h" />
            <el-option label="最近 4 小时" value="4h" />
            <el-option label="最近 1 小时" value="1h" />
            <el-option label="最近 10 分钟" value="10m" />
            <el-option label="自定义时间" value="custom" />
          </el-select>
        </div>
        <div v-if="timeFilter === 'custom'" class="toolbar-field toolbar-field--range">
          <span>时间</span>
          <el-date-picker
            :model-value="customRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            @update:model-value="emit('update:customRange', ($event || []) as [Date, Date] | [])"
          />
        </div>
        <div class="toolbar-field">
          <span>条数</span>
          <el-select
            :model-value="tail"
            placeholder="条数"
            @update:model-value="emit('update:tail', Number($event || 100))"
          >
            <el-option label="所有" :value="10000" />
            <el-option label="100" :value="100" />
            <el-option label="200" :value="200" />
            <el-option label="500" :value="500" />
            <el-option label="1000" :value="1000" />
          </el-select>
        </div>
        <el-switch
          :model-value="timestamps"
          inline-prompt
          active-text="时间戳"
          inactive-text="原始"
          @update:model-value="emit('update:timestamps', Boolean($event))"
        />
        <el-button :icon="Refresh" :loading="loading" @click="emit('refresh')">刷新日志</el-button>
        <el-button :icon="Download" :loading="downloading" @click="emit('download')">下载日志</el-button>
      </div>
      <div v-loading="loading" class="logs-box">
        <pre v-if="logsText">{{ logsText }}</pre>
        <el-empty v-else description="暂无日志" />
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
