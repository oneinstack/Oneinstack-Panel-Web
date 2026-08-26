<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CustomDrawer from '@/components/custom-drawer.vue'
import { useSoftwareTaskStore } from '@/stores/modules/softwareTask';
import i18n from '@/lang'

const softwareTaskStore = useSoftwareTaskStore()

const props = defineProps<{
  modelValue: boolean
  taskId: string
  closeOnClickModal?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'retry', taskId: string): void
}>()

const logElement = ref<HTMLElement>()
const autoScroll = ref(true)
const downloading = ref(false)
const now = ref(Date.now())
const clock = window.setInterval(() => {
  now.value = Date.now()
}, 1000)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const task = computed(() => softwareTaskStore.tasks[props.taskId])
const isUninstall = computed(() => task.value?.operation === 'uninstall')
const isServiceTask = computed(() =>
  ['start', 'stop', 'restart', 'reload'].includes(task.value?.operation || '')
)
const isConfigurationTask = computed(() => task.value?.operation === 'configure')
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}
const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    install: t('layout.operation.install', 'Install'),
    upgrade: t('layout.operation.upgrade', 'Upgrade'),
    uninstall: t('layout.operation.uninstall', 'Uninstall'),
    start: t('layout.operation.start', 'Start'),
    stop: t('layout.operation.stop', 'Stop'),
    restart: t('layout.operation.restart', 'Restart'),
    reload: t('layout.operation.reload', 'Reload'),
    configure: t('layout.operation.configure', 'Publish configuration')
  }
  return labels[task.value?.operation || ''] || t('layout.task', 'Task')
})
const logs = computed(() => softwareTaskStore.logs[props.taskId] || t('software.task.waitingScriptOutput', 'Waiting for script output...'))
const terminal = computed(() => softwareTaskStore.isTerminal(task.value?.status))
const failed = computed(() => ['failed', 'interrupted'].includes(task.value?.status))
const cancelable = computed(() => !!task.value && !terminal.value && !task.value.cancelRequested)
const progressStatus = computed(() => {
  if (task.value?.status === 'succeeded') return 'success' as const
  if (failed.value) return 'exception' as const
  return undefined
})
const statusText = computed(() => {
  const labels: Record<string, string> = {
    queued: t('software.task.status.queued', 'Queued'),
    resolving: t('software.task.status.resolving', 'Resolving package'),
    prechecking: t('software.task.status.prechecking', 'Checking environment'),
    installing: t('software.task.status.installing', 'Installing'),
    upgrading: t('software.task.status.upgrading', 'Upgrading'),
    uninstalling: t('software.task.status.uninstalling', 'Uninstalling'),
    starting: t('software.task.status.starting', 'Starting service'),
    stopping: t('software.task.status.stopping', 'Stopping service'),
    restarting: t('software.task.status.restarting', 'Restarting service'),
    reloading: t('software.task.status.reloading', 'Reloading service'),
    configuring: t('software.task.status.configuring', 'Writing configuration'),
    verifying: t('software.task.status.verifying', 'Starting and verifying'),
    finalizing: t('software.task.status.finalizing', 'Saving status'),
    canceling: t('software.task.status.canceling', 'Canceling'),
    rolling_back: t('software.task.status.rollingBack', 'Rolling back'),
    succeeded: t('software.task.status.succeeded', '{operation} succeeded', { operation: operationLabel.value }),
    failed: t('software.task.status.failed', '{operation} failed', { operation: operationLabel.value }),
    canceled: t('software.task.status.canceled', 'Canceled'),
    interrupted: t('software.task.status.interrupted', 'Task interrupted')
  }
  return labels[task.value?.status] || task.value?.status || t('common.loading', 'Loading')
})
const elapsed = computed(() => {
  if (!task.value?.createdAt) return t('software.task.duration.seconds', '{value} seconds', { value: 0 })
  const end = task.value.finishedAt ? Date.parse(task.value.finishedAt) : now.value
  const seconds = Math.max(0, Math.floor((end - Date.parse(task.value.createdAt)) / 1000))
  if (seconds < 60) return t('software.task.duration.seconds', '{value} seconds', { value: seconds })
  const minutes = Math.floor(seconds / 60)
  return t('software.task.duration.minutesSeconds', '{minutes} min {seconds} sec', { minutes, seconds: seconds % 60 })
})
const createdAtText = computed(() => {
  if (!task.value?.createdAt) return t('software.task.unknownTime', 'Unknown time')
  const value = new Date(task.value.createdAt)
  if (Number.isNaN(value.getTime())) return t('software.task.unknownTime', 'Unknown time')
  return new Intl.DateTimeFormat(i18n.locale || 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(value)
})
const fallbackErrorCode = computed(() => {
  if (isConfigurationTask.value) return 'CONFIG_APPLY_FAILED'
  if (isServiceTask.value) return 'SERVICE_ACTION_FAILED'
  if (isUninstall.value) return 'UNINSTALL_FAILED'
  return 'INSTALL_FAILED'
})
const metaCards = computed(() => [
  {
    label: t('software.task.summary.taskId', 'Task ID'),
    value: task.value?.id || '-',
    className: 'task-meta-card--mono task-meta-card--wide'
  },
  {
    label: terminal.value ? t('software.task.summary.taskType', 'Task type') : t('software.task.summary.createdAt', 'Created at'),
    value: terminal.value ? t('software.task.historyTask', 'History task') : createdAtText.value,
    className: terminal.value ? 'task-meta-card--accent' : ''
  },
  {
    label: t('software.task.summary.currentPhase', 'Current phase'),
    value: task.value?.phase || task.value?.status || 'waiting',
    className: 'task-meta-card--mono'
  },
  {
    label: t('software.task.summary.elapsed', 'Elapsed'),
    value: elapsed.value,
    className: 'task-meta-card--strong'
  }
])
const summaryItems = computed(() => [
  { label: t('software.task.summary.component', 'Component'), value: task.value?.component || '-' },
  { label: t('software.task.summary.version', 'Version'), value: task.value?.requestedVersion || '-' },
  { label: t('software.task.summary.errorCode', 'Error code'), value: task.value?.errorCode || (failed.value ? fallbackErrorCode.value : '-') },
  { label: t('software.task.summary.rollbackStatus', 'Rollback status'), value: task.value?.rollbackStatus || 'not_required' }
])

const stages = computed(() => {
  const currentProgress = task.value?.progress || 0
  const definitions = isServiceTask.value
    ? [
        { key: 'resolving', name: t('software.task.stages.fetchControlScript', 'Fetch control script'), end: 5 },
        { key: task.value?.operation || 'restart', name: t('software.task.stages.serviceAction', '{operation} service', { operation: operationLabel.value }), end: 96 },
        { key: 'finalizing', name: t('software.task.stages.saveTaskStatus', 'Save task status'), end: 100 }
      ]
    : isConfigurationTask.value
    ? [
        { key: 'resolving', name: t('software.task.stages.fetchConfigScript', 'Fetch configuration script'), end: 5 },
        { key: 'config_apply', name: t('software.task.stages.backupValidatePublish', 'Back up, validate, and publish'), end: 96 },
        { key: 'finalizing', name: t('software.task.stages.saveTaskStatus', 'Save task status'), end: 100 }
      ]
    : isUninstall.value
    ? [
        { key: 'resolving', name: t('software.task.stages.fetchUninstallPackage', 'Fetch uninstall package'), end: 5 },
        { key: 'uninstall', name: t('software.task.stages.uninstallComponent', 'Uninstall component'), end: 96 },
        { key: 'finalizing', name: t('software.task.stages.saveStatus', 'Save status'), end: 100 }
      ]
    : [
        { key: 'resolving', name: t('software.task.stages.fetchInstallPackage', 'Fetch install package'), end: 5 },
        { key: 'precheck', name: t('software.task.stages.environmentPrecheck', 'Environment precheck'), end: 12 },
        {
          key: task.value?.operation === 'upgrade' ? 'upgrade' : 'install',
          name: task.value?.operation === 'upgrade' ? t('software.task.stages.upgradeSoftware', 'Upgrade software') : t('software.task.stages.installSoftware', 'Install software'),
          end: 72
        },
        { key: 'configure', name: t('software.task.stages.writeConfiguration', 'Write configuration'), end: 84 },
        { key: 'verify', name: t('software.task.stages.startAndVerify', 'Start and verify'), end: 96 },
        { key: 'finalizing', name: t('software.task.stages.saveStatus', 'Save status'), end: 100 }
      ]
  return definitions.map((stage) => ({
    ...stage,
    active: task.value?.phase === stage.key ||
      (stage.key === 'install' && task.value?.phase === 'installing') ||
      (stage.key === 'upgrade' && task.value?.phase === 'upgrading'),
    done: currentProgress >= stage.end || task.value?.status === 'succeeded'
  }))
})

const loadTask = async () => {
  if (!props.modelValue || !props.taskId) return
  await softwareTaskStore.track(props.taskId)
  await softwareTaskStore.fetchLog(props.taskId)
}

const cancelTask = async () => {
  const uninstall = isUninstall.value
  const serviceTask = isServiceTask.value
  const configurationTask = isConfigurationTask.value
  await ElMessageBox.confirm(
    configurationTask
      ? t('software.task.cancelMessages.configure', 'Canceling will stop the configuration script. If configuration has already been published, the snapshot before publish will be restored automatically. Continue?')
      : serviceTask
      ? t('software.task.cancelMessages.service', 'Canceling will stop the {operation} script and recheck service status. Continue?', { operation: operationLabel.value })
      : uninstall
      ? t('software.task.cancelMessages.uninstall', 'Canceling will safely stop the uninstall script and recheck component status. Completed component steps may not be restored automatically. Continue?')
      : t('software.task.cancelMessages.install', 'Canceling may trigger rollback. Running non-interruptible steps will wait for a safe exit first. Continue?'),
    configurationTask
      ? t('software.task.cancelTitles.configure', 'Cancel configuration publish task')
      : serviceTask ? t('software.task.cancelTitles.service', 'Cancel {operation} task', { operation: operationLabel.value }) : uninstall ? t('software.task.cancelTitles.uninstall', 'Cancel uninstall task') : t('software.task.cancelTitles.install', 'Cancel install task'),
    {
      type: 'warning',
      confirmButtonText: t('software.task.confirmCancel', 'Confirm cancel'),
      cancelButtonText: configurationTask
        ? t('software.task.continuePublish', 'Continue publishing')
        : serviceTask ? t('software.task.continueOperation', 'Continue {operation}', { operation: operationLabel.value }) : uninstall ? t('software.task.continueUninstall', 'Continue uninstalling') : t('software.task.continueInstall', 'Continue installing')
    }
  )
  await softwareTaskStore.cancel(props.taskId)
}

const writeClipboardText = async (value: string) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) {
    throw new Error('copy failed')
  }
}

