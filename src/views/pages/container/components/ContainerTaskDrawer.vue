<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import { useContainerTaskStore } from '@/stores/modules/containerTask';
import i18n from '@/lang'

const containerTaskStore = useContainerTaskStore()

const props = defineProps<{
  modelValue: boolean
  taskId?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'finished'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const currentTaskId = ref('')
const task = computed(() => containerTaskStore.tasks[currentTaskId.value])
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}
const logs = computed(() => containerTaskStore.logs[currentTaskId.value] || t('container.task.waitingDockerOutput', 'Waiting for Docker output...'))
const terminal = computed(() => containerTaskStore.isTerminal(task.value?.status))
const failed = computed(() => ['failed', 'interrupted'].includes(task.value?.status))
const cancelable = computed(() => !!task.value && !terminal.value && !task.value.cancelRequested)
const autoScroll = ref(true)
const logElement = ref<HTMLElement>()
const downloading = ref(false)
const bootstrapping = ref(false)

const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    pull: t('container.pullImage', 'Pull image'),
    build: t('container.buildImage', 'Build image'),
    create: t('container.createContainer', 'Create container')
  }
  return labels[task.value?.operation || ''] || t('container.task.containerTask', 'Container task')
})

const statusText = computed(() => {
  const labels: Record<string, string> = {
    queued: t('container.task.status.queued', 'Queued'),
    resolving: t('container.task.status.resolving', 'Resolving parameters'),
    pulling: t('container.task.status.pulling', 'Pulling image'),
    building: t('container.task.status.building', 'Building image'),
    creating: t('container.task.status.creating', 'Creating container'),
    verifying: t('container.task.status.verifying', 'Verifying result'),
    canceling: t('container.task.status.canceling', 'Canceling'),
    succeeded: t('container.task.status.succeeded', '{operation} succeeded', { operation: operationLabel.value }),
    failed: t('container.task.status.failed', '{operation} failed', { operation: operationLabel.value }),
    canceled: t('container.task.status.canceled', 'Canceled'),
    interrupted: t('container.task.status.interrupted', 'Task interrupted')
  }
  return labels[task.value?.status || ''] || task.value?.status || t('common.loading', 'Loading')
})

const progressStatus = computed(() => {
  if (task.value?.status === 'succeeded') return 'success' as const
  if (failed.value) return 'exception' as const
  return undefined
})

const phaseLabel = (phase: string) => ({
  queued: t('container.task.phase.queued', 'Task queued'),
  resolving: t('container.task.phase.resolving', 'Parameter check'),
  pulling: t('container.task.phase.pulling', 'Pull image'),
  building: t('container.task.phase.building', 'Build image'),
  creating: t('container.task.phase.creating', 'Create container'),
  verifying: t('container.task.phase.verifying', 'Verify result')
}[phase] || phase)

