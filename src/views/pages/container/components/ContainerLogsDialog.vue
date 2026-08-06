<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import type { ContainerItem } from '../types'

defineProps<{
  visible: boolean
  loading: boolean
  target: ContainerItem | null
  logsText: string
  tail: number
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'update:tail', value: number): void
  (event: 'refresh'): void
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
    <div class="logs-toolbar">
      <span>末尾日志行数</span>
      <el-input-number
        :model-value="tail"
        :min="1"
        :max="10000"
        :step="100"
        controls-position="right"
        @update:model-value="emit('update:tail', Number($event || 500))"
      />
      <el-button :icon="Refresh" :loading="loading" @click="emit('refresh')">刷新日志</el-button>
    </div>
    <div v-loading="loading" class="logs-box">
      <pre v-if="logsText">{{ logsText }}</pre>
      <el-empty v-else description="暂无日志" />
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.logs-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--text-secondary);

  span {
    font-size: 13px;
  }
}

.logs-box {
  min-height: calc(100vh - 220px);
  max-height: calc(100vh - 220px);
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

  .logs-box {
    min-height: 48vh;
    max-height: 48vh;
  }
}
</style>