const copyDiagnostics = async () => {
  const value = [
    `Task: ${task.value?.id}`,
    `Component: ${task.value?.component}`,
    `Version: ${task.value?.requestedVersion}`,
    `Status: ${task.value?.status}`,
    `Error: ${task.value?.errorCode || '-'}`,
    '',
    logs.value
  ].join('\n')
  try {
    await writeClipboardText(value)
    ElMessage.success(t('software.task.diagnosticsCopied', 'Diagnostics copied'))
  } catch {
    ElMessage.error(t('software.task.copyDiagnosticsFailed', 'Copy failed. Check browser clipboard permission.'))
  }
}

const downloadLog = async () => {
  if (!props.taskId || downloading.value) return
  downloading.value = true
  try {
    await softwareTaskStore.downloadLog(props.taskId)
    ElMessage.success(t('software.task.logDownloadStarted', 'Full task log download started'))
  } catch (error: any) {
    // ElMessage.error(error?.message || t('software.task.logDownloadFailed', 'Failed to download task log'))
  } finally {
    downloading.value = false
  }
}

watch(
  () => [props.modelValue, props.taskId],
  () => void loadTask().catch(() => undefined),
  { immediate: true }
)
watch(logs, async () => {
  if (!autoScroll.value) return
  await nextTick()
  if (logElement.value) {
    logElement.value.scrollTop = logElement.value.scrollHeight
  }
})

