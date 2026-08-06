<script setup lang="ts">
import type { ContainerStats, DetailType } from '../types'

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
  <el-drawer
    :model-value="visible"
    :title="title"
    size="560px"
    class="container-detail-drawer"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-drawer-body">
      <div v-if="detailType === 'container'" class="stats-grid">
        <div class="stat-card">
          <span>CPU</span>
          <strong>{{ detailStats?.cpuPercent || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>内存</span>
          <strong>{{ detailStats?.memoryPercent || '--' }}</strong>
          <small>{{ detailStats?.memoryUsage || '--' }}</small>
        </div>
        <div class="stat-card">
          <span>网络 IO</span>
          <strong>{{ detailStats?.networkIO || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>块设备 IO</span>
          <strong>{{ detailStats?.blockIO || '--' }}</strong>
        </div>
        <div class="stat-card">
          <span>PIDs</span>
          <strong>{{ detailStats?.pids || '--' }}</strong>
        </div>
      </div>

      <div class="detail-json">
        <div class="detail-json__head">
          <strong>{{ detailType === 'container' ? 'Inspect 安全集' : '资源详情' }}</strong>
          <span v-if="detailType === 'container'">每 5 秒刷新资源快照</span>
        </div>
        <pre>{{ formatJson(detailData) }}</pre>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="less">
.detail-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 280px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  min-height: 94px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);

  span,
  small {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: var(--text-primary);
    font-size: 20px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  small {
    margin-top: 6px;
    font-weight: 600;
  }
}

.detail-json {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  background: #0b1220;
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
  max-height: 58vh;
  margin: 0;
  padding: 16px;
  overflow: auto;
  color: #e5edf6;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.65;
}
</style>
