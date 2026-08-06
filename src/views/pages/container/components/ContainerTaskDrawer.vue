<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import containerTaskStore from '@/sstore/containerTask'

const props = defineProps<{
  modelValue: boolean
  taskId: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'finished'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const task = computed(() => containerTaskStore.tasks[props.taskId])
const logs = computed(() => containerTaskStore.logs[props.taskId] || '等待 Docker 输出...')
const terminal = computed(() => containerTaskStore.isTerminal(task.value?.status))
const failed = computed(() => ['failed', 'interrupted'].includes(task.value?.status))
const cancelable = computed(() => !!task.value && !terminal.value && !task.value.cancelRequested)
const autoScroll = ref(true)
const logElement = ref<HTMLElement>()
const downloading = ref(false)

const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    pull: '拉取镜像',
    build: '构建镜像',
    create: '创建容器'
  }
  return labels[task.value?.operation || ''] || '容器任务'
})

const statusText = computed(() => {
  const labels: Record<string, string> = {
    queued: '排队中',
    resolving: '正在解析参数',
    pulling: '正在拉取镜像',
    building: '正在构建镜像',
    creating: '正在创建容器',
    verifying: '正在验证结果',
    canceling: '正在取消',
    succeeded: `${operationLabel.value}成功`,
    failed: `${operationLabel.value}失败`,
    canceled: '已取消',
    interrupted: '任务已中断'
  }
  return labels[task.value?.status || ''] || task.value?.status || '正在加载'
})

const progressStatus = computed(() => {
  if (task.value?.status === 'succeeded') return 'success' as const
  if (failed.value) return 'exception' as const
  return undefined
})

const phaseLabel = (phase: string) => ({
  queued: '任务排队',
  resolving: '参数检查',
  pulling: '拉取镜像',
  building: '构建镜像',
  creating: '创建容器',
  verifying: '验证结果'
}[phase] || phase)

const stageDefinitions = computed(() => {
  if (task.value?.operation === 'pull') {
    return [
      { key: 'resolving', name: '解析镜像参数' },
      { key: 'pulling', name: '拉取镜像层' },
      { key: 'verifying', name: '验证镜像结果' }
    ]
  }
  if (task.value?.operation === 'build') {
    return [
      { key: 'resolving', name: '检查构建参数' },
      { key: 'building', name: '执行 Docker 构建' },
      { key: 'verifying', name: '验证镜像标签' }
    ]
  }
  return [
    { key: 'resolving', name: '检查容器参数' },
    { key: 'pulling', name: '准备所需镜像' },
    { key: 'creating', name: '创建容器实例' },
    { key: 'verifying', name: '验证容器结果' }
  ]
})

const stages = computed(() => {
  const currentIndex = stageDefinitions.value.findIndex((stage) => stage.key === task.value?.phase)
  return stageDefinitions.value.map((stage, index) => ({
    ...stage,
    active: !terminal.value && index === currentIndex,
    done: task.value?.status === 'succeeded' || (currentIndex > index && currentIndex !== -1)
  }))
})

const summaryItems = computed(() => [
  { label: '任务 ID', value: task.value?.id || '-' },
  { label: '操作类型', value: operationLabel.value },
  { label: '当前阶段', value: phaseLabel(task.value?.phase || '-') },
  { label: '目标资源', value: task.value?.resourceName || task.value?.containerId || '-' },
  { label: '错误码', value: task.value?.errorCode || '-' }
])

watch(
  () => [props.modelValue, props.taskId],
  async ([isVisible]) => {
    if (!isVisible || !props.taskId) return
    await containerTaskStore.track(props.taskId).catch(() => undefined)
    await containerTaskStore.fetchLog(props.taskId).catch(() => undefined)
  },
  { immediate: true }
)

watch(logs, async () => {
  if (!autoScroll.value) return
  await nextTick()
  if (logElement.value) logElement.value.scrollTop = logElement.value.scrollHeight
})

watch(
  () => task.value?.status,
  (status, previous) => {
    if (previous && !containerTaskStore.isTerminal(previous) && containerTaskStore.isTerminal(status)) {
      emit('finished')
    }
  }
)

const cancelTask = async () => {
  if (!props.taskId) return
  try {
    await ElMessageBox.confirm('取消后会尝试停止当前 Docker 操作，任务会保留日志和最终状态。', '取消容器任务', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '继续执行'
    })
    await containerTaskStore.cancel(props.taskId)
    ElMessage.success('已提交取消请求')
  } catch {
    // Keep task running.
  }
}

const downloadLog = async () => {
  if (!props.taskId || downloading.value) return
  downloading.value = true
  try {
    await containerTaskStore.downloadLog(props.taskId)
    ElMessage.success('完整任务日志已开始下载')
  } catch (error: any) {
    ElMessage.error(error?.message || '下载任务日志失败')
  } finally {
    downloading.value = false
  }
}

onBeforeUnmount(() => {
  if (props.taskId && terminal.value) containerTaskStore.close(props.taskId)
})
</script>