onBeforeUnmount(() => {
  window.clearInterval(clock)
})
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="task?.component || $t('software.task.softwareTask')"
    class="install-task-drawer"
    size="840px"
    close-on-click-modal
    :destroy-on-close="false"
    body-mode="compact"
  >
    <template #title>
      <div class="task-heading">
        <div class="task-title">
          <strong>{{ task?.component || $t('software.task.softwareTask') }}</strong>
          <span class="task-operation">{{ operationLabel }}</span>
          <small v-if="task?.requestedVersion">{{ task.requestedVersion }}</small>
        </div>
      </div>
    </template>
    <template #header-extra>
      <el-tag
        class="task-status"
        :type="task?.status === 'succeeded' ? 'success' : failed ? 'danger' : 'primary'"
        effect="plain"
        round
      >
        {{ statusText }}
      </el-tag>
    </template>

    <div v-if="task" class="task-content">
      <section
        class="overview"
        :class="{
          'is-success': task.status === 'succeeded',
          'is-failed': failed
        }"
      >
        <div class="overview-hero">
          <div class="overview-copy">
            <div class="overview-label">
              <span class="overview-label__title">{{ $t('software.task.currentProgress') }}</span>
              <span class="overview-phase">{{ task.phase || task.status }}</span>
            </div>
            <h3>{{ statusText }}</h3>
            <p>{{ task.message || $t('software.task.createdPreparing') }}</p>
          </div>
          <div class="overview-progress-card">
            <small>{{ $t('software.task.completion') }}</small>
            <strong>{{ task.progress }}%</strong>
            <span>{{ terminal ? $t('software.task.taskEnded') : $t('software.task.realtimeRefreshing') }}</span>
          </div>
        </div>
        <div class="overview-track">
          <el-progress
            :percentage="task.progress"
            :status="progressStatus"
            :stroke-width="10"
            :show-text="false"
            :indeterminate="task.phaseProgress === undefined && !terminal"
            :duration="3"
          />
        </div>
        <!-- <div class="overview-foot">
          <div
            v-for="item in metaCards"
            :key="item.label"
            class="overview-foot__item"
            :class="item.className"
          >
            <small>{{ item.label }}</small>
            <strong>{{ item.value }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>{{ $t('software.task.summary.taskStatus') }}</small>
            <strong>{{ task.status }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>{{ $t('software.task.summary.executionMode') }}</small>
            <strong>{{ isConfigurationTask ? $t('software.task.modes.configure') : isServiceTask ? $t('software.task.modes.service') : isUninstall ? $t('software.task.modes.uninstall') : $t('software.task.modes.install') }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>{{ $t('software.task.summary.logStatus') }}</small>
            <strong>{{ autoScroll ? $t('software.task.autoScrollEnabled') : $t('software.task.manualViewing') }}</strong>
          </div>
        </div> -->
      </section>

      <!-- <section class="stage-section">
        <div class="section-heading">
          <div>
            <span class="section-heading__eyebrow">EXECUTION FLOW</span>
            <h4>{{ $t('software.task.executionFlow') }}</h4>
          </div>
          <span class="section-heading__hint">{{ $t('software.task.executionFlowHint') }}</span>
        </div>
        <div class="stage-list">
          <div
            v-for="(stage, index) in stages"
            :key="stage.key"
            class="stage"
            :class="{ active: stage.active, done: stage.done, pending: !stage.active && !stage.done }"
          >
            <span class="stage-dot">{{ stage.done ? '✓' : index + 1 }}</span>
            <div class="stage-copy">
              <small>STEP {{ String(index + 1).padStart(2, '0') }}</small>
              <span>{{ stage.name }}</span>
            </div>
          </div>
        </div>
      </section> -->

      <el-alert
        v-if="failed"
        class="failure"
        type="error"
        :closable="false"
        show-icon
        :title="task.errorMessage || task.message || $t('software.task.executionFailed')"
      >
        <template #default>
          <div class="failure__row">
            {{ $t('software.task.summary.errorCode') }}: {{ task.errorCode || fallbackErrorCode }}
          </div>
          <div v-if="task.rollbackStatus && task.rollbackStatus !== 'not_required'" class="failure__row">
            {{ $t('software.task.summary.rollbackStatus') }}: {{ task.rollbackStatus }}
          </div>
          <div v-if="task.recoveryStatus" class="failure__row">
            {{ $t('software.task.restartVerification') }}: {{ task.recoveryStatus }} · {{ task.recoveryMessage }}
          </div>
        </template>
      </el-alert>

      <section class="diagnostic-grid">
        <section class="log-section">
          <div class="log-toolbar">
            <div class="log-toolbar__title">
              <span class="log-live-dot"></span>
              <div class="log-toolbar__copy">
                <strong>{{ $t('software.task.realtimeLogs') }}</strong>
                <span>{{ $t('software.task.scriptOutputHint') }}</span>
              </div>
            </div>
            <el-checkbox v-model="autoScroll">{{ $t('software.task.autoScroll') }}</el-checkbox>
          </div>
          <pre ref="logElement" class="task-log">{{ logs }}</pre>
        </section>

        <!-- <aside class="summary-panel">
          <div class="section-heading section-heading--aside">
            <div>
              <span class="section-heading__eyebrow">DIAGNOSTICS</span>
              <h4>{{ $t('software.task.diagnostics') }}</h4>
            </div>
          </div>
          <div class="summary-panel__card">
            <small>{{ $t('software.task.currentResult') }}</small>
            <strong>{{ statusText }}</strong>
            <p>{{ task.errorMessage || task.message || $t('software.task.noAdditionalNotes') }}</p>
          </div>
          <div class="summary-panel__list">
            <div v-for="item in summaryItems" :key="item.label" class="summary-panel__item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </aside> -->
      </section>
    </div>
    <el-skeleton v-else :rows="8" animated />

    <template #footer>
      <div class="task-actions">
        <div class="task-actions__group task-actions__group--tools">
          <el-button :loading="downloading" @click="downloadLog">{{ $t('software.task.downloadFullLog') }}</el-button>
          <el-button v-if="failed" @click="copyDiagnostics">{{ $t('software.task.copyDiagnostics') }}</el-button>
        </div>
        <div class="task-actions__group task-actions__group--main">
          <el-button v-if="cancelable" type="danger" plain @click="cancelTask">{{ $t('software.task.cancelTask') }}</el-button>
          <el-button
            v-if="failed && !isUninstall && !isServiceTask && !isConfigurationTask"
            type="primary"
            class="task-actions__retry"
            @click="emit('retry', taskId)"
          >
            {{ $t('software.task.retryWithNewInput') }}
          </el-button>

          <!-- :type="failed && !cancelable ? 'info' : 'primary'" -->
          <el-button
            :plain="failed && !cancelable"
            @click="visible = false"
          >
            {{ terminal ? $t('common.done') : $t('software.task.runInBackground') }}
          </el-button>
        </div>
      </div>
    </template>
  </custom-drawer>
</template>

<style scoped lang="less">
.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.task-heading {
  min-width: 0;
  flex: 1;
}

.task-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 760;
  line-height: 1.2;
  text-transform: capitalize;

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-operation {
    padding: 5px 11px;
    border-radius: 999px;
    color: var(--text-secondary);
    background: color-mix(in srgb, var(--surface-subtle) 74%, white);
    font-size: 11px;
    font-weight: 700;
  }

  small {
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 600;
  }
}

.task-status {
  flex: 0 0 auto;
  min-height: 34px;
  padding-inline: 14px;
  border-width: 1.5px;
  font-size: 13px;
  font-weight: 720;
}

.task-meta-card--wide {
  grid-column: span 2;
}

.task-meta-card--mono strong,
.task-meta-card--wide strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.task-meta-card--accent strong {
  color: var(--el-color-warning);
}

.task-meta-card--strong strong {
  font-size: 18px;
}

.task-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;

  > * {
    opacity: 0;
    transform: translateY(10px);
    animation: taskSectionEnter 0.34s ease forwards;
  }

  > *:nth-child(1) { animation-delay: 0.04s; }
  > *:nth-child(2) { animation-delay: 0.1s; }
  > *:nth-child(3) { animation-delay: 0.16s; }
  > *:nth-child(4) { animation-delay: 0.22s; }
}

.overview,
.stage-section,
.summary-panel {
  padding: 22px;
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 96%, white 4%),
    color-mix(in srgb, var(--surface-card) 92%, var(--surface-subtle) 8%)
  );
  box-shadow: 0 14px 32px rgba(16, 24, 40, 0.08);
}