const stageDefinitions = computed(() => {
  if (task.value?.operation === 'pull') {
    return [
      { key: 'resolving', name: t('container.task.stages.resolveImageParams', 'Resolve image parameters') },
      { key: 'pulling', name: t('container.task.stages.pullImageLayers', 'Pull image layers') },
      { key: 'verifying', name: t('container.task.stages.verifyImageResult', 'Verify image result') }
    ]
  }
  if (task.value?.operation === 'build') {
    return [
      { key: 'resolving', name: t('container.task.stages.checkBuildParams', 'Check build parameters') },
      { key: 'building', name: t('container.task.stages.executeDockerBuild', 'Execute Docker build') },
      { key: 'verifying', name: t('container.task.stages.verifyImageTag', 'Verify image tag') }
    ]
  }
  return [
    { key: 'resolving', name: t('container.task.stages.checkContainerParams', 'Check container parameters') },
    { key: 'pulling', name: t('container.task.stages.prepareRequiredImage', 'Prepare required image') },
    { key: 'creating', name: t('container.task.stages.createContainerInstance', 'Create container instance') },
    { key: 'verifying', name: t('container.task.stages.verifyContainerResult', 'Verify container result') }
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
  { label: t('container.task.summary.taskId', 'Task ID'), value: task.value?.id || '-' },
  { label: t('container.task.summary.operationType', 'Operation type'), value: operationLabel.value },
  { label: t('container.task.summary.currentPhase', 'Current phase'), value: phaseLabel(task.value?.phase || '-') },
  { label: t('container.task.summary.targetResource', 'Target resource'), value: task.value?.resourceName || task.value?.containerId || '-' },
  { label: t('container.task.summary.errorCode', 'Error code'), value: task.value?.errorCode || '-' }
])

const pickLatestTaskId = (tasks: Array<{ id?: string; status?: string }>) => {
  const activeTask = tasks.find((item) => item?.id && !containerTaskStore.isTerminal(item.status))
  if (activeTask?.id) return activeTask.id
  return tasks.find((item) => item?.id)?.id || ''
}

const ensureTaskLoaded = async () => {
  if (!props.modelValue || bootstrapping.value) return
  bootstrapping.value = true
  try {
    let taskId = props.taskId || currentTaskId.value || ''
    if (!taskId) {
      const [{ data: activeResult }, { data: latestResult }] = await Promise.all([
        Api.getContainerTasks({ active: true, page: 1, pageSize: 20 }),
        Api.getContainerTasks({ page: 1, pageSize: 20 })
      ])
      const activeTasks = Array.isArray(activeResult) ? activeResult : Array.isArray(activeResult?.data) ? activeResult.data : activeResult?.items || []
      const latestTasks = Array.isArray(latestResult) ? latestResult : Array.isArray(latestResult?.data) ? latestResult.data : latestResult?.items || []
      containerTaskStore.ingest(activeTasks)
      containerTaskStore.ingest(latestTasks)
      taskId = pickLatestTaskId(activeTasks) || pickLatestTaskId(latestTasks) || containerTaskStore.order[0] || ''
    }
    currentTaskId.value = taskId
    if (!taskId) return
    await containerTaskStore.track(taskId).catch(() => undefined)
    await containerTaskStore.fetchLog(taskId).catch(() => undefined)
  } finally {
    bootstrapping.value = false
  }
}

watch(
  () => ({ isVisible: props.modelValue, taskId: props.taskId }),
  async ({ isVisible, taskId }) => {
    if (!isVisible) return
    if (taskId && taskId !== currentTaskId.value) currentTaskId.value = taskId
    await ensureTaskLoaded()
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
  if (!currentTaskId.value) return
  try {
    await ElMessageBox.confirm(t('container.task.cancelConfirmMessage', 'Canceling will try to stop the current Docker operation. Logs and final status will be retained.'), t('container.task.cancelTask', 'Cancel container task'), {
      type: 'warning',
      confirmButtonText: t('container.task.confirmCancel', 'Confirm cancel'),
      cancelButtonText: t('container.task.continueRunning', 'Continue running')
    })
    await containerTaskStore.cancel(currentTaskId.value)
    ElMessage.success(t('container.task.cancelSubmitted', 'Cancel request submitted'))
  } catch {
    // Keep task running.
  }
}

const downloadLog = async () => {
  if (!currentTaskId.value || downloading.value) return
  downloading.value = true
  try {
    await containerTaskStore.downloadLog(currentTaskId.value)
    ElMessage.success(t('container.task.logDownloadStarted', 'Full task log download started'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('container.task.logDownloadFailed', 'Failed to download task log'))
  } finally {
    downloading.value = false
  }
}

onBeforeUnmount(() => {
  if (currentTaskId.value && terminal.value) containerTaskStore.close(currentTaskId.value)
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
          <span>{{ $t('common.back') }}</span>
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
            <span class="overview-label">{{ $t('container.task.currentProgress') }} · {{ phaseLabel(task.phase || task.status) }}</span>
            <h3>{{ statusText }}</h3>
            <p>{{ task.message || $t('container.task.createdWaitingDockerOutput') }}</p>
          </div>
          <div class="progress-card">
            <small>{{ $t('container.task.completion') }}</small>
            <strong>{{ task.progress || 0 }}%</strong>
            <span>{{ terminal ? $t('container.task.taskEnded') : $t('container.task.realtimeRefreshing') }}</span>
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
        :title="task.errorMessage || task.message || $t('container.task.executionFailed')"
      />

      <section class="task-grid">
        <section class="log-panel">
          <div class="log-toolbar">
            <div>
              <strong>{{ $t('container.task.realtimeLogs') }}</strong>
              <span>{{ $t('container.task.dockerOutputHint') }}</span>
            </div>
            <el-checkbox v-model="autoScroll">{{ $t('container.task.autoScroll') }}</el-checkbox>
          </div>
          <pre ref="logElement" class="task-log">{{ logs }}</pre>
        </section>
        <aside class="summary-panel">
          <div class="summary-card">
            <small>{{ $t('container.task.currentResult') }}</small>
            <strong>{{ statusText }}</strong>
            <p>{{ task.errorMessage || task.message || $t('container.task.noAdditionalNotes') }}</p>
          </div>
          <div v-for="item in summaryItems" :key="item.label" class="summary-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </aside>
      </section>
    </div>
    <el-skeleton v-else-if="bootstrapping" :rows="8" animated />
    <el-empty v-else :description="$t('container.task.noTask', 'No container tasks')" />

    <template #footer>
      <div class="task-actions">
        <el-button :loading="downloading" @click="downloadLog">{{ $t('container.task.downloadFullLog') }}</el-button>
        <div>
          <el-button v-if="cancelable" type="danger" plain @click="cancelTask">{{ $t('container.task.cancelTask') }}</el-button>
          <el-button :type="failed && !cancelable ? 'info' : 'primary'" :plain="failed && !cancelable" @click="visible = false">
            {{ terminal ? $t('common.done') : $t('container.task.runInBackground') }}
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
