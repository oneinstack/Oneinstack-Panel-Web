<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import softwareTaskStore from '@/sstore/softwareTask'

const props = defineProps<{
  modelValue: boolean
  taskId: string
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
const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    install: '安装',
    upgrade: '升级',
    uninstall: '卸载',
    start: '启动',
    stop: '停止',
    restart: '重启',
    reload: '平滑重载',
    configure: '配置发布'
  }
  return labels[task.value?.operation || ''] || '任务'
})
const logs = computed(() => softwareTaskStore.logs[props.taskId] || '等待脚本输出...')
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
    queued: '排队中',
    resolving: '正在获取安装包',
    prechecking: '正在检查环境',
    installing: '正在安装',
    upgrading: '正在升级',
    uninstalling: '正在卸载',
    starting: '正在启动服务',
    stopping: '正在停止服务',
    restarting: '正在重启服务',
    reloading: '正在平滑重载服务',
    configuring: '正在写入配置',
    verifying: '正在启动并验证',
    finalizing: '正在保存状态',
    canceling: '正在取消',
    rolling_back: '正在回滚',
    succeeded: `${operationLabel.value}成功`,
    failed: `${operationLabel.value}失败`,
    canceled: '已取消',
    interrupted: '任务已中断'
  }
  return labels[task.value?.status] || task.value?.status || '正在加载'
})
const elapsed = computed(() => {
  if (!task.value?.createdAt) return '0 秒'
  const end = task.value.finishedAt ? Date.parse(task.value.finishedAt) : now.value
  const seconds = Math.max(0, Math.floor((end - Date.parse(task.value.createdAt)) / 1000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} 分 ${seconds % 60} 秒`
})
const createdAtText = computed(() => {
  if (!task.value?.createdAt) return '时间未知'
  const value = new Date(task.value.createdAt)
  if (Number.isNaN(value.getTime())) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(value)
})
const componentInitial = computed(() => (task.value?.component || 'S').slice(0, 1).toUpperCase())

const stages = computed(() => {
  const currentProgress = task.value?.progress || 0
  const definitions = isServiceTask.value
    ? [
        { key: 'resolving', name: '获取控制脚本', end: 5 },
        { key: task.value?.operation || 'restart', name: `${operationLabel.value}服务`, end: 96 },
        { key: 'finalizing', name: '保存任务状态', end: 100 }
      ]
    : isConfigurationTask.value
    ? [
        { key: 'resolving', name: '获取配置脚本', end: 5 },
        { key: 'config_apply', name: '备份、校验并发布', end: 96 },
        { key: 'finalizing', name: '保存任务状态', end: 100 }
      ]
    : isUninstall.value
    ? [
        { key: 'resolving', name: '获取卸载包', end: 5 },
        { key: 'uninstall', name: '卸载组件', end: 96 },
        { key: 'finalizing', name: '保存状态', end: 100 }
      ]
    : [
        { key: 'resolving', name: '获取安装包', end: 5 },
        { key: 'precheck', name: '环境预检', end: 12 },
        {
          key: task.value?.operation === 'upgrade' ? 'upgrade' : 'install',
          name: task.value?.operation === 'upgrade' ? '升级软件' : '安装软件',
          end: 72
        },
        { key: 'configure', name: '写入配置', end: 84 },
        { key: 'verify', name: '启动并验证', end: 96 },
        { key: 'finalizing', name: '保存状态', end: 100 }
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
      ? '取消后系统会终止配置脚本；如果配置已经发布，会自动恢复发布前快照。确定继续吗？'
      : serviceTask
      ? `取消后系统会终止${operationLabel.value}脚本并重新核验服务状态，确定继续吗？`
      : uninstall
      ? '取消后系统会安全终止卸载脚本并重新核验组件状态；已经完成的组件步骤可能无法自动恢复。确定继续吗？'
      : '取消可能触发回滚，正在执行的不可中断步骤会先等待安全退出。确定继续吗？',
    configurationTask
      ? '取消配置发布任务'
      : serviceTask ? `取消${operationLabel.value}任务` : uninstall ? '取消卸载任务' : '取消安装任务',
    {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: configurationTask
        ? '继续发布'
        : serviceTask ? `继续${operationLabel.value}` : uninstall ? '继续卸载' : '继续安装'
    }
  )
  await softwareTaskStore.cancel(props.taskId)
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
  await navigator.clipboard.writeText(value)
  ElMessage.success('诊断信息已复制')
}

const downloadLog = async () => {
  if (!props.taskId || downloading.value) return
  downloading.value = true
  try {
    await softwareTaskStore.downloadLog(props.taskId)
    ElMessage.success('完整任务日志已开始下载')
  } catch (error: any) {
    ElMessage.error(error?.message || '下载任务日志失败')
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
  <el-drawer
    v-model="visible"
    class="install-task-drawer"
    size="720px"
    :close-on-click-modal="terminal"
    :destroy-on-close="false"
  >
    <template #header>
      <div class="task-header">
        <div class="task-header__top">
          <div class="task-header__identity">
            <div class="task-mark">{{ componentInitial }}</div>
            <div class="task-heading">
              <span class="task-kicker">软件任务</span>
              <div class="task-title">
                <strong>{{ task?.component || '软件' }}</strong>
                <span class="task-operation">{{ operationLabel }}</span>
                <small v-if="task?.requestedVersion">{{ task.requestedVersion }}</small>
              </div>
            </div>
          </div>
          <el-tag
            class="task-status"
            :type="task?.status === 'succeeded' ? 'success' : failed ? 'danger' : 'primary'"
            effect="plain"
            round
          >
            {{ statusText }}
          </el-tag>
        </div>
        <div class="task-meta">
          <span class="task-meta__item task-id">
            <small>任务 ID</small>
            <strong>{{ task?.id || '-' }}</strong>
          </span>
          <span class="task-meta__item" :class="{ 'task-meta__history': terminal }">
            <small>{{ terminal ? '任务类型' : '创建时间' }}</small>
            <strong>{{ terminal ? '历史任务' : createdAtText }}</strong>
          </span>
          <span class="task-meta__item">
            <small>已用时</small>
            <strong>{{ elapsed }}</strong>
          </span>
        </div>
      </div>
    </template>

    <div v-if="task" class="task-content">
      <section class="overview">
        <div class="overview-label">
          <span>当前进度</span>
          <span>{{ task.phase || task.status }}</span>
        </div>
        <div class="overview-line">
          <span>{{ task.message || statusText }}</span>
          <strong>{{ task.progress }}%</strong>
        </div>
        <el-progress
          :percentage="task.progress"
          :status="progressStatus"
          :stroke-width="9"
          :show-text="false"
          :indeterminate="task.phaseProgress === undefined && !terminal"
          :duration="3"
        />
      </section>

      <section class="stage-list">
        <div
          v-for="(stage, index) in stages"
          :key="stage.key"
          class="stage"
          :class="{ active: stage.active, done: stage.done }"
        >
          <span class="stage-dot">{{ stage.done ? '✓' : index + 1 }}</span>
          <div class="stage-copy">
            <small>STEP {{ String(index + 1).padStart(2, '0') }}</small>
            <span>{{ stage.name }}</span>
          </div>
        </div>
      </section>

      <el-alert
        v-if="failed"
        class="failure"
        type="error"
        :closable="false"
        show-icon
        :title="task.errorMessage || task.message"
      >
        <template #default>
          <div>
            错误码：{{
              task.errorCode || (isConfigurationTask
                ? 'CONFIG_APPLY_FAILED'
                : isServiceTask
                ? 'SERVICE_ACTION_FAILED'
                : isUninstall ? 'UNINSTALL_FAILED' : 'INSTALL_FAILED')
            }}
          </div>
          <div v-if="task.rollbackStatus && task.rollbackStatus !== 'not_required'">
            回滚状态：{{ task.rollbackStatus }}
          </div>
          <div v-if="task.recoveryStatus">
            重启核验：{{ task.recoveryStatus }} · {{ task.recoveryMessage }}
          </div>
        </template>
      </el-alert>

      <section class="log-section">
        <div class="log-toolbar">
          <div>
            <span class="log-live-dot"></span>
            <strong>实时任务日志</strong>
          </div>
          <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
        </div>
        <pre ref="logElement" class="task-log">{{ logs }}</pre>
      </section>
    </div>
    <el-skeleton v-else :rows="8" animated />

    <template #footer>
      <div class="task-actions">
        <el-button :loading="downloading" @click="downloadLog">下载完整日志</el-button>
        <el-button v-if="failed" @click="copyDiagnostics">复制诊断信息</el-button>
        <el-button
          v-if="failed && !isUninstall && !isServiceTask && !isConfigurationTask"
          type="primary"
          @click="emit('retry', taskId)"
        >
          重新填写并重试
        </el-button>
        <el-button v-if="cancelable" type="danger" plain @click="cancelTask">取消任务</el-button>
        <el-button type="primary" @click="visible = false">
          {{ terminal ? '完成' : '后台运行' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.task-header,
.overview-line,
.log-toolbar,
.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.task-header {
  width: 100%;
  min-width: 0;
  padding-right: 8px;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  gap: 13px;
  justify-content: flex-start;

  &__top {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__identity {
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.task-mark {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--primary-color), 0.18);
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background:
    linear-gradient(180deg, rgba(var(--primary-color), 0.12), rgba(var(--primary-color), 0.06)),
    var(--surface-card);
  font-size: 17px;
  font-weight: 780;
}

.task-heading {
  min-width: 0;
  flex: 1;
}

.task-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--text-placeholder);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.task-meta__history {
  color: var(--el-color-warning);
  font-weight: 650;
}

.task-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 740;
  line-height: 1.25;
  text-transform: capitalize;

  strong {
    min-width: 0;
    overflow: hidden;
    font-weight: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-operation {
    padding: 2px 8px;
    border-radius: 999px;
    color: var(--text-secondary);
    background: var(--surface-subtle);
    font-size: 12px;
    font-weight: 650;
  }

  small {
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 550;
  }
}

.task-meta {
  width: 100%;
  min-width: 0;
  padding: 9px 12px;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 0.72fr);
  gap: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-subtle);

  &__item {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1.35;

    small {
      flex: 0 0 auto;
      color: var(--text-placeholder);
      font-size: 10px;
      font-weight: 560;
    }

    strong {
      min-width: 0;
      overflow: hidden;
      font-weight: 620;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.task-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
}

.task-status {
  flex: 0 0 auto;
  min-height: 30px;
  padding-inline: 12px;
  font-weight: 650;
}

.task-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview {
  padding: 18px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 92%, var(--surface-subtle)), var(--surface-card));
  box-shadow: var(--shadow-xs);
}

.overview-label {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-placeholder);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.04em;

  span:last-child {
    padding: 3px 7px;
    border-radius: 6px;
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0;
  }
}

.overview-line {
  margin-bottom: 14px;
  color: var(--text-primary);

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    color: rgb(var(--primary-color));
    font-size: 20px;
    font-weight: 760;
  }
}

.stage-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stage {
  min-width: 0;
  min-height: 56px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--border-subtle);
  border-radius: 11px;
  color: var(--text-tertiary);
  background: var(--surface-card);
  text-align: left;
  transition: all 0.2s ease;
}

.stage-dot {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  color: var(--text-placeholder);
  background: var(--surface-subtle);
  font-size: 10px;
  font-weight: 750;
}

.stage-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  small {
    color: var(--text-placeholder);
    font-size: 8px;
    font-weight: 750;
    letter-spacing: 0.08em;
  }

  span {
    overflow: hidden;
    font-size: 11px;
    font-weight: 620;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.stage.active {
  border-color: rgba(var(--primary-color), 0.35);
  color: var(--el-color-primary);
  background: rgba(var(--primary-color), 0.06);

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
  background: rgba(var(--success-color), 0.045);

  .stage-dot {
    color: white;
    border-color: var(--el-color-success);
    background: var(--el-color-success);
  }

  .stage-copy small {
    color: rgb(var(--success-color));
  }
}

.failure {
  margin: 0;
  border-radius: 12px;
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--border-subtle));
}

.log-section {
  flex: 1;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.log-toolbar {
  min-height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);

  > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  strong {
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 680;
  }
}

.log-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--success-color));
  box-shadow: 0 0 0 4px rgba(var(--success-color), 0.1);
}

.task-log {
  box-sizing: border-box;
  flex: 1;
  min-height: 220px;
  max-height: none;
  margin: 0;
  padding: 16px 17px;
  overflow: auto;
  color: #d7e0ee;
  background: #101827;
  font: 11px/1.7 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-color: #475467 #101827;
}

.task-actions {
  width: 100%;
  justify-content: flex-end;
  flex-wrap: wrap;
}

:deep(.install-task-drawer) {
  top: 16px;
  right: 16px;
  bottom: auto;
  height: calc(100% - 32px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-page);
  box-shadow: -18px 16px 46px rgba(16, 24, 40, 0.14);
}

:deep(.install-task-drawer .el-drawer__header) {
  flex: 0 0 auto;
  min-height: 124px;
  padding: 22px 24px 16px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:deep(.install-task-drawer .el-drawer__close-btn) {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-self: flex-start;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--text-tertiary);
  transition: all 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.08);
  }
}

:deep(.install-task-drawer .el-drawer__body) {
  flex: 1 1 auto;
  min-height: 0;
  padding: 22px 24px 18px;
  overflow: auto;
  background: var(--surface-page);
}

:deep(.install-task-drawer .el-drawer__footer) {
  flex: 0 0 auto;
  margin: 0;
  padding: 14px 24px 22px;
  border-top: 1px solid var(--border-subtle);
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  border-radius: 0;
  background: var(--surface-card);
  box-shadow: 0 -8px 20px rgba(16, 24, 40, 0.05);
}

@media (max-width: 760px) {
  :deep(.install-task-drawer) {
    top: 8px;
    right: 8px;
    height: calc(100% - 16px);
    border-radius: 16px;
  }

  :deep(.install-task-drawer .el-drawer__header) {
    padding: 16px 18px 14px;
  }

  :deep(.install-task-drawer .el-drawer__body) {
    padding: 16px 18px;
  }

  :deep(.install-task-drawer .el-drawer__footer) {
    padding: 12px 18px 18px;
  }

  .task-header {
    align-items: flex-start;
    gap: 12px;
  }

  .task-header__top {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .task-status {
    margin-left: 58px;
  }

  .task-title {
    font-size: 16px;
  }

  .task-meta {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stage-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-meta {
    max-width: 70vw;
  }

  .task-log {
    min-height: 200px;
  }

  .task-actions {
    justify-content: flex-end;
  }
}
</style>