.overview {
  border-color: rgba(var(--primary-color), 0.12);
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.12), transparent 30%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--surface-card) 96%, rgba(var(--primary-color), 0.04) 4%),
      color-mix(in srgb, var(--surface-subtle) 92%, rgba(var(--primary-color), 0.08) 8%)
    );
  box-shadow: 0 18px 40px rgba(16, 24, 40, 0.12);

  &.is-success {
    border-color: rgba(var(--success-color), 0.2);
    background:
      radial-gradient(circle at top right, rgba(var(--success-color), 0.14), transparent 30%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--surface-card) 97%, rgba(var(--success-color), 0.04) 3%),
        color-mix(in srgb, var(--surface-subtle) 93%, rgba(var(--success-color), 0.08) 7%)
      );

    .overview-phase {
      color: rgb(var(--success-color));
      background: rgba(var(--success-color), 0.1);
    }

    .overview-progress-card {
      border-color: rgba(var(--success-color), 0.24);
      background: linear-gradient(
        180deg,
        rgba(var(--success-color), 0.1),
        color-mix(in srgb, var(--surface-subtle) 90%, rgba(var(--success-color), 0.12) 10%)
      );

      strong {
        color: rgb(var(--success-color));
      }
    }
  }
}

.overview-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.overview-copy {
  min-width: 0;
  flex: 1;

  h3 {
    margin: 0 0 10px;
    color: var(--text-primary);
    font-size: 34px;
    font-weight: 800;
    line-height: 1.12;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.7;
    word-break: break-word;
  }
}

