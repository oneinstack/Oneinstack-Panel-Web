<script setup lang="ts">
import type { ContainerItem } from '../types'

defineProps<{
  visible: boolean
  loading: boolean
  target: ContainerItem | null
  logsText: string
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
}>()
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="860px"
    :title="`${target?.Names || '容器'} 日志`"
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" class="logs-box">
      <pre v-if="logsText">{{ logsText }}</pre>
      <el-empty v-else description="暂无日志" />
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.logs-box {
  min-height: 360px;
  max-height: 62vh;
  overflow: auto;
  border-radius: 8px;
  background: #0b1220;
  color: #e5edf6;

  pre {
    margin: 0;
    padding: 16px;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
  }
}
</style>
