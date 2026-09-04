<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import CustomDrawer from '@/components/custom-drawer.vue'
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
const requestSequence = ref(0)
const isComposeOperation = (operation?: string) => String(operation || '').startsWith('compose.')

const operationLabel = computed(() => {
  const operation = task.value?.operation || ''
  const labels: Record<string, string> = {
    pull: t('container.pullImage', 'Pull image'),
    build: t('container.buildImage', 'Build image'),
    create: t('container.createContainer', 'Create container'),
    'compose.create': t('container.task.operations.composeCreate', 'Create and start Compose project'),
    'compose.edit': t('container.task.operations.composeEdit', 'Save Compose configuration'),
    'compose.start': t('container.task.operations.composeStart', 'Start Compose services'),
    'compose.stop': t('container.task.operations.composeStop', 'Stop Compose services'),
    'compose.restart': t('container.task.operations.composeRestart', 'Restart Compose services'),
    'compose.update': t('container.task.operations.composeUpdate', 'Update Compose project'),
    'compose.delete': t('container.task.operations.composeDelete', 'Delete Compose project'),
    'network.connect': t('container.connectNetwork', 'Connect network'),
    'network.reconnect': t('container.reconnectNetwork', 'Reconnect network'),
    'network.disconnect': t('container.networks', 'Networks')
  }
  return labels[operation] || (isComposeOperation(operation)
    ? t('container.task.composeTask', 'Compose task')
    : t('container.task.containerTask', 'Container task'))
})

const phaseLabel = (phase: string) => {
  const composePhase = ['creating', 'editing', 'updating', 'starting', 'stopping', 'restarting', 'deleting'].includes(phase)
  if (isComposeOperation(task.value?.operation) && composePhase) return operationLabel.value
  return ({
    queued: t('container.task.phase.queued', 'Task queued'),
    resolving: t('container.task.phase.resolving', 'Parameter check'),
    pulling: t('container.task.phase.pulling', 'Pull image'),
    building: t('container.task.phase.building', 'Build image'),
    creating: t('container.task.phase.creating', 'Create container'),
    editing: t('container.task.phase.editing', 'Save Compose configuration'),
    updating: t('container.task.phase.updating', 'Update Compose project'),
    starting: t('container.task.phase.starting', 'Start Compose services'),
    stopping: t('container.task.phase.stopping', 'Stop Compose services'),
    restarting: t('container.task.phase.restarting', 'Restart Compose services'),
    deleting: t('container.task.phase.deleting', 'Delete Compose resources'),
    canceling: t('container.task.status.canceling', 'Canceling'),
    verifying: t('container.task.phase.verifying', 'Verify result')
  }[phase] || phase)
}

const statusLabel = computed(() => {
  if (isComposeOperation(task.value?.operation) && !terminal.value) {
    return phaseLabel(task.value?.phase || task.value?.status || '')
  }
  const labels: Record<string, string> = {
    queued: t('container.task.status.queued', 'Queued'),
    resolving: t('container.task.status.resolving', 'Resolving parameters'),
    pulling: t('container.task.status.pulling', 'Pulling image'),
    building: t('container.task.status.building', 'Building image'),
    creating: t('container.task.status.creating', 'Creating container'),
    editing: t('container.task.status.editing', 'Saving Compose configuration'),
    updating: t('container.task.status.updating', 'Updating Compose project'),
    starting: t('container.task.status.starting', 'Starting Compose services'),
    stopping: t('container.task.status.stopping', 'Stopping Compose services'),
    restarting: t('container.task.status.restarting', 'Restarting Compose services'),
    deleting: t('container.task.status.deleting', 'Deleting Compose resources'),
    verifying: t('container.task.status.verifying', 'Verifying result'),
    canceling: t('container.task.status.canceling', 'Canceling'),
    succeeded: t('container.task.status.succeeded', '{operation} succeeded', { operation: operationLabel.value }),
    failed: t('container.task.status.failed', '{operation} failed', { operation: operationLabel.value }),
    canceled: t('container.task.status.canceled', 'Canceled'),
    interrupted: t('container.task.status.interrupted', 'Task interrupted')
  }
  return labels[task.value?.status || ''] || task.value?.status || t('common.loading', 'Loading')
})

const statusText = computed(() => {
  if (terminal.value && (task.value?.errorMessage || task.value?.message)) {
    return task.value.errorMessage || task.value.message
  }
  return statusLabel.value
})

const progressStatus = computed(() => {
  if (task.value?.status === 'succeeded') return 'success' as const
  if (failed.value) return 'exception' as const
  return undefined
})