.overview-label {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.overview-label__title {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.overview-phase {
  padding: 4px 10px;
  border-radius: 999px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
}

.overview-progress-card {
  flex: 0 0 auto;
  min-width: 170px;
  padding: 20px 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(var(--primary-color), 0.2);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(var(--primary-color), 0.1),
    color-mix(in srgb, var(--surface-subtle) 88%, rgba(var(--primary-color), 0.12) 12%)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

  small {
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: rgb(var(--primary-color));
    font-size: 44px;
    font-weight: 820;
    line-height: 1;
  }

  span {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.overview-track {
  margin-bottom: 18px;
}

.overview-foot {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-foot__item {
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-subtle) 88%, white 12%);
  display: grid;
  gap: 6px;

  small {
    color: var(--text-placeholder);
    font-size: 11px;
    font-weight: 650;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.section-heading {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 4px 0 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 760;
  }
}

.section-heading__eyebrow {
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.section-heading__hint {
  color: var(--text-placeholder);
  font-size: 12px;
  line-height: 1.5;
}

.section-heading--aside {
  margin-bottom: 18px;
}

.stage-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stage {
  min-width: 0;
  min-height: 92px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  color: var(--text-tertiary);
  background: var(--surface-card);
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.04);
  transition: all 0.2s ease;
}

.stage-dot {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  color: var(--text-placeholder);
  background: var(--surface-subtle);
  font-size: 13px;
  font-weight: 780;
}

.stage-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  small {
    color: var(--text-placeholder);
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.14em;
  }

  span {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }
}

.stage.pending {
  background: color-mix(in srgb, var(--surface-card) 92%, #f8fafc);
}

.stage.active {
  border-color: rgba(var(--primary-color), 0.28);
  color: var(--el-color-primary);
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.08), rgba(var(--primary-color), 0.04));
  box-shadow: 0 14px 28px rgba(var(--primary-color), 0.08);

  .stage-dot {
    border-color: var(--el-color-primary);
    color: #fff;
    background: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);
  }
}

.stage.done {
  border-color: rgba(var(--success-color), 0.2);
  color: var(--el-color-success);
  background: linear-gradient(180deg, rgba(var(--success-color), 0.07), rgba(var(--success-color), 0.03));

  .stage-dot {
    color: #fff;
    border-color: var(--el-color-success);
    background: var(--el-color-success);
  }

  .stage-copy small {
    color: rgb(var(--success-color));
  }
}

.failure {
  margin: 0;
  padding: 8px 6px;
  border-radius: 18px;
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--border-subtle));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.failure__row + .failure__row {
  margin-top: 6px;
}