<template>
  <el-drawer
    v-model="visible"
    class="container-task-drawer"
    size="840px"
    :show-close="false"
    :close-on-click-modal="terminal"
    :destroy-on-close="false"
  >
    <template #header>
      <div class="task-header">
        <button type="button" class="task-back" @click="visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <div class="task-heading">
          <div class="task-title">
            <strong>{{ task?.resourceName || operationLabel }}</strong>
            <span>{{ operationLabel }}</span>
          </div>
        </div>
        <el-tag :type="task?.status === 'succeeded' ? 'success' : failed ? 'danger' : 'primary'" effect="plain" round>
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <div v-if="task" class="task-content">
      <section class="overview">
        <div class="overview-main">
          <div>
            <span class="overview-label">当前进度 · {{ phaseLabel(task.phase || task.status) }}</span>
            <h3>{{ statusText }}</h3>
            <p>{{ task.message || '任务已创建，正在等待 Docker 输出。' }}</p>
          </div>
          <div class="progress-card">
            <small>完成度</small>
            <strong>{{ task.progress || 0 }}%</strong>
            <span>{{ terminal ? '任务已结束' : '实时刷新中' }}</span>
          </div>
        </div>
        <el-progress
          :percentage="task.progress || 0"
          :status="progressStatus"
          :stroke-width="10"
          :show-text="false"
          :indeterminate="task.phaseProgress == null && !terminal"
        />
      </section>

      <section class="stage-section">
        <div class="stage-list">
          <div
            v-for="(stage, index) in stages"
            :key="stage.key"
            class="stage"
            :class="{ active: stage.active, done: stage.done }"
          >
            <span>{{ stage.done ? '✓' : index + 1 }}</span>
            <div>
              <small>STEP {{ String(index + 1).padStart(2, '0') }}</small>
              <strong>{{ stage.name }}</strong>
            </div>
          </div>
        </div>
      </section>

      <el-alert
        v-if="failed"
        type="error"
        show-icon
        :closable="false"
        :title="task.errorMessage || task.message || '容器任务执行失败'"
      />

      <section class="task-grid">
        <section class="log-panel">
          <div class="log-toolbar">
            <div>
              <strong>实时任务日志</strong>
              <span>Docker 输出会持续追加到这里。</span>
            </div>
            <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
          </div>
          <pre ref="logElement" class="task-log">{{ logs }}</pre>
        </section>
        <aside class="summary-panel">
          <div class="summary-card">
            <small>当前结果</small>
            <strong>{{ statusText }}</strong>
            <p>{{ task.errorMessage || task.message || '暂无附加说明' }}</p>
          </div>
          <div v-for="item in summaryItems" :key="item.label" class="summary-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </aside>
      </section>
    </div>
    <el-skeleton v-else :rows="8" animated />

    <template #footer>
      <div class="task-actions">
        <el-button :loading="downloading" @click="downloadLog">下载完整日志</el-button>
        <div>
          <el-button v-if="cancelable" type="danger" plain @click="cancelTask">取消任务</el-button>
          <el-button :type="failed && !cancelable ? 'info' : 'primary'" :plain="failed && !cancelable" @click="visible = false">
            {{ terminal ? '完成' : '后台运行' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.task-header,
.task-actions,
.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.task-header {
  min-width: 0;
  width: 100%;
  gap: 24px;
}

.task-back {
  min-height: 38px;
  padding: 0 20px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;

  &:hover {
    color: rgb(var(--primary-color));
  }
}

.task-heading {
  min-width: 0;
  flex: 1;
}

.task-title {
  display: flex;
  align-items: baseline;
  gap: 10px;

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    padding: 5px 10px;
    border-radius: 999px;
    color: var(--text-secondary);
    background: var(--surface-subtle);
    font-size: 12px;
    font-weight: 700;
  }
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview,
.stage-section,
.log-panel,
.summary-panel {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
}

.overview {
  padding: 18px;
}

.overview-main {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;

  h3,
  p {
    margin: 0;
  }

  h3 {
    margin-top: 8px;
    color: var(--text-primary);
    font-size: 24px;
  }

  p {
    margin-top: 8px;
    color: var(--text-tertiary);
    line-height: 1.6;
  }
}

.overview-label {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.progress-card {
  min-width: 120px;
  padding: 14px;
  border-radius: 8px;
  background: var(--surface-subtle);
  text-align: right;

  small,
  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin: 6px 0;
    color: rgb(var(--primary-color));
    font-size: 28px;
  }
}

.stage-section {
  padding: 14px;
}

.stage-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stage {
  min-height: 76px;
  padding: 12px;
  display: flex;
  gap: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-subtle);

  > span {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--surface-card);
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 800;
  }

  small,
  strong {
    display: block;
  }

  small {
    color: var(--text-placeholder);
    font-size: 10px;
  }

  strong {
    margin-top: 5px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  &.active {
    border-color: rgba(var(--primary-color), 0.35);
    background: rgba(var(--primary-color), 0.06);
  }

  &.done > span {
    color: #fff;
    background: rgb(var(--success-color));
  }
}

.task-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
  gap: 16px;
}

.log-panel {
  min-height: 430px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-toolbar {
  min-height: 58px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border-subtle);

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.task-log {
  flex: 1;
  margin: 0;
  padding: 16px;
  overflow: auto;
  color: #dbeafe;
  background: #0f172a;
  font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.summary-panel {
  padding: 14px;
}

.summary-card,
.summary-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-subtle);
}

.summary-card {
  margin-bottom: 10px;

  small,
  p {
    color: var(--text-tertiary);
  }

  strong {
    display: block;
    margin-top: 6px;
    color: var(--text-primary);
    font-size: 18px;
  }
}

.summary-item {
  margin-top: 8px;

  span,
  strong {
    display: block;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    margin-top: 5px;
    color: var(--text-primary);
    word-break: break-all;
  }
}

.task-actions {
  padding: 18px 36px;
}

:deep(.container-task-drawer .el-drawer__header) {
  min-height: 88px;
  margin: 0;
  padding: 0 36px;
  border-bottom: 1px solid var(--border-subtle);
}

:deep(.container-task-drawer .el-drawer__body) {
  padding: 24px 28px;
  overflow: auto;
}

:deep(.container-task-drawer .el-drawer__footer) {
  padding: 0;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 900px) {
  .stage-list,
  .task-grid {
    grid-template-columns: 1fr;
  }

  .overview-main {
    flex-direction: column;
  }
}
</style>