const stageDefinitions = computed(() => {
  const composeStages: Record<string, Array<{ key: string; name: string }>> = {
    'compose.create': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'creating', name: operationLabel.value },
      { key: 'verifying', name: t('container.task.stages.verifyComposeResult', 'Verify Compose result') }
    ],
    'compose.edit': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'editing', name: operationLabel.value }
    ],
    'compose.start': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'starting', name: operationLabel.value },
      { key: 'verifying', name: t('container.task.stages.verifyComposeResult', 'Verify Compose result') }
    ],
    'compose.stop': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'stopping', name: operationLabel.value }
    ],
    'compose.restart': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'restarting', name: operationLabel.value },
      { key: 'verifying', name: t('container.task.stages.verifyComposeResult', 'Verify Compose result') }
    ],
    'compose.update': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'updating', name: operationLabel.value },
      { key: 'verifying', name: t('container.task.stages.verifyComposeResult', 'Verify Compose result') }
    ],
    'compose.delete': [
      { key: 'resolving', name: t('container.task.stages.checkComposeParams', 'Check Compose parameters') },
      { key: 'deleting', name: operationLabel.value }
    ]
  }
  if (composeStages[task.value?.operation || '']) return composeStages[task.value?.operation || '']
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
  if (String(task.value?.operation || '').startsWith('network.')) {
    return [
      { key: 'queued', name: t('container.task.phase.queued', 'Task queued') },
      { key: 'resolving', name: t('container.task.phase.resolving', 'Parameter check') },
      { key: 'verifying', name: t('container.task.phase.verifying', 'Verify result') }
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

const pickLatestTaskId = (
  tasks: Array<{ id?: string; status?: string; createdAt?: string }>,
) => {
  return [...tasks]
    .filter((item) => item?.id && !containerTaskStore.isTerminal(item.status))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0
      return rightTime - leftTime
    })[0]?.id || ''
}

const resetTaskSelection = (closeSubscription = true) => {
  const previousTaskId = currentTaskId.value
  currentTaskId.value = ''
  autoScroll.value = true
  bootstrapping.value = false
  requestSequence.value += 1
  if (previousTaskId && closeSubscription) {
    containerTaskStore.close(previousTaskId)
  }
}

const loadTasksByPriority = async () => {
  const { data: activeResult } = await Api.getContainerTasks({
    active: true,
    page: 1,
    pageSize: 20
  })
  const activeTasks = Array.isArray(activeResult)
    ? activeResult
    : Array.isArray(activeResult?.data)
      ? activeResult.data
      : activeResult?.items || []
  containerTaskStore.ingest(activeTasks)
  return pickLatestTaskId(activeTasks)
}

const ensureTaskLoaded = async (preferredTaskId?: string) => {
  if (!props.modelValue || bootstrapping.value) return
  const sequence = ++requestSequence.value
  bootstrapping.value = true
  try {
    let taskId = preferredTaskId || props.taskId || ''
    if (!taskId) {
      taskId = await loadTasksByPriority()
    }
    if (sequence !== requestSequence.value || !props.modelValue) return
    if (currentTaskId.value && currentTaskId.value !== taskId) {
      containerTaskStore.close(currentTaskId.value)
    }
    currentTaskId.value = taskId
    if (!taskId) return
    await containerTaskStore.track(taskId).catch(() => undefined)
    if (sequence !== requestSequence.value || currentTaskId.value !== taskId || !props.modelValue) return
    await containerTaskStore.fetchLog(taskId).catch(() => undefined)
    if (sequence !== requestSequence.value || currentTaskId.value !== taskId || !props.modelValue) return
  } finally {
    if (sequence === requestSequence.value) {
      bootstrapping.value = false
    }
  }
}

watch(
  () => ({ isVisible: props.modelValue, taskId: props.taskId }),
  async ({ isVisible, taskId }) => {
    if (!isVisible) {
      resetTaskSelection(true)
      return
    }
    if (taskId) {
      if (taskId !== currentTaskId.value) {
        autoScroll.value = true
        await ensureTaskLoaded(taskId)
        return
      }
      if (!task.value) {
        await ensureTaskLoaded(taskId)
      }
      return
    }
    if (currentTaskId.value) {
      resetTaskSelection(true)
    }
    await ensureTaskLoaded('')
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
    // ElMessage.error(error?.message || t('container.task.logDownloadFailed', 'Failed to download task log'))
  } finally {
    downloading.value = false
  }
}

onBeforeUnmount(() => {
  resetTaskSelection(true)
})
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="task?.resourceName || operationLabel"
    class="container-task-drawer"
    size="840px"
    :close-on-click-modal="terminal"
    :destroy-on-close="false"
    body-mode="compact"
  >
    <template #title>
      <div class="task-heading">
        <div class="task-title">
          <strong>{{ task?.resourceName || operationLabel }}</strong>
          <span>{{ operationLabel }}</span>
        </div>
      </div>
    </template>
    <template #header-extra>
      <el-tag class="task-status" :type="task?.status === 'succeeded' ? 'success' : failed ? 'danger' : 'primary'" effect="plain" round>
        {{ statusLabel }}
      </el-tag>
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

      <el-alert
        v-if="task.autoStartStatus"
        :type="task.autoStartStatus === 'failed' ? 'error' : task.autoStartStatus === 'succeeded' ? 'success' : 'info'"
        show-icon
        :closable="false"
        :title="task.autoStartStatus === 'failed'
          ? task.autoStartError || $t('container.task.autoStartFailed')
          : task.autoStartStatus === 'succeeded'
            ? $t('container.task.autoStartSucceeded')
            : task.autoStartStatus === 'starting'
              ? $t('container.task.autoStarting')
              : $t('container.task.autoStartPending')"
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
  </custom-drawer>
</template>

<style scoped lang="less">
.task-actions,
.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.task-heading {
  min-width: 0;
  flex: 1;
}

.task-status {
  max-width: min(240px, 34vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 0;
}

.summary-card,
.summary-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-subtle);
  min-width: 0;
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
    line-height: 1.35;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  p {
    margin-top: 6px;
    line-height: 1.5;
    overflow-wrap: anywhere;
    word-break: break-word;
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
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

.task-actions {
  width: 100%;
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