.diagnostic-grid {
  min-height: 0;
  // display: grid;
  // grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.8fr);
  // gap: 16px;
}

.log-section {
  height: 520px;
  min-height: 520px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--surface-card), color-mix(in srgb, var(--surface-card) 90%, #020617 10%));
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.1);
}

.log-toolbar {
  min-height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-card) 94%, var(--surface-subtle) 6%);

  strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
  }
}

.log-toolbar__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-toolbar__copy {
  display: flex;
  flex-direction: column;
  gap: 3px;

  span {
    color: var(--text-tertiary);
    font-size: 11px;
    line-height: 1.5;
  }
}

.log-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--success-color));
  box-shadow: 0 0 0 4px rgba(var(--success-color), 0.1);
}

.task-log {
  box-sizing: border-box;
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  margin: 0;
  padding: 18px 18px 22px;
  overflow-x: auto;
  overflow-y: scroll;
  overscroll-behavior: contain;
  color: #dbe6f5;
  background: linear-gradient(180deg, rgba(10, 16, 29, 0.98), rgba(4, 9, 20, 1));
  font: 12px/1.75 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-color: #475467 #101827;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-panel__card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.08), rgba(var(--primary-color), 0.03));

  small {
    display: block;
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 780;
    line-height: 1.2;
  }

  p {
    margin: 10px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
    word-break: break-word;
  }
}

.summary-panel__list {
  display: grid;
  gap: 12px;
}

.summary-panel__item {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-subtle) 90%, white 10%);

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    min-width: 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    text-align: right;
    word-break: break-word;
  }
}

.task-actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.install-task-drawer :deep(.drawer-body) {
  background: var(--surface-page);
}

.install-task-drawer :deep(.drawer-footer) {
  border-top: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 94%, transparent), var(--surface-card));
}

.install-task-drawer :deep(.el-progress-bar__outer) {
  background: color-mix(in srgb, var(--surface-subtle) 86%, black 14%);
}

.install-task-drawer :deep(.el-progress__text) {
  color: var(--text-primary);
  font-weight: 700;
}

.install-task-drawer :deep(.el-checkbox__label) {
  color: var(--text-secondary);
}

:root:root.dark .install-task-drawer {
  .task-status {
    border-color: rgba(var(--primary-color), 0.38);
    color: #fed7aa;
    background: linear-gradient(180deg, rgba(var(--primary-color), 0.16), rgba(var(--primary-color), 0.08));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 8px 20px rgba(var(--primary-color), 0.16);
  }

  :deep(.task-status.el-tag--success) {
    border-color: rgba(var(--success-color), 0.34);
    color: #86efac;
    background: linear-gradient(180deg, rgba(var(--success-color), 0.16), rgba(var(--success-color), 0.08));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 8px 20px rgba(var(--success-color), 0.14);
  }

  :deep(.task-status.el-tag--danger) {
    border-color: rgba(var(--error-color), 0.34);
    color: #fda4af;
    background: linear-gradient(180deg, rgba(var(--error-color), 0.16), rgba(var(--error-color), 0.08));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 8px 20px rgba(var(--error-color), 0.14);
  }

  .overview,
  .stage-section,
  .summary-panel {
    border-color: var(--border-default);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      0 18px 36px rgba(0, 0, 0, 0.22);
  }

  .overview {
    background:
      radial-gradient(circle at top right, rgba(var(--primary-color), 0.16), transparent 34%),
      linear-gradient(135deg, #182131, #101827 62%, #0f172a);

    .overview-copy h3 {
      color: #f8fafc;
    }

    .overview-label__title {
      color: #c7d2e1;
    }

    .overview-phase {
      color: #fdba74;
      background: rgba(var(--primary-color), 0.16);
    }

    .overview-progress-card {
      border-color: rgba(var(--primary-color), 0.28);
      background: linear-gradient(180deg, rgba(var(--primary-color), 0.16), rgba(42, 27, 14, 0.72));

      small {
        color: #f3d5bf;
      }

      strong {
        color: #fff7ed;
        text-shadow: 0 6px 24px rgba(var(--primary-color), 0.22);
      }

      span {
        color: #e7edf6;
      }
    }

    &.is-success {
      border-color: rgba(var(--success-color), 0.28);
      background:
        radial-gradient(circle at top right, rgba(var(--success-color), 0.16), transparent 32%),
        linear-gradient(135deg, #18261f, #101827 60%, #0f172a);

      .overview-copy h3 {
        color: #f8fafc;
      }

      .overview-copy p {
        color: #c7d2e1;
      }

      .overview-phase {
        color: #86efac;
        background: rgba(var(--success-color), 0.16);
      }

      .overview-progress-card {
        border-color: rgba(var(--success-color), 0.3);
        background: linear-gradient(180deg, rgba(var(--success-color), 0.12), rgba(19, 31, 24, 0.82));

        small {
          color: #b7c7bc;
        }

        strong {
          color: #86efac;
          text-shadow: 0 4px 18px rgba(var(--success-color), 0.18);
        }

        span {
          color: #d3dde8;
        }
      }
    }
  }

  .overview-copy p,
  .overview-progress-card span,
  .log-toolbar__copy span {
    color: var(--text-secondary);
  }

  .log-section {
    border-color: var(--border-default);
    background: linear-gradient(180deg, #131d2d, #0f172a);
  }

  .log-toolbar {
    background: rgba(15, 23, 42, 0.86);
  }

  .task-log {
    color: #e2e8f0;
    background: linear-gradient(180deg, #0b1220, #050b16);
    scrollbar-color: #475467 #0b1220;
  }

  :deep(.el-progress-bar__outer) {
    background: rgba(148, 163, 184, 0.16);
  }

  :deep(.el-progress-bar__innerText),
  :deep(.el-progress__text) {
    color: #f8fafc !important;
  }

  .task-actions :deep(.el-button:not(.el-button--primary):not(.el-button--danger)) {
    background: var(--surface-subtle);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .task-actions :deep(.el-button.is-plain.el-button--danger) {
    background: rgba(var(--error-color), 0.08);
    border-color: rgba(var(--error-color), 0.32);
    color: rgb(var(--error-color));
  }
}

.task-actions__group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.task-actions__group--tools {
  margin-right: 0;
}

.task-actions__retry {
  box-shadow: 0 10px 24px rgba(var(--primary-color), 0.2);
}

@keyframes taskSectionEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .overview-foot,
  .diagnostic-grid {
    grid-template-columns: 1fr;
  }

  .task-meta-card--wide {
    grid-column: auto;
  }

  .overview-hero {
    flex-direction: column;
  }

  .overview-progress-card {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .log-section {
    height: 420px;
    min-height: 420px;
    max-height: 420px;
  }

  .task-status {
    display: none;
  }

  .task-title {
    font-size: 18px;
  }

  .stage-list {
    grid-template-columns: 1fr;
  }

  .task-actions {
    align-items: stretch;
  }

  .task-actions__group {
    justify-content: flex-end;
  }

  .task-actions__group--tools {
    margin-right: 0;
  }
}

</style>
